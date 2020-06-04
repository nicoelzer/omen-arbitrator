require('dotenv').config()
const HDWalletProvider = require('@truffle/hdwallet-provider');

const infuraKey = process.env.INFURA_KEY; 
const mnemonic = process.env.MNEMONIC;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY

module.exports = {
  networks: {
     live: {
      provider: () => new HDWalletProvider(mnemonic, `https://mainnet.infura.io/v3/${infuraKey}`),
      network_id: 1,
      gas: 7000000,
      gasPrice: 8000000000,
     },
     rinkeby: {
       provider: () => new HDWalletProvider(mnemonic, `https://rinkeby.infura.io/v3/${infuraKey}`),
       network_id: 4,
       gas: 5500000,
       confirmations: 1,
       timeoutBlocks: 200,
       skipDryRun: true 
     },
     kovan: {
      provider: () => new HDWalletProvider(mnemonic, `https://kovan.infura.io/v3/${infuraKey}`),
      network_id: 42,
      gas: 5500000,
      confirmations: 1, 
      timeoutBlocks: 200, 
      skipDryRun: true
    },
    development: {
      host: "localhost",
      port: 8545, 
      network_id: "*"
    }
  },
  compilers: {
    solc: {
      version: "0.6.2",
    }
  },
  plugins: ['truffle-plugin-verify'],
  api_keys: { etherscan: etherscanApiKey }
}
