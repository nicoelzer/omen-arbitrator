var DXdaoArbitrator = artifacts.require("DXdaoArbitrator");
var RealitioProxy = artifacts.require("RealitioProxy");
var MockGenericScheme = artifacts.require("GenericScheme");
var MockRealitio = artifacts.require("Realitio");

module.exports = function(deployer) {
  deployer.deploy(MockGenericScheme);
  deployer.deploy(MockRealitio);
  deployer.deploy(DXdaoArbitrator);
  deployer.deploy(RealitioProxy);
};
