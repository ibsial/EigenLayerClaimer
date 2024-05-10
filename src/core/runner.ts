import {formatEther, JsonRpcProvider, Network, parseEther, Wallet} from 'ethers'
import {bigintToPrettyStr, c, defaultSleep, RandomHelpers} from '../utils/helpers'
import {exchangeConfig, goodGwei, Config, DEV} from '../../config'
import {getBalance, transfer, waitBalance, waitGwei} from '../periphery/web3Client'
import {chains, withdrawNetworks} from '../utils/constants'
import {ChainName} from '../utils/types'
import {withdraw} from '../periphery/exchange'
import {bridgeRelay} from '../periphery/relayBridge'
import {getChainsWithSufficientBalance} from '../periphery/utils'
import {telegram} from '../periphery/telegram'
import {sendClaimEigenlayerTx} from './eigenlayer'

async function claimEigenLayer(signer: Wallet, proxy: string | undefined) {
    if (DEV) {
        console.log(proxy)
    }
    let ethProvider = new JsonRpcProvider(RandomHelpers.getRandomElementFromArray(chains.Ethereum.rpc), new Network('Ethereum', 1), {
        staticNetwork: true
    })
    let eigenBalance = await getBalance(signer.connect(ethProvider), signer.address, chains.Ethereum.tokens.EIGEN.address)
    if (eigenBalance > 0n) {
        console.log(c.blue(`${formatEther(eigenBalance)} EIGEN already claimed`))
        return false
    }
    let needWithdraw = true
    let needBridge = true
    let leastToWithdraw = parseEther(exchangeConfig.toWithdraw.from.toString())
    let targetChain: ChainName = RandomHelpers.getRandomElementFromArray(Config.targetChains)
    if (targetChain == 'Ethereum') {
        needBridge = false
    }
    let targetProvider = new JsonRpcProvider(
        RandomHelpers.getRandomElementFromArray(chains[targetChain].rpc),
        new Network(targetChain, chains[targetChain].id),
        {staticNetwork: true}
    )
    let ethBalance = await getBalance(signer.connect(ethProvider), signer.address)
    let targetBalance = await getBalance(signer.connect(targetProvider), signer.address)

    if (!Config.notTouchEth) {
        let nonzeroNetworks = await getChainsWithSufficientBalance(
            Config.targetChains,
            signer.address,
            parseEther(Config.toLeave[targetChain].to.toString()) +
                parseEther(exchangeConfig.toWithdraw.from.toString()) +
                parseEther(RandomHelpers.getRandomNumber({from: 0.00003, to: 0.00005}).toString())
        )
        if (nonzeroNetworks.length > 0) {
            targetChain = RandomHelpers.getRandomElementFromArray(nonzeroNetworks).network
            needWithdraw = false
            console.log(c.yellow(`found enough native in ${targetChain}`))
        }

        if ((ethBalance * 95n) / 100n >= leastToWithdraw + parseEther(Config.toLeave['Ethereum'].to.toString())) {
            needWithdraw = false
            needBridge = false
        }
        if (targetBalance - parseEther(Config.toLeave[targetChain].from.toString()) >= leastToWithdraw) {
            needWithdraw = false
        }
    }
    console.log(c.underline(`need withdraw to ${targetChain}: ${needWithdraw} need bridge: ${needBridge}`))

    let withdrawAmount = 0
    if (needWithdraw) {
        let result = await withdraw(signer.address, exchangeConfig.toWithdraw, chains[targetChain].currency, targetChain)
        withdrawAmount = result.amount
        await waitBalance(targetProvider, signer.address, targetBalance)

        telegram.addMessage(telegram.symbols('robot') + `withdrew ${result.amount.toFixed(4)} ${chains[targetChain].currency} to ${targetChain}`)
        await defaultSleep(RandomHelpers.getRandomNumber({from: 10, to: 120}))
    }
    let toBridge: bigint
    if (needBridge) {
        if (!needWithdraw) {
            toBridge = targetBalance - parseEther(RandomHelpers.getRandomNumber(Config.toLeave[targetChain]).toString())
            if (toBridge < 0n) {
                console.log(c.red('target balance < amount to leave'))
                return true
            }
        } else {
            toBridge = parseEther(withdrawAmount.toString()) - parseEther(RandomHelpers.getRandomNumber({from: 0.00003, to: 0.00005}).toString())
        }
        let result = await bridgeRelay(signer.connect(targetProvider), chains[targetChain].currency, targetChain, 'Ethereum', toBridge)
        console.log(c.green(`bridged successfully ${chains[targetChain].explorer + result}`))
        telegram.addMessage(
            telegram.symbols('bridge') +
                `${targetChain} --> Ethereum ${bigintToPrettyStr(toBridge, 18n, 4)} ${chains[targetChain].currency} ${telegram.applyFormatting(
                    chains[targetChain].explorer + result,
                    'url'
                )}`
        )

        await waitBalance(ethProvider, signer.address, ethBalance)
        await defaultSleep(RandomHelpers.getRandomNumber({from: 10, to: 120}))
    }

    await waitGwei(goodGwei)
    let {hash, amount} = await sendClaimEigenlayerTx(signer, proxy)
    console.log(c.green(`claimed ${amount} EIGEN successfully ${chains.Ethereum.explorer + hash}`))
    telegram.addMessage(telegram.symbols('robot') + `Claimed ${amount} EIGEN ${telegram.applyFormatting(chains.Ethereum.explorer + hash, 'url')}`)
    return true
}

export {claimEigenLayer}
