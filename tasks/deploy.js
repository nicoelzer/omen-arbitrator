const { task } = require("hardhat/config");
const { expandTo18Decimals } = require('../test/shared/utilities');

task(
    "deploy",
    "Deploys the Arbitrator contract & verifies the contract on Etherscan"
)
    .addParam("realitio", "The realitio contract address")
    .addParam("owner", "The owner of the contract")
    .addParam("feerecipient", "The address that should receive the collected fees")
    .addParam("genericscheme", "The address of the genericScheme")
    .addFlag(
        "verify",
        "Additional (and optional) Etherscan contracts verification"
    )
    .setAction(async (taskArguments, hre) => {
        const {
          realitio,
          owner,
          feerecipient,
            verify,
            genericscheme
        } = taskArguments;

        const proposalDescriptionHash = 'QmZSDGCPixwn1UrqnmcscYcXq2HARgMFwfP7JJNXUsW9uU';
        const metaData = '';
        const disputeFee = expandTo18Decimals(20)

        await hre.run("clean");
        await hre.run("compile");

        const DXdaoArbitrator = hre.artifacts.require(
            "DXdaoArbitrator"
        );
        const arbitrator = await DXdaoArbitrator.new(
          realitio,
          owner,
          disputeFee,
          proposalDescriptionHash,
          metaData,
          feerecipient,
          genericscheme
        );

        if(verify) {
            await hre.run("verify", {
                address: arbitrator.address,
                constructorArguments: [realitio,
                  owner,
                  disputeFee,
                  proposalDescriptionHash,
                  metaData,
                  feerecipient,
                  genericscheme],
            });
        }

        console.log(`DXdaoArbitrator deployed at address ${arbitrator.address}`);
        if(verify) {
            console.log(`source code verified`);
        }
    });