import { ConfigType } from "./src/utils/types"

require('dotenv').config()

export const DEV = false

/**** GENERAL SETTINGS ****/
export const maxRetries = 3
export const shuffleWallets = true
export const sleepBetweenAccs = {from: 25 * 60, to: 50 * 60}

export const goodGwei = 30
export const gasMultiplier = {price: 1.3, limit: 1.3} // does not apply to Ethereum

export const telegramConfig = {
    need: true,
    telegramToken: "123144:adadafsads",
    telegramId: 12345
}

/******* IMPORTANT SETTINGS *******/
export const Config: ConfigType = {
    /* okx -> L2 -> |relay.link| -> Ethereum */
    targetChains: ['Arbitrum', 'Optimism', 'Linea', 'Base'], // 'Arbitrum' | 'Optimism' | 'Linea' | 'Base' | 'Zksync' | 'Ethereum'

    // setup withdraw/bridge amount in exchangeConfig

    notTouchEth: false, // will skip any balance checks and always withdraw and bridge the same amount if *true*
    toLeave: {
        Arbitrum: {from: 0.0003, to: 0.0008},
        Optimism: {from: 0.0003, to: 0.0008},
        Linea: {from: 0.0025, to: 0.004},
        Base: {from: 0.0025, to: 0.004},
        Zksync: {from: 0.01, to: 0.012}
    }
}

/********** OKX API DATA **********/
export const exchangeConfig = {
    toNetwork: 'Random', // 'Arbitrum' | 'Optimism' | 'Linea' | 'Base' | 'Ethereum'
    toWithdraw: {from: 0.0025, to: 0.0035},
    api: {
        // dont forget about .env
        apiKey: process.env.api_key,
        secret: process.env.api_secret,
        password: process.env.api_password
    }
}

