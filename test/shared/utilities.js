const { BigNumber } = require("ethers")

exports.expandTo18Decimals = (n) => {
  return BigNumber.from(n).mul(BigNumber.from(10).pow(18))
}