# ShuffleLink

The protocol behind SecuBit Wallet

### Protocol

```
CONNECTION:
SecuBit User --> (Connects to Coordinator over Socket.io) --> Coordinator

SERVER ROUND STATES:
State #1: Join round

Coordinator ---->  * Round Parameters         
                                     ----------> SecuBit User
                                                  - Verifies Round Parameters
                                                  - Signs fromAddress proof
                                                  - Generates Public/Private key
                                                  - Signs publicKey proof
                   * fromAddress  <-----------------------
                   * fromAddress Proof
                   * changeAddress
                   * publicKey
                   * publicKey Proof
Coordinator <--------
- Verifies fromAddress Proof
- Verifies publicKey Proof
- Verifies fromAddress balance

State #2: Round starts after enough SecuBit Users are connected and joined

Coordinator ---->  * Public Keys Array        
                   * Encrypted Onions Array  -----> SecuBit User       
                                                  - Decrypts 1 layer of each given encrypted onion
                                                  - Creates encrypted onion of toAddress with each remaining public keys in the array
                                                  - Shuffles onions in random order
Coordinator <-----  * Shuffled Onions Array <-------

# Repeat State #2 in series for each SecuBit User in the round until all onions have been fully decrypted revealing the shuffled toAddresses

State #3: Transaction Signing

Coordinator ----> * Array of From and Change Addresses  
                  * Array of To Addresses
                  * Array of UTXOs
                                    ---------------------> SecuBit User
                                                           - Verifies its own From, Change and To addresses are listed
                                                           - Creates and signs CoinJoin transaction
Coordinator  <--------------- * Signed TX <----------------
 - Combines all signatures
 - Broadcasts Transaction
```


### CoinJoin
[![Wikipedia: CoinJoin](https://upload.wikimedia.org/wikipedia/en/thumb/f/f0/CoinJoinExample.svg/640px-CoinJoinExample.svg.png)](https://en.wikipedia.org/wiki/CoinJoin)

### CoinShuffle

CoinShuffle: Practical Decentralized
Coin Mixing for Bitcoin:  
> Abstract.
The decentralized currency network Bitcoin is emerging as a
potential new way of performing financial transactions across the globe.
Its use of pseudonyms towards protecting users’ privacy has been an
attractive feature to many of its adopters. Nevertheless, due to the inherent
public nature of the Bitcoin transaction ledger, users’ privacy is severely
restricted to
linkable anonymity
, and a few transaction deanonymization
attacks have been reported thus far.
In this paper we propose CoinShuffle, a completely decentralized Bitcoin
mixing protocol that allows users to utilize Bitcoin in a truly anony-
mous manner. CoinShuffle is inspired by the accountable anonymous
group communication protocol Dissent and enjoys several advantages
over its predecessor Bitcoin mixing protocols. It does not require any
(trusted, accountable or untrusted) third party and it is perfectly com-
patible with the current Bitcoin system. CoinShuffle introduces only a
small communication overhead for its users, while completely avoiding
additional anonymization fees and minimalizing the computation and
communication overhead for the rest of the Bitcoin system.

[Source](https://crypsys.mmci.uni-saarland.de/projects/CoinShuffle/coinshuffle.pdf)

### Similar Frameworks

##### CashShuffle
https://cashshuffle.com

- Similarities:
  - Uses a combination of CoinJoin and Coinshuffle
  - Fully on-chain transactions


- Differences:
  - CashShuffle is BCH only. ShuffleLink will work on both BTC and BCH
  - CashShuffle is written in Python. ShuffleLink is written in JavaScript
  - CashShuffle requires a program download. ShuffleLink is cross platform (desktop, phone, tablet, chromebook) for any device that has a web browser


##### Shufflepuff
https://github.com/DanielKrawisz/Shufflepuff
