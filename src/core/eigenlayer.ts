import {Contract, formatEther, JsonRpcProvider, Network, Wallet} from 'ethers'
import {CredentialsType} from '../utils/types'
import {c, defaultSleep, RandomHelpers, retry} from '../utils/helpers'
import {estimateTx, getBalance, sendTx, transfer} from '../periphery/web3Client'
import {Config, DEV} from '../../config'
import {chains} from '../utils/constants'

const axios = require('axios')
const {HttpsProxyAgent} = require('https-proxy-agent')

async function getMessage(signer: Wallet, proxy: string | undefined) {
    if (proxy) {
        const agent = new HttpsProxyAgent(`http://${proxy}`)
        const response = await axios.get('https://claims.eigenfoundation.org/clique-eigenlayer-api/auth/web3/signature', {
            params: {
                address: await signer.getAddress()
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
            },
            proxy: false,
            httpsAgent: agent
        })
        return response.data.message
    } else {
        const response = await axios.get('https://claims.eigenfoundation.org/clique-eigenlayer-api/auth/web3/signature', {
            params: {
                address: await signer.getAddress()
            },
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
            }
        })
        return response.data.message
    }
}

async function getJWT(signer: Wallet, signature: string, proxy: string | undefined) {
    if (proxy) {
        const agent = new HttpsProxyAgent(`http://${proxy}`)
        const response = await axios.post(
            'https://claims.eigenfoundation.org/clique-eigenlayer-api/auth/login/wallet',
            {
                chainId: 1,
                address: await signer.getAddress(),
                signature,
                accountType: 'eigenlayer'
            },
            {
                headers: {
                    'user-agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
                },
                proxy: false,
                httpsAgent: agent
            }
        )
        return response.data
    } else {
        const response = await axios.post(
            'https://claims.eigenfoundation.org/clique-eigenlayer-api/auth/login/wallet',
            {
                chainId: 1,
                address: await signer.getAddress(),
                signature,
                accountType: 'eigenlayer'
            },
            {
                headers: {
                    'user-agent':
                        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
                }
            }
        )
        return response.data
    }
}
async function getCredentials(signer: Wallet, signature: string, jwt: string, proxy: string | undefined) {
    if (proxy) {
        const agent = new HttpsProxyAgent(`http://${proxy}`)
        const response = await axios.get('https://claims.eigenfoundation.org/clique-eigenlayer-api/campaign/eigenlayer/credentials', {
            params: {
                walletAddress: await signer.getAddress(),
                signature,
                chainId: '1'
            },
            headers: {
                'clq-jwt': jwt,
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
            },
            proxy: false,
            httpsAgent: agent
        })
        let body: CredentialsType = response.data
        return body
    } else {
        const response = await axios.get('https://claims.eigenfoundation.org/clique-eigenlayer-api/campaign/eigenlayer/credentials', {
            params: {
                walletAddress: await signer.getAddress(),
                signature,
                chainId: '1'
            },
            headers: {
                'clq-jwt': jwt,
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
            }
        })
        let body: CredentialsType = response.data
        return body
    }
}

async function getClaimData(signer: Wallet, proxy: string | undefined): Promise<CredentialsType> {
    return retry(
        async () => {
            const message = await getMessage(signer, proxy)
            if (DEV) {
                console.log(`got message:\n${message}`)
                await defaultSleep(3)
            }
            const signature = await signer.signMessage(message)
            if (DEV) {
                console.log(`got signature:\n${signature}`)
                await defaultSleep(3)
            }
            const jwt = await getJWT(signer, signature, proxy)
            if (DEV) {
                console.log(`got jwt:\n${JSON.stringify(jwt)}`)
                await defaultSleep(3)
            }
            const credentials = await getCredentials(signer, signature, jwt.jwtToken, proxy)
            if (DEV) {
                console.log(`got credentials:\n${JSON.stringify(credentials)}`)
                await defaultSleep(5)
            }
            return credentials
        },
        {retryInterval: 20}
    )
}

async function sendClaimEigenlayerTx(signer: Wallet, proxy: string | undefined): Promise<{hash: string; amount: string}> {
    return retry(
        async () => {
            let credentials = await getClaimData(signer, proxy)
            console.log(credentials.claimData)
            await defaultSleep(100)
            if (!credentials || credentials.claimData == null) {
                console.log(c.gray(`${signer.address} is not eligible`))
                return {hash: '', amount: '0'}
            }
            const eigenlayerContract = new Contract(credentials.claimData.contractAddress, credentials.claimData.abi, signer)
            let tx = {
                from: signer.address,
                to: await eigenlayerContract.getAddress(),
                value: 0,
                data: eigenlayerContract.interface.encodeFunctionData('claim', [
                    credentials.claimData.amount,
                    credentials.claimData.proof,
                    credentials.claimData.signature
                ])
            }
            console.log(`amount to claim: ${formatEther(credentials.claimData.amount)}`)
            let ethProvider = new JsonRpcProvider(RandomHelpers.getRandomElementFromArray(chains.Ethereum.rpc), new Network('Ethereum', 1), {
                staticNetwork: true
            })
            let claimHash = await sendTx(signer.connect(ethProvider), tx, {
                price: 1.05,
                limit: RandomHelpers.getRandomNumber({from: 1.05, to: 1.15}, 2)
            })
            if (!claimHash) return {hash: '', amount: '0'}
            return {hash: claimHash, amount: formatEther(credentials.claimData.amount)}
        },
        {retryInterval: 20}
    )
}

export {sendClaimEigenlayerTx}
