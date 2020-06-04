const { accounts, contract, web3 } = require('@openzeppelin/test-environment');

const {
  BN,           
  constants,    
  expectEvent, 
  expectRevert, 
} = require('@openzeppelin/test-helpers');

const { expect } = require('chai');
const [ __owner,__user1 ] = accounts;

const DXdaoArbitrator = contract.fromArtifact('DXdaoArbitrator');
const GenericScheme = contract.fromArtifact('GenericScheme');
const Realitio = contract.fromArtifact('Realitio');
const RealitioProxy = contract.fromArtifact('RealitioProxy');

describe('RealitioProxy', function () {

  before(async () => {
    __arbitrator1 = await DXdaoArbitrator.new({ from: __owner });
    __arbitrator1Address = __arbitrator1.address;
    __arbitrator2 = await DXdaoArbitrator.new({ from: __owner });
    __arbitrator2Address = __arbitrator2.address;
    __proxy = await RealitioProxy.new({ from: __owner });
    __proxyAddress = __proxy.address;
    __genericScheme = await GenericScheme.new({ from: __owner });
    __genericSchemeAddress = __genericScheme.address;
    __realitio = await Realitio.new({ from: __owner });
    __realitioAddress = __realitio.address;
    __disputeFee = web3.utils.toWei('0.0000001', 'ether');
    __proposalDescriptionHash = 'QmZSDGCPixwn1UrqnmcscYcXq2HARgMFwfP7JJNXUsW9uU'
    __avatarAddress = accounts[5];
    __template_id = "2";
    __question = 'TheQuestion␟"Answer1","Answer2","Answer3"␟Business & Finance␟en_US';
    __question2 = 'TheQuestion␟"Answer0","Answer1","Answer2"␟Business & Finance␟en_US';
    __question3 = 'TheQuestion␟"A0","A1","A2","A3"␟Business & Finance␟en_US';
    __timeout = "86400";
    __opening_ts = "1590994800";
    __opening_ts2 = "1590996800";
    __opening_ts3 = "1590996700";
    __opening_ts4 = "1590996500";
    __nonce = 0;
    __answers = ["Answer1","Answer2","Answer3"];
    __answers2 = ["A0","A1","A2","A3"];
  });

  it('should revert arbitrator setters called by non-owner addresses', async function () {
    await expectRevert(
      __arbitrator1.setRealitio(__realitioAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await expectRevert(
      __arbitrator1.setDisputeFee(__disputeFee, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await expectRevert(
      __arbitrator1.setFeeRecipient(__owner, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await expectRevert(
      __arbitrator1.setDAOstackProposalDescriptionHash(__proposalDescriptionHash, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await expectRevert(
      __arbitrator1.setDAOstackAvatar(__avatarAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );

   
  });

  it("should revert proxy setters called by non-owner addresses", async function () {
    await expectRevert(
      __proxy.setRealitio(__realitioAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await expectRevert(
      __proxy.activateAnswerStorage(__arbitrator1Address, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
  });

  it("should allow owners to exectute setters", async function () {
    const txSetRealitio = await __arbitrator1.setRealitio(__realitioAddress, { from: __owner });
    expectEvent(txSetRealitio, 'SetRealitio', { realitio: __realitioAddress });
    
    const txSetDisputeFee = await __arbitrator1.setDisputeFee(__disputeFee, { from: __owner });
    expectEvent(txSetDisputeFee, 'SetDisputeFee', { fee: __disputeFee });

    const txSetFeeRecipient = await __arbitrator1.setFeeRecipient(__owner, { from: __owner });
    expectEvent(txSetFeeRecipient, 'SetFeeRecipient', { recipient: __owner });

    const txSetProposalDescription = await __arbitrator1.setDAOstackProposalDescriptionHash(__proposalDescriptionHash, { from: __owner });
    expectEvent(txSetProposalDescription, 'SetDAOstackProposalDescriptionHash', { descriptionHash: __proposalDescriptionHash });

    const txSetDAOstackAvatar = await __arbitrator1.setDAOstackAvatar(__avatarAddress, { from: __owner });
    expectEvent(txSetDAOstackAvatar, 'SetDAOstackAvatar', { avatar: __avatarAddress });

    const txSetRealitioAddr = await __proxy.setRealitio(__realitioAddress, { from: __owner });
    expectEvent(txSetRealitioAddr, 'SetRealitio', { realitio: __realitioAddress });

    const txActivateAnswerStorage = await __proxy.activateAnswerStorage(__arbitrator1Address, { from: __owner });
    expectEvent(txActivateAnswerStorage, 'ActivateAnswerStorage', { arbitrator: __arbitrator1Address });
  });

  it("should allow switching off and on answerStorage ", async function () {
    expect(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address)).to.be.equal(true);
    await __proxy.deactivateAnswerStorage(__arbitrator1Address, { from: __owner });
    expect(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address)).to.be.equal(false);
    await __proxy.activateAnswerStorage(__arbitrator1Address, { from: __owner });
    expect(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address)).to.be.equal(true);
  });

  it("should not store answers on-chain by default", async function () {
    const questionId = await __proxy.askQuestion.call(__template_id,__question,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    const answerArray = await __proxy.getAnswersByQuestionId.call(questionId);
    expect(await answerArray.length).to.be.equal(0);
  });

  it("should store answers on-chain when activated for given arbitrator", async function () {
    await __proxy.activateAnswerStorage(__arbitrator2Address, { from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question2,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    await __proxy.askQuestion(__template_id,__question2,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    const answerArray = await __proxy.getAnswersByQuestionId.call(questiondId);
    expect(await answerArray.length).to.be.equal(3);
  });

  it("should revert arbitration request when proxy is not set", async function () {
    await __arbitrator2.setRealitio(__realitioAddress, { from: __owner });
    await __arbitrator1.setDisputeFee(__disputeFee, { from: __owner });
    await __arbitrator2.setDisputeFee(__disputeFee, { from: __owner });
    await __arbitrator2.setFeeRecipient(__owner, { from: __owner });
    await __arbitrator2.setDAOstackProposalDescriptionHash(__proposalDescriptionHash, { from: __owner });
    await __arbitrator2.setDAOstackAvatar(__avatarAddress, { from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers2, { from: __owner });
    await __proxy.askQuestion(__template_id,__question3,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers2, { from: __owner });
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    
    await expectRevert(
      __arbitrator1.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "DXdaoArbitrator: NO_REALITIOPROXY_ADDRESS"
    );
  });

  it("should revert arbitration request with wrong arbitrator", async function () {
    await __arbitrator1.setRealitioProxy(__proxyAddress,{ from: __owner });
    await __arbitrator2.setRealitioProxy(__proxyAddress,{ from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers,{ from: __owner });
    await __proxy.askQuestion(__template_id,__question,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers,{ from: __owner });
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    
    await expectRevert(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "DXdaoArbitrator: WRONG_ARBITRATOR"
    );
  });

  it("should revert arbitration request when fee set to zero", async function () {
    await __arbitrator2.setDisputeFee(0,{ from: __owner });
    await __arbitrator2.setRealitioProxy(__proxyAddress,{ from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers2,{ from: __owner });
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers2,{ from: __owner });
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    await expectRevert(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
      }),
        "DXdaoArbitrator: ZERO_FEE"
    );
    await __arbitrator2.setDisputeFee(__disputeFee,{ from: __owner });
  });

  it("should revert arbitration request for finalized questions", async function () {
    await __arbitrator2.setDAOstackPlugin(__genericSchemeAddress,{ from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts2,__nonce,__answers2,{ from: __owner });
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts2,__nonce,__answers2,{ from: __owner });
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    await __arbitrator2.requestArbitration(questiondId,0,{
      from: __owner,
      value: __disputeFee
    });
    await __arbitrator2.submitAnswerByArbitrator(questiondId,web3.utils.toHex(0),__owner,{
      from: __owner
    });
    await expectRevert(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "DXdaoArbitrator: FINALIZED_QUESTION"
    );
  });

  it("should revert arbitration request when question has no answer", async function () {
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts3,__nonce,__answers2,{ from: __owner });
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts3,__nonce,__answers2,{ from: __owner });
    await expectRevert(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "Question must already have an answer when arbitration is requested."
    );
  });

  it("should accept arbitration request and create DAOstack proposals", async function () {
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts4,__nonce,__answers2,{ from: __owner });
    const proposalCountBefore = await __genericScheme.proposalCount.call({ from: __owner });
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts4,__nonce,__answers2,{ from: __owner });
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    const tx = await __arbitrator2.requestArbitration(questiondId,0,{
      from: __owner,
      value: __disputeFee
    });
    expectEvent(tx, 'ProposalCreated', { schemeAddress: __genericSchemeAddress });
    
    const proposalCountAfter = await __genericScheme.proposalCount.call();
    expect(proposalCountAfter-proposalCountBefore).to.be.equal(4);
  });

});
