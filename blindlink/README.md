# Welcome to SecuBit Wallet
Note: This software is in Beta and should only be used on Testnet until thoroughly tested!

## What is SecuBit Wallet?
SecuBit Wallet was created to help preserve Bitcoin's fungibility. Today it is easy to trace Bitcoin transactions from address to address by simply using any public Block Explorer. SecuBit Wallet helps fix this.

To start, you will create a SecuBit Wallet and deposit Bitcoin to your Public address. SecuBit Wallet will automatically move your Bitcoin from your Public to your Private Wallet. This transfer happens by joining together all other SecuBit Wallet users in order to create a single transaction called a CoinJoin. Your Bitcoin can not be stolen since only you own and control your wallet keys and [no one can determine your Private Wallet addresses](https://github.com/acashmkj/SecuBit/blob/master/docs/blindlink.md). Let's help keep Bitcoin fungible!

## What SecuBit Wallet is not?

SecuBit Wallet is not a traditional Bitcoin wallet. You cannot use it to make a payment to someone else. Its only purpose right now is to move your Bitcoins from your Public Wallet to your Private Wallet securely without anyone knowing your Private Wallet addresses. You will have to use a separate Bitcoin wallet after your Bitcoin has been made Private in order to spend them. Ideally, use a full-node for your Private Wallet because 3rd-party balance queries can de-anonymize you.

## How to get started
1. [Download and install the Tor Browser](https://www.torproject.org/download/download-easy.html)
2. [Download SecuBit Wallet](https://github.com/acashmkj/SecuBit/archive/master.zip) and open (drag and drop) `secubitwallet.html` in the Tor Browser
3. Create a new SecuBit Wallet
4. Deposit Bitcoin into your Public Wallet
5. SecuBit Wallet will automatically enter you into CoinJoin rounds with every other SecuBit Wallet user
6. A successful round will send a portion of your Public Bitcoin into your Private Wallet
7. SecuBit Wallet will automatically add you into following rounds until all of your Public Bitcoin is moved to your Private Wallet

## Advantages
* [You don't need to trust anyone with your Bitcoin](https://github.com/acashmkj/SecuBit/blob/master/docs/blindlink.md)
* No extra fees except for the standard Bitcoin transaction miner fee per round
* Rounds are quick (Between 30 to 90 seconds per round)
* Can support many participants. More users, more privacy
* No need to download, compile, or configure a complex program. It's as simple as visiting a website in your Tor Browser. This also makes it fully cross platform on ANY device that can run a Tor Browser

## Questions
* What is SecuBit Wallet?
  - SecuBit Wallet securely connects you with many other users to create a single transaction called a CoinJoin. SecuBit Wallet will create you two wallets: Public and Private. You will deposit Bitcoin to the Public Wallet and SecuBit Wallet will automatically send it to your Private Wallet. By joining a combined transaction with as many people as possible it ensures the privacy of your Bitcoins in your Private Wallet. Not even the server can figure out which Private Wallet address is yours.


* Why is SecuBit Wallet needed?
  - To help preserve Bitcoin fungibility. Every Bitcoin transaction can be easily traced and balances determined. Not everyone needs to know how much Bitcoin you own by just visiting a Block Explorer.


* How is SecuBit Wallet trustless?
  - It uses a combination of CoinJoin and Chaum's Blind Signatures. You never hand over control to anyone and your Bitcoin can not be stolen. You can read more about the [techniques here](https://github.com/acashmkj/SecuBit/blob/master/docs/blindlink.md).


* Why do I have to use Tor?
  - Tor is necessary to protect the server from determining your Private Wallet addresses. No one but you knows the addresses of your Private Wallet.


* Are there any extra fees to use SecuBit Wallet?
  - No. The only fees you pay are the standard Bitcoin miner fee for each transaction.


* Why do I have to wait so long for Bitcoin to show up in my Private Wallet?
  - Every successful round will deposit a specific amount of Bitcoin into your Private Wallet. For beta testing purposes the output amount is really low so that more rounds can be run while using less Testnet Bitcoin. This will be changed later.

## Brainstorming

[Listed here](https://github.com/acashmkj/SecuBit/blob/master/docs/ideas.md)

## Testing Plan

[Listed here](https://github.com/acashmkj/SecuBit/blob/master/docs/testing.md)

## Future Features

[Listed here](https://github.com/acashmkj/SecuBit/blob/master/docs/future.md)

## Developers Corner

##### Build Web App

```
npm run build
```

##### Run Tests

```
npm run test
```

##### Run Dev Mode

```
npm run server

# Open new terminal tab

npm run dev
```

### Paranoid? Build SecuBit from the Bottom Up

1. Clone SecuBit Wallet `git clone https://github.com/acashmkj/SecuBit.git` and then `cd ./SecuBit`
2. Build bcoin from source `npm run build-bcoin`
3. Build web app `npm run build`
4. Copy built web app unto USB Drive `cp ./secubitwallet.html ...`
5. Run Tails
6. Copy `secubitwallet.html` from your USB Drive into your `Tor Persistent` folder
7. Connect to the internet and open `secubitwallet.html` in the Tor Browser
8. Start using SecuBit Wallet!
