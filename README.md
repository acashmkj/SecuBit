# Welcome to SecuBit Wallet

Note: This software is in Beta and should only be used on Testnet until thoroughly tested!

## How to get started

1.  Go to Secubit Website that os created.
2.  Click "Start BTC" or "Start BCH"
3.  Deposit bitcoin
4.  SecuBit Wallet will automatically create CoinJoin transactions with every other SecuBit Wallet user available
5.  Once at least one successful round has complete you can now spend!

## What is SecuBit Wallet?

SecuBit Wallet was created to help preserve bitcoin's fungibility. Today it is easy to trace bitcoin transactions from address to address by simply using any public Block Explorer. SecuBit Wallet helps fix this.

SecuBit Wallet automatically [CoinJoins](https://en.wikipedia.org/wiki/CoinJoin) your bitcoin with other SecuBit Wallet users breaking the on-chain transaction link. Your bitcoin can not be stolen since only you own and control your wallet keys and [no one can determine your private addresses](https://github.com/acashmkj/SecuBit/blob/master/docs/shufflelink.md) not even the server. Let's help keep bitcoin fungible!

## Advantages

- [You don't need to trust anyone with your bitcoin](https://github.com/acashmkj/SecuBit/blob/master/docs/shufflelink.md)
- No extra fees except for the standard bitcoin transaction miner fee per round
- Rounds are quick (Between 15 to 60 seconds per round)
- Can support many participants. More users, more privacy
- No need to download, compile, or configure a complex program. It's as simple as visiting a website. This also makes it fully cross platform on ANY device with a web browser

## Questions

- What is SecuBit Wallet?

  - SecuBit Wallet securely connects you with many other users to create a single transaction called a CoinJoin. SecuBit Wallet will create you two wallets: Public and Private. You will deposit bitcoin to the Public Wallet and SecuBit Wallet will automatically send it to your Private Wallet. By joining a combined transaction with as many people as possible it ensures the privacy of your bitcoins in your Private Wallet. Not even the server can figure out which Private Wallet address is yours.

- Why is SecuBit Wallet needed?

  - To help preserve bitcoin fungibility. Every bitcoin transaction can be easily traced and balances determined. Not everyone needs to know how much bitcoin you own by just visiting a Block Explorer.

- How is SecuBit Wallet trustless?

  - It uses a combination of CoinJoin and CoinShuffle. You never hand over control to anyone and your bitcoin can not be stolen. You can read more about the [techniques here](https://github.com/acashmkj/SecuBit/blob/master/docs/shufflelink.md).

- Are there any extra fees to use SecuBit Wallet?

  - No. The only fees you pay are the standard bitcoin miner fee for each transaction.

- Why did we build SecuBit Wallet?

  - For your donations and to compete for [this bounty](https://bitcointalk.org/index.php?topic=279249.msg2983911#msg2983911). Help support us if you like SecuBit Wallet!

- How can I help?
  - Help by using and contributing to SecuBit Wallet. The more people we have using it the faster we can find and fix bugs and improve the experience. Once we are sure SecuBit Wallet is safe and secure we can move it to the Mainnet. Donations are also much appreciated!

## Developers

##### Build Stand-alone Web App

```
git clone https://github.com/acashmkj/SecuBit.git /secubitwallet

cd ./secubitwallet

npm run build

# will produce file ./secubitwallet.html
```

##### Run Server (linux)

```
# Note: this may take a while (~40 minutes) for the script to finish
# ~12GB disk space needed for both tBTC and tBCH

git clone https://github.com/acashmkj/SecuBit.git /secubitwallet

cd /root/secubitwallet

sh ./scripts/start_tbtc_tbch

# btc only: $ sh ./scripts/start_tbtc
# bch only: $ sh ./scripts/start_tbch
```

##### Run Tests

```
npm run test
```

##### Run Dev Mode

```
npm run babel

npm run server

# Open new terminal tab

npm run dev
```

### Paranoid? Build SecuBit from the Bottom Up

1.  Clone SecuBit Wallet `git clone https://github.com/acashmkj/SecuBit.git` and then `cd SecuBit`
2.  Build bcoin, bcash and web app from source `npm run build`
3.  Copy built web app unto USB Drive `cp ./secubitwallet.html ...`
4.  Run Tails
5.  Copy `secubitwallet.html` from your USB Drive into your `Tor Persistent` folder
6.  Connect to the internet and open `secubitwallet.html` in the Tor Browser
7.  Start using SecuBit Wallet!

## Donations

BTC: [15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa](bitcoin:15fMSRKT8pP1XMfc6YM7ckH87uc9YaRcaa)

BCH: [1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9](bitcoincash:1BWTtWVk3U1JvgcV3mwDEaQDMpSpBzXLw9)
