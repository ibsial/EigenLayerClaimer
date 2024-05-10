import {Chain} from './types'

export const timeout = 5

export const withdrawNetworks: {[key: string]: {name: string; token: string; fee: string}} = {
    Optimism: {
        name: 'Optimism',
        token: 'ETH',
        fee: '0.00004'
    },
    Arbitrum: {
        name: 'Arbitrum One',
        token: 'ETH',
        fee: '0.0001'
    },
    Linea: {
        name: 'Linea',
        token: 'ETH',
        fee: '0.0002'
    },
    Base: {
        name: 'Base',
        token: 'ETH',
        fee: '0.00004'
    },
    Zksync: {
        name: 'zkSync Era',
        token: 'ETH',
        fee: '0.000041'
    },
    Ethereum: {
        name: 'ERC20',
        token: 'ETH',
        fee: '0.0029'
    }
}

export const chains: {[key: string]: Chain} = {
    Ethereum: {
        id: '1',
        lzId: '101',

        rpc: ['https://ethereum.publicnode.com'],
        explorer: 'https://etherscan.io/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            },
            EIGEN: {
                name: "Eigen",
                decimals: 18n,
                address: "0xec53bf9167f50cdeb3ae105f56099aaab9061f83"
            }
        }
    },
    Arbitrum: {
        id: '42161',
        lzId: '110',
        rpc: ['https://arbitrum-one.publicnode.com'],
        explorer: 'https://arbiscan.io/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    Optimism: {
        id: '10',
        lzId: '111',
        rpc: ['https://optimism-rpc.publicnode.com'],
        explorer: 'https://optimistic.etherscan.io/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    Base: {
        id: '8453',
        lzId: '184',
        rpc: ['https://base.publicnode.com'],
        explorer: 'https://basescan.org/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    Linea: {
        id: '59144',
        lzId: '183',
        rpc: ['https://rpc.linea.build'],
        explorer: 'https://lineascan.build/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    /* Bridge is not supported */
    Zksync: {
        id: '324',
        lzId: '165',

        rpc: ['https://mainnet.era.zksync.io'],
        explorer: 'https://explorer.zksync.io/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    /* Bridge is not supported */
    Bcs: {
        id: '56',
        lzId: '102',
        rpc: ['https://rpc.ankr.com/bsc'],
        explorer: 'https://bscscan.com/tx/',
        currency: 'BNB',
        tokens: {
            BNB: {
                name: 'Binance coin',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    OpBnb: {
        id: '204',
        lzId: '202',
        rpc: ['https://1rpc.io/opbnb'],
        explorer: 'https://opbnbscan.com/tx/',
        currency: 'BNB',
        tokens: {
            BNB: {
                name: 'Binance coin',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    /* Bridge is not supported */
    Polygon: {
        id: '137',
        lzId: '109',
        rpc: ['https://polygon.llamarpc.com'],
        explorer: 'https://polygonscan.com/tx/',
        currency: 'MATIC',
        tokens: {
            MATIC: {
                name: 'MATIC',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    /* Bridge is not supported */
    Avalanche: {
        id: '43114',
        lzId: '106',

        rpc: ['https://avalanche.public-rpc.com'],
        explorer: 'https://subnets.avax.network/c-chain/tx/',
        currency: 'AVAX',
        tokens: {
            AVAX: {
                name: 'AVAX',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    Scroll: {
        id: '534352',
        lzId: '214',
        rpc: ['https://rpc.scroll.io'],
        explorer: 'https://scrollscan.com/tx/',
        currency: 'ETH',
        tokens: {
            ETH: {
                name: 'Ethereum',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    },
    Mantle: {
        id: '5000',
        lzId: '181',
        rpc: ['https://rpc.mantle.xyz'],
        explorer: 'https://mantlescan.info/tx/',
        currency: 'MNT',
        tokens: {
            MNT: {
                name: 'Mantle',
                decimals: 18n,
                address: '0x0000000000000000000000000000000000000000'
            }
        }
    }
}
