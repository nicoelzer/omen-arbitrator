# DXdao Arbitrator #
A realit.io [arbitrator implementation](https://reality.eth.link/app/docs/html/arbitrators.html "arbitrator implementation") used by the DXdao to act as an arbitrator for disputed markets on [Omen](https://omen.eth.link "Omen").

## Getting started
To run the tests, follow these steps. You must have at least node v10 and [yarn](https://yarnpkg.com/) installed.

First clone the repository:

```sh
git clone https://github.com/nicoelzer/omen-arbitrator.git
```

Move into the dxswap-sdk working directory

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