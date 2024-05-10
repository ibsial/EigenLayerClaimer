import {Wallet, JsonRpcProvider, Contract, ZeroAddress, formatEther, Network} from 'ethers'
import {getBalance, getNativeBalance, approve, sendTx, estimateTx, sendRawTx} from './web3Client'
import {RandomHelpers, c, defaultSleep} from '../utils/helpers'
import axios from 'axios'
import {chains} from '../utils/constants'

async function needWithdraw(signerOrProvider: Wallet | JsonRpcProvider, address: string, amountWant: bigint, window = 12n, tokenAddress?: string) {
    let balance: bigint
    if (tokenAddress) {
        balance = await getBalance(signerOrProvider, address, tokenAddress)
    } else {
        balance = await getBalance(signerOrProvider, address)
    }
    if ((balance * window) / 10n < amountWant) {
        return true
    } else {
        return false
    }
}
async function getChainsWithSufficientBalance(networks: string[], address: string, amountWant: bigint) {
    let balanceData: {network: string; balance: bigint}[] = []
    for (let network of networks) {
        let provider = new JsonRpcProvider(RandomHelpers.getRandomElementFromArray(chains[network].rpc), new Network(network, chains[network].id), {
            staticNetwork: new Network(network, chains[network].id)
        })
        let balance = await getBalance(provider, address)
        if (balance >= amountWant) {
            balanceData.push({network: network, balance: balance})
        }
    }
    return balanceData
}
async function getPrice(currency = 'BNB') {
    try {
        let resp = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${currency}&tsyms=USD`)
        return parseFloat(resp.data.USD)
    } catch (e) {
        console.log(`could not fetch ${currency} price`)
        await defaultSleep(5)
        return getPrice(currency)
    }
}
async function changeIp(link: string) {
    if (link.length == 0) {
        return
    }
    try {
        await axios.get(link)
    } catch (e) {}
}
export {getPrice, needWithdraw, getChainsWithSufficientBalance, changeIp}
