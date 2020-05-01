const Migrations = artifacts.require("Migrations");
var OmenArbitrator = artifacts.require("OmenArbitrator");

module.exports = function(deployer) {
  deployer.deploy(Migrations);
  deployer.deploy(OmenArbitrator);
};
