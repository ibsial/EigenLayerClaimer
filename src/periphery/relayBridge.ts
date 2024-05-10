import {formatEther, Wallet} from 'ethers'
import {chains} from '../utils/constants'
import axios from 'axios'
import {estimateTx, sendRawTx} from './web3Client'
import {gasMultiplier} from '../../config'
import {c, retry} from '../utils/helpers'

async function bridgeRelay(signer: Wallet, currency = 'eth', fromNetwork: string, toNetwork: string, value: bigint): Promise<string> {
    return retry(async () => {
        const fromChainId = parseInt(chains[fromNetwork].id)
        const toChainId = parseInt(chains[toNetwork].id)
        let avgBridgeFee = 501_383_102_086_736n
        const quoteBridgeResp = await axios.post(
            'https://api.relay.link/execute/bridge',
            {
                user: await signer.getAddress(),
                originChainId: fromChainId,
                destinationChainId: toChainId,
                currency: currency.toLowerCase(),
                recipient: await signer.getAddress(),
                amount: (value - avgBridgeFee).toString(),
                usePermit: false,
                source: 'relay.link'
            },
            {
                headers: {
                    Host: 'api.relay.link',
                    Origin: 'https://relay.link',
                    Referer: 'https://relay.link/',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                }
            }
        )
        let bridgeFee = BigInt(quoteBridgeResp.data?.fees.relayer)
        const bridgeResp = await axios.post(
            'https://api.relay.link/execute/bridge',
            {
                user: await signer.getAddress(),
                originChainId: fromChainId,
                destinationChainId: toChainId,
                currency: currency.toLowerCase(),
                recipient: await signer.getAddress(),
                amount: (value - bridgeFee).toString(),
                usePermit: false,
                source: 'relay.link'
            },
            {
                headers: {
                    Host: 'api.relay.link',
                    Origin: 'https://relay.link',
                    Referer: 'https://relay.link/',
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
                }
            }
        )
        let tx = bridgeResp.data?.steps[0].items[0].data
        let testTx = {...tx}
        testTx.value = 1000000000n
        let estimate = await estimateTx(signer, testTx, gasMultiplier.limit)
        let cost = (BigInt(tx?.gasPrice ?? tx?.maxFeePerGas) * BigInt(estimate) * 15n) / 10n
        tx.value = BigInt(tx?.value) - cost
        tx.gasLimit = estimate
        console.log(c.yellow(`bridging ${formatEther(tx.value)} ETH from ${fromNetwork} to ${toNetwork}`))
        return sendRawTx(signer, tx, true)
    }, {})
}

export {bridgeRelay}
