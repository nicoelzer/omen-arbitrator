# DXdao Arbitrator #
A realit.io [arbitrator implementation](https://reality.eth.link/app/docs/html/arbitrators.html "arbitrator implementation") used by the DXdao to act as an arbitrator for disputed markets on [Omen](https://omen.eth.link "Omen").

## Arbitration Process
As soon as a Omen market is being resolved through [realitio](https://reality.eth.link/app/ "realitio"), anybody who denies the result of the community-driven resolution can trigger a dispute resolution process by the DXdao, by paying a fee. The DXdao will find consens through their governance process and submit a final outcome to the market.

## Deployed Contracts

| Network | Address |
| -------- | -------- |
| xDai | [0xFe14059344b74043Af518d12931600C0f52dF7c5](https://blockscout.com/poa/xdai/address/0xFe14059344b74043Af518d12931600C0f52dF7c5)     |

## Getting started
To run the tests, follow these steps. You must have at least node v10 and [yarn](https://yarnpkg.com/) installed.

First clone the repository:

```sh
git clone https://github.com/nicoelzer/omen-arbitrator.git
```

Move into the omen-arbitrator working directory

```sh
cd omen-arbitrator/
```

Install dependencies

```sh
yarn install
```

Run tests

```sh
yarn test
```

## Deploying Contracts

Create a new .env file in the main directory with the following variables:

```sh
PRIVATE_KEY=xxx
INFURA_KEY=xxx
```

Deploying contracts to xDai:
```sh
yarn deploy:xdai
```

Deploying contracts to Mainnet:
```sh
yarn deploy:mainnet
```