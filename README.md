## Claim your EIGEN tokens automatically! 

## Installation and setup
1. rename 
    - `config_example.ts` to `config.ts`  
    - `example.privates.txt` to `privates.txt`  
    - `example.proxies.txt` to `proxies.txt`  
    - `env` to `.env`
2. paste your privates to `privates.txt`, `okx API data to '.env'` and setup a script you will use in `config.ts`  
3. install depencies `npm i`  
4. run script `npm run start`

## How it works
- When *untouch eth* mode is **active**, script withdraws to specified chain and bridges via relay.link to ethereum
- When *untouch eth* mode is **turned off**, script will check Ethereum and L2 balances, withdraw ETH if needed
> Note that relay.link takes more fee the more ETH you bridge

## Donos and contact

> telegram: **https://t.me/findmeonchain**  
donos: **[0x00000c7c61c5d7fbbf217ab9fc64f6016390d4ba](https://debank.com/profile/0x00000c7c61c5d7fbbf217ab9fc64f6016390d4ba)**  
Note: _I mostly write in russian, but feel free to join and chat in english_

*Using this code you agree to take full responsibility for any unexpected losses or bugs*