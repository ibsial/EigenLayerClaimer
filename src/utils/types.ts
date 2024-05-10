export declare type FeeType = {maxFeePerGas: bigint; maxPriorityFeePerGas: bigint} | {gasPrice: bigint}

export declare type Chain = {
    id: string
    lzId: string
    rpc: string[]
    explorer: string
    currency: string
    tokens: {
        [key: string]: {
            name: string
            decimals: bigint
            address: string
        }
    }
}
export declare type ConfigType = {
    /* okx -> L2 -> |relay.link| -> Ethereum */
    targetChains: string[] // 'Arbitrum' | 'Optimism' | 'Linea' | 'Base' | 'Zksync' | 'Ethereum'

    // setup withdraw/bridge amount in exchangeConfig

    notTouchEth: boolean // will skip any balance checks and always withdraw and bridge the same amount
    toLeave: {[key: ChainName]: {from: number; to: number}}
}
export declare type ChainName =
    | 'Ethereum'
    | 'Arbitrum'
    | 'Optimism'
    | 'Base'
    | 'Linea'
    | 'Zksync'
    | 'Bcs'
    | 'OpBnb'
    | 'Polygon'
    | 'Avalanche'
    | 'Scroll'
    | 'Mantle'
    | string

export declare type CredentialsType = {
    queryId: string
    status: string
    data: {
        pipelines: {
            tokenQualified: number
            bonus: number
        }
    }
    claimData: {
        contractAddress: string
        abi: any[]
        walletConfig: {
            walletTypes: [string, string]
            ecosystem: string
            network: string
            networkID: number
            chainID: string
            rpcURL: string
            blockExplorerURL: string
        }
        proof: string[]
        amount: string
        signature: string
    } | null
}
