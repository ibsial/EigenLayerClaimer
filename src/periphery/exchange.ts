import {parseEther} from 'ethers'
import {DEV, exchangeConfig} from '../../config'
import {timeout, withdrawNetworks} from '../utils/constants'
import {c, log, defaultSleep, RandomHelpers, retry, sleep} from '../utils/helpers'
import {Balances, okx} from 'ccxt'
// import {defaultSleep, retry} from '../../utils/helpers'

class Okx {
    config = exchangeConfig
    api: okx
    constructor() {
        this.api = new okx(this.config.api)
    }
    async getBalance(currency = 'ETH') {
        try {
            let res: Balances = await retry(this.api.fetchBalance.bind(this.api), {}, {type: 'funding'})
            return res[currency]?.free ?? 0
        } catch (e: any) {
            log(e?.message)
            return 0
        }
    }
    async withraw(
        toAddress: string,
        tier: {from: number; to: number},
        currency = 'ETH',
        network = 'Optimism',
        waitBalance = true
    ): Promise<{amount: number; chain: string}> {
        try {
            if (DEV) {
                console.log(`withdrawing ${currency} to ${network}`)
            }
            let val = RandomHelpers.getRandomNumber(tier)
            let balance = await this.getBalance(currency)
            process.stdout.write(`current exchange balance: ${c.underline(balance)} ${currency} want to withdraw: ${c.underline(val)} ${currency}`)
            let i = 0
            let max = waitBalance ? 1000 : 6
            while (i < max) {
                if (balance >= val) break
                if (i != 0) {
                    process.stdout.clearLine(0) // clear current text
                    process.stdout.cursorTo(0)
                    process.stdout.write(
                        `current exchange balance: ${c.underline(balance.toString())} ${currency} want to withdraw: ${c.underline(
                            val.toString()
                        )} ${currency} | ${((((i + 1) * timeout) / (max * timeout)) * 100).toFixed(0)}%`
                    )
                }
                await this.transferFromSub()
                balance = await this.getBalance(currency)
                val = RandomHelpers.getRandomNumber(tier)
                i++
                await defaultSleep(timeout, false)
            }
            log()
            if (i >= max) {
                console.log('Low exchange balance')
                return {amount: 0, chain: network}
            }
            await retry(this.api.withdraw.bind(this.api), {}, currency, val, toAddress, {
                fee: withdrawNetworks[network].fee,
                network: withdrawNetworks[network].name,
                password: this.config.api.password
            })
            return {amount: val, chain: network}
        } catch (e: any) {
            log(e?.message)
            return this.withraw(toAddress, tier, currency, network, waitBalance)
        }
    }
    async transferFromSub() {
        let accs = await this.getNonZeroSubacc()
        let okxBalance
        if (accs.length > 0) {
            let res = await this.transferToMain(accs)
            if (!res) {
                await defaultSleep(30)
            }
        }
        okxBalance = BigInt(parseEther((await retry(this.getBalance.bind(this), {})).toString()))
    }
    async getNonZeroSubacc(currency = 'ETH') {
        // get acc list
        let resp = await this.api.privateGetUsersSubaccountList()
        // get accs names
        let accs = []
        for (let acc of resp['data']) {
            accs.push(acc['subAcct'])
        }
        // get non zero balance accs
        let nonZeroAccs = []
        for (let acc of accs) {
            let resp = await this.api.privateGetAssetSubaccountBalances({
                subAcct: acc,
                currency: currency
            })
            if (resp.data.length > 0) {
                for (let balances of resp.data) {
                    if (balances.ccy == currency) {
                        nonZeroAccs.push({name: acc, balance: balances['availBal']})
                    }
                }
            }
        }
        // log(`accs with nonZero ${currency} balance:`, nonZeroAccs)
        return nonZeroAccs
    }
    async transferToMain(subAccounts: any[], currency = 'ETH') {
        let res
        for (let acc of subAccounts) {
            res = await this.api.transfer(currency, acc.balance, 'funding', 'funding', {
                type: '2',
                subAcct: acc.name
            })
            log(c.green(`\nfound ${res.amount} ETH on subacc`))
        }
        return res
    }
}

async function withdraw(
    toAddress: string,
    tier: {from: number; to: number},
    currency = 'ETH',
    network = 'Optimism',
    waitBalance = true
): Promise<{amount: number; chain: string}> {
    const binanceExch = new Okx() // lets call it a 'feature' lol
    await defaultSleep(1, false)
    return binanceExch.withraw(toAddress, tier, currency, network, waitBalance)
}

export {withdraw}
