const { contract, ethers, waffle } = require('hardhat');
const { expect } = require('chai');
const { expandTo18Decimals } = require('./shared/utilities');
const provider = waffle.provider;

contract('DXdaoArbitrator', () => {
  let dXdaoArbiratorInstance, genericSchemeInstance, realitioInstance, ownerAddress, secondAddress;

  const proposalDescriptionHash = 'QmZSDGCPixwn1UrqnmcscYcXq2HARgMFwfP7JJNXUsW9uU';
  const metaData = 'MetaData';
  const disputeFee = expandTo18Decimals(1);
  const templateId = '2';
  const nonce = 0;
  const question = 'TheQuestion␟"Answer1","Answer2","Answer3"␟Business & Finance␟en_US';
  const timeout = '86400';
  const opening_ts = '1590994800';

  beforeEach('deploy contracts', async function () {
    [ownerAddress, secondAddress] = await ethers.getSigners();
  });

  describe('Arbitration', function () {
    beforeEach(async () => {
      dXdaoArbirator = await ethers.getContractFactory('DXdaoArbitrator');
      genericScheme = await ethers.getContractFactory('GenericScheme');
      realitio = await ethers.getContractFactory('Realitio');

      realitioInstance = await realitio.deploy();
      genericSchemeInstance = await genericScheme.deploy();
      dXdaoArbiratorInstance = await dXdaoArbirator.deploy(
        realitioInstance.address,
        ownerAddress.address,
        disputeFee,
        proposalDescriptionHash,
        metaData,
        ownerAddress.address,
        genericSchemeInstance.address
      );
      dXdaoArbiratorInstance2 = await dXdaoArbirator.deploy(
        realitioInstance.address,
        ownerAddress.address,
        disputeFee,
        proposalDescriptionHash,
        metaData,
        ownerAddress.address,
        genericSchemeInstance.address
      );
    });

    it('reverts deploying an invalid arbitrator contract', async () => {
      await expect(
        dXdaoArbirator.deploy(
          realitioInstance.address,
          ownerAddress.address,
          0,
          proposalDescriptionHash,
          metaData,
          ownerAddress.address,
          genericSchemeInstance.address
        )
      ).to.be.revertedWith('DXdaoArbitrator: INVALID_DISPUTE_FEE');
    });

    it('reverts updates from non-owner', async () => {
      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setRealitio(secondAddress.address)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setDAOstackPlugin(ownerAddress.address)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setDisputeFee(disputeFee)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setMetaData(metaData)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setFeeRecipient(secondAddress.address)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance
          .connect(secondAddress)
          .setDAOstackProposalDescriptionHash(proposalDescriptionHash)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).setOwner(ownerAddress.address)
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');
    });

    it('executes updates sent by the owner', async () => {
      await expect(
        dXdaoArbiratorInstance.connect(ownerAddress).setRealitio(realitioInstance.address)
      )
        .to.emit(dXdaoArbiratorInstance, 'SetRealitio')
        .withArgs(realitioInstance.address);

      await expect(
        dXdaoArbiratorInstance.connect(ownerAddress).setDAOstackPlugin(realitioInstance.address)
      )
        .to.emit(dXdaoArbiratorInstance, 'SetDAOstackPlugin')
        .withArgs(realitioInstance.address);

      await expect(dXdaoArbiratorInstance.connect(ownerAddress).setDisputeFee(disputeFee))
        .to.emit(dXdaoArbiratorInstance, 'SetDisputeFee')
        .withArgs(disputeFee);

      await expect(dXdaoArbiratorInstance.connect(ownerAddress).setMetaData(metaData))
        .to.emit(dXdaoArbiratorInstance, 'SetMetaData')
        .withArgs(metaData);

      await expect(
        dXdaoArbiratorInstance
          .connect(ownerAddress)
          .setDAOstackProposalDescriptionHash(proposalDescriptionHash)
      )
        .to.emit(dXdaoArbiratorInstance, 'SetDAOstackProposalDescriptionHash')
        .withArgs(proposalDescriptionHash);

      await expect(
        dXdaoArbiratorInstance.connect(ownerAddress).setFeeRecipient(realitioInstance.address)
      )
        .to.emit(dXdaoArbiratorInstance, 'SetFeeRecipient')
        .withArgs(realitioInstance.address);

      await expect(dXdaoArbiratorInstance.connect(ownerAddress).setOwner(realitioInstance.address))
        .to.emit(dXdaoArbiratorInstance, 'SetOwner')
        .withArgs(realitioInstance.address);
    });

    it('reverts executing updates with invalid data', async () => {
      await expect(
        dXdaoArbiratorInstance.connect(ownerAddress).setDisputeFee(0)
      ).to.be.revertedWith('DXdaoArbitrator: ZERO_FEE');
    });

    it('reverts arbitration request with invalid arbitrator', async () => {
      const questionTx = await realitioInstance.askQuestion(
        templateId,
        question,
        dXdaoArbiratorInstance2.address,
        timeout,
        opening_ts,
        nonce
      );

      const eventDetails = await provider.getTransactionReceipt(questionTx.hash);
      questionId = eventDetails.logs[0].topics[1];

      await realitioInstance.submitAnswer(questionId, ethers.utils.formatBytes32String(0), 1, {
        value: expandTo18Decimals(1),
      });

      await expect(dXdaoArbiratorInstance.requestArbitration(questionId, 0)).to.be.revertedWith(
        'DXdaoArbitrator: WRONG_ARBITRATOR'
      );
    });

    it('reverts arbitration request for finalized questions', async () => {
      const questionTx = await realitioInstance.askQuestion(
        templateId,
        question,
        dXdaoArbiratorInstance.address,
        timeout,
        opening_ts,
        nonce
      );

      const eventDetails = await provider.getTransactionReceipt(questionTx.hash);
      questionId = eventDetails.logs[0].topics[1];

      await realitioInstance.submitAnswer(questionId, ethers.utils.formatBytes32String(0), 1, {
        value: expandTo18Decimals(1),
      });

      await dXdaoArbiratorInstance.requestArbitration(questionId, 0);
      await dXdaoArbiratorInstance.connect(secondAddress).requestArbitration(questionId, 0, {
        value: disputeFee,
      });

      await expect(
        dXdaoArbiratorInstance
          .connect(secondAddress)
          .submitAnswerByArbitrator(
            questionId,
            ethers.utils.formatBytes32String(0),
            secondAddress.address
          )
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await dXdaoArbiratorInstance
        .connect(ownerAddress)
        .submitAnswerByArbitrator(
          questionId,
          ethers.utils.formatBytes32String(0),
          secondAddress.address
        );

      await expect(
        dXdaoArbiratorInstance.connect(secondAddress).requestArbitration(questionId, 0, {
          value: disputeFee,
        })
      ).to.be.revertedWith('DXdaoArbitrator: FINALIZED_QUESTION');
    });

    it('accepts an arbitration request', async () => {
      const questionTx = await realitioInstance.askQuestion(
        templateId,
        question,
        dXdaoArbiratorInstance.address,
        timeout,
        opening_ts,
        nonce
      );

      const eventDetails = await provider.getTransactionReceipt(questionTx.hash);
      questionId = eventDetails.logs[0].topics[1];

      await realitioInstance.submitAnswer(questionId, ethers.utils.formatBytes32String(0), 1, {
        value: expandTo18Decimals(1),
      });

      await dXdaoArbiratorInstance.requestArbitration(questionId, 0);
      await dXdaoArbiratorInstance.connect(secondAddress).requestArbitration(questionId, 0, {
        value: disputeFee,
      });

      await expect(
        dXdaoArbiratorInstance
          .connect(secondAddress)
          .submitAnswerByArbitrator(
            questionId,
            ethers.utils.formatBytes32String(0),
            secondAddress.address
          )
      ).to.be.revertedWith('DXdaoArbitrator: FORBIDDEN');

      await dXdaoArbiratorInstance
        .connect(ownerAddress)
        .submitAnswerByArbitrator(
          questionId,
          ethers.utils.formatBytes32String(0),
          secondAddress.address
        );

      expect(await dXdaoArbiratorInstance.disputeResolutionNotification(questionId)).to.eq(
        questionId
      );
    });
  });
});
