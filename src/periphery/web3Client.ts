import {ERC20__factory} from '../../typechain/factories'
import {ethers, Wallet, JsonRpcProvider, TransactionRequest, parseUnits, BigNumberish, TransactionResponse, formatEther} from 'ethers'
import {defaultSleep, RandomHelpers, retry} from '../utils/helpers'
import {DEV} from '../../config'
import {chains} from '../utils/constants'
require('dotenv').config()

async function getNativeBalance(signerOrProvider: Wallet | JsonRpcProvider, address: string): Promise<bigint> {
    return signerOrProvider.provider?.getBalance(address)!
}
async function getTokenBalance(signerOrProvider: Wallet | JsonRpcProvider, tokenAddress: string, address: string): Promise<bigint> {
    const tokenContract = ERC20__factory.connect(tokenAddress, signerOrProvider)
    return tokenContract.balanceOf(address)
}
async function getBalance(signerOrProvider: Wallet | JsonRpcProvider, address: string, tokenAddress?: string): Promise<bigint> {
    return retry(
        async () => {
            if (tokenAddress) {
                return getTokenBalance(signerOrProvider, tokenAddress, address)
            } else {
                return getNativeBalance(signerOrProvider, address)
            }
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function waitBalance(signerOrProvider: Wallet | JsonRpcProvider, address: string, balanceBefore: bigint, tokenAddress?: string) {
    process.stdout.write(`waiting balance`)
    let currentBalance = await getBalance(signerOrProvider, address, tokenAddress)
    while (currentBalance <= balanceBefore) {
        currentBalance = await getBalance(signerOrProvider, address, tokenAddress)
        await defaultSleep(10, false)
    }
    process.stdout.write(` --> received ${formatEther(currentBalance - balanceBefore)}\n`)
    return true
}
async function needApprove(
    signerOrProvider: Wallet | JsonRpcProvider,
    tokenAddress: string,
    from: string,
    to: string,
    minAllowance: BigNumberish
): Promise<boolean> {
    return retry(
        async () => {
            const tokenContract = ERC20__factory.connect(tokenAddress, signerOrProvider)
            let allowance = await tokenContract.allowance(from, to)
            if (DEV) {
                console.log(`allowance:${allowance}, want allowance: ${minAllowance}`)
            }
            if (allowance >= BigInt(minAllowance)) {
                return false
            } else {
                return true
            }
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function approve(signer: Wallet, tokenAddress: string, to: string, amount: BigNumberish, minAllowance?: BigNumberish) {
    if (minAllowance) {
        let approveRequired = await needApprove(signer, tokenAddress, await signer.getAddress(), to, minAllowance)
        if (!approveRequired) {
            return ''
        }
    }
    const tokenContract = ERC20__factory.connect(tokenAddress, signer)
    let tx = {
        from: await signer.getAddress(),
        to: await tokenContract.getAddress(),
        data: tokenContract.interface.encodeFunctionData('approve', [to, amount])
    }
    return sendTx(signer, tx)
}
async function transfer(
    signer: Wallet,
    to: string,
    amount: BigNumberish,
    tokenAddress?: string,
    gasMultipliers?: {
        price: number
        limit: number
    }
) {
    if (tokenAddress) {
        const tokenContract = ERC20__factory.connect(tokenAddress, signer)
        let tx = {
            from: await signer.getAddress(),
            to: await tokenContract.getAddress(),
            data: tokenContract.interface.encodeFunctionData('transfer', [to, amount])
        }
        return sendTx(signer, tx, gasMultipliers)
    } else {
        let tx = {
            from: await signer.getAddress(),
            to: to,
            value: amount
        }
        return sendTx(signer, tx, gasMultipliers)
    }
}
async function getGwei(signerOrProvider: Wallet | JsonRpcProvider, multiplier = 1.3): Promise<{gasPrice: bigint}> {
    return retry(
        async () => {
            let fee = await signerOrProvider.provider!.getFeeData()
            return {gasPrice: (fee?.gasPrice! * parseUnits(multiplier.toString(), 3)) / 1000n}
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function getGasPrice(
    signerOrProvider: Wallet | JsonRpcProvider,
    multiplier = 1.3
): Promise<{maxFeePerGas: bigint; maxPriorityFeePerGas: bigint} | {gasPrice: bigint}> {
    return retry(
        async () => {
            let fee = await signerOrProvider.provider!.getFeeData()
            if (fee.gasPrice !== null) {
                return {gasPrice: (fee?.gasPrice! * parseUnits(multiplier.toString(), 3)) / 1000n}
            } else {
                return {
                    maxFeePerGas: (fee?.maxFeePerGas! * parseUnits(multiplier.toString(), 3)) / 1000n,
                    maxPriorityFeePerGas: (fee?.maxPriorityFeePerGas! * parseUnits(multiplier.toString(), 3)) / 1000n
                }
            }
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function waitGwei(want: number = 40) {
    let signerOrProvider = new JsonRpcProvider(RandomHelpers.getRandomElementFromArray(chains.Ethereum.rpc))
    let {gasPrice} = await getGwei(signerOrProvider, 1)
    let printed = false
    while ((gasPrice * 95n) / 100n > parseUnits(want.toString(), 'gwei')) {
        if (!printed) {
            console.log(`wait gwei ${new Date().toLocaleString()}`)
            printed = true
        }
        await defaultSleep(60)
        gasPrice = (await getGwei(signerOrProvider, 1)).gasPrice
    }
}
async function getTxStatus(signerOrProvider: Wallet | JsonRpcProvider, hash: string, maxWaitTime = 5 * 60): Promise<string> {
    return retry(
        async () => {
            let time = 0
            while (time < maxWaitTime) {
                let receipt = await signerOrProvider.provider?.getTransactionReceipt(hash)
                if (receipt?.status == 1) {
                    return receipt.hash
                } else {
                    await new Promise((resolve) => setTimeout(resolve, 5 * 1000))
                    time += 5
                }
            }
            console.log(`could not get tx status in ${(maxWaitTime / 60).toFixed(1)} minutes`)
            throw new Error('Tx failed or receipt not found')
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function estimateTx(signer: Wallet, txBody: TransactionRequest, multiplier = 1.3) {
    return retry(
        async () => {
            return ((await signer.estimateGas(txBody)) * parseUnits(multiplier.toString(), 3)) / 1000n
        },
        {maxRetryCount: 20, retryInterval: 10}
    )
}
async function sendTx(signer: Wallet, txBody: TransactionRequest, gasMultipliers = {price: 1.3, limit: 1.3}, waitConfirmation = true) {
    let gasLimit = txBody?.gasLimit ?? (await estimateTx(signer, txBody, gasMultipliers.limit))
    txBody.gasLimit = gasLimit
    let fee = await getGasPrice(signer, gasMultipliers.price)
    txBody = {...txBody, ...fee}
    let txReceipt: TransactionResponse = await retry(signer.sendTransaction.bind(signer), {maxRetryCount: 3, retryInterval: 20}, txBody)
    if (waitConfirmation) {
        return getTxStatus(signer, txReceipt.hash)
    } else {
        return txReceipt.hash
    }
}
async function sendRawTx(signer: Wallet, txBody: TransactionRequest, waitConfirmation = true) {
    let txReceipt: TransactionResponse = await retry(signer.sendTransaction.bind(signer), {maxRetryCount: 3, retryInterval: 20}, txBody)
    if (waitConfirmation) {
        return getTxStatus(signer, txReceipt.hash)
    } else {
        return txReceipt.hash
    }
}

export {getGwei, waitGwei, estimateTx, getNativeBalance, getBalance, waitBalance, approve, transfer, sendTx, sendRawTx}
