
const truffleAssert = require("truffle-assertions");
const DXdaoArbitrator = artifacts.require("DXdaoArbitrator");
const GenericScheme = artifacts.require("GenericScheme");
const Realitio = artifacts.require("Realitio");
const RealitioProxy = artifacts.require("RealitioProxy");

contract('RealitioProxy', (accounts) => {
  const __owner = accounts[0];
  const __user1 = accounts[2];
  const __disputeFee = web3.utils.toWei('0.0000001', 'ether');
  const __proposalDescriptionHash = 'QmZSDGCPixwn1UrqnmcscYcXq2HARgMFwfP7JJNXUsW9uU'
  const __avatarAddress = accounts[5];
  const __template_id = "2";
  const __question = 'TheQuestion␟"Answer1","Answer2","Answer3"␟Business & Finance␟en_US';
  const __question2 = 'TheQuestion␟"Answer0","Answer1","Answer2"␟Business & Finance␟en_US';
  const __question3 = 'TheQuestion␟"A0","A1","A2","A3"␟Business & Finance␟en_US';
  const __timeout = "86400";
  const __opening_ts = "1590994800";
  const __opening_ts2 = "1590996800";
  const __opening_ts3 = "1590996700";
  const __opening_ts4 = "1590996500";
  const __nonce = 0;
  const __answers = ["Answer1","Answer2","Answer3"];
  const __answers2 = ["A0","A1","A2","A3"];

  before(async () => {
      __arbitrator1 = await DXdaoArbitrator.deployed();
      __arbitrator1Address = __arbitrator1.address;
      __arbitrator2 = await DXdaoArbitrator.new();
      __arbitrator2Address = __arbitrator2.address;
      __proxy = await RealitioProxy.deployed();
      __proxyAddress = __proxy.address;
      __genericScheme = await GenericScheme.deployed();
      __genericSchemeAddress = __genericScheme.address;
      __realitio = await Realitio.deployed();
      __realitioAddress = __realitio.address;
  });

  it("should revert arbitrator setters called by non-owner addresses", async () => {
    await truffleAssert.reverts(
      __arbitrator1.setRealitio(__realitioAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await truffleAssert.reverts(
      __arbitrator1.setDisputeFee(__disputeFee, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await truffleAssert.reverts(
      __arbitrator1.setFeeRecipient(__owner, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await truffleAssert.reverts(
      __arbitrator1.setDAOstackProposalDescriptionHash(__proposalDescriptionHash, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await truffleAssert.reverts(
      __arbitrator1.setDAOstackAvatar(__avatarAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
  });

  it("should revert proxy setters called by non-owner addresses", async () => {
    await truffleAssert.reverts(
      __proxy.setRealitio(__realitioAddress, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
    await truffleAssert.reverts(
      __proxy.activateAnswerStorage(__arbitrator1Address, {
        from: __user1
      }),
        "Ownable: caller is not the owner"
    );
  });

  it("should allow owners to exectute setters", async () => {
    const txSetRealitio = await __arbitrator1.setRealitio(__realitioAddress, { from: __owner });
    truffleAssert.eventEmitted(txSetRealitio, 'SetRealitio', (ev) => {
      return ev.realitio === __realitioAddress;
    });

    const txSetDisputeFee = await __arbitrator1.setDisputeFee(__disputeFee, { from: __owner });
    truffleAssert.eventEmitted(txSetDisputeFee, 'SetDisputeFee', (ev) => {
      return ev.fee.toString() === __disputeFee.toString();
    });

    const txSetFeeRecipient = await __arbitrator1.setFeeRecipient(__owner, { from: __owner });
    truffleAssert.eventEmitted(txSetFeeRecipient, 'SetFeeRecipient', (ev) => {
      return ev.recipient === __owner;
    });

    const txSetProposalDescription = await __arbitrator1.setDAOstackProposalDescriptionHash(__proposalDescriptionHash, { from: __owner });
    truffleAssert.eventEmitted(txSetProposalDescription, 'SetDAOstackProposalDescriptionHash', (ev) => {
      return ev.descriptionHash === __proposalDescriptionHash;
    });

    const txSetDAOstackAvatar = await __arbitrator1.setDAOstackAvatar(__avatarAddress, { from: __owner });
    truffleAssert.eventEmitted(txSetDAOstackAvatar, 'SetDAOstackAvatar', (ev) => {
      return ev.avatar === __avatarAddress;
    });

    const txSetRealitioAddr = await __proxy.setRealitio(__realitioAddress, { from: __owner });
    truffleAssert.eventEmitted(txSetRealitioAddr, 'SetRealitio', (ev) => {
      return ev.realitio === __realitioAddress;
    });

    const txActivateAnswerStorage = await __proxy.activateAnswerStorage(__arbitrator1Address, { from: __owner });
    truffleAssert.eventEmitted(txActivateAnswerStorage, 'ActivateAnswerStorage', (ev) => {
      return ev.arbitrator === __arbitrator1Address;
    });
  });

  it("should allow switching off and on answerStorage ", async () => {
    assert.isTrue(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address));
    await __proxy.deactivateAnswerStorage(__arbitrator1Address, { from: __owner });
    assert.isFalse(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address));
    await __proxy.activateAnswerStorage(__arbitrator1Address, { from: __owner });
    assert.isTrue(await __proxy.arbitratorAnswerStorage.call(__arbitrator1Address));
  });

  it("should not store answers on-chain by default", async () => {
    const questionId = await __proxy.askQuestion.call(__template_id,__question,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    const answerArray = await __proxy.getAnswersByQuestionId.call(questionId);
    assert.equal(await answerArray.length, 0, "Array did not return as expected..");
  });

  it("should store answers on-chain when activated for given arbitrator", async () => {
    await __proxy.activateAnswerStorage(__arbitrator2Address, { from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question2,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    await __proxy.askQuestion(__template_id,__question2,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers);
    const answerArray = await __proxy.getAnswersByQuestionId.call(questiondId);
    assert.equal(await answerArray.length, 3, "Array did not return as expected..");
  });

  it("should revert arbitration request when proxy is not set", async () => {
    await __arbitrator2.setRealitio(__realitioAddress);
    await __arbitrator1.setDisputeFee(__disputeFee);
    await __arbitrator2.setDisputeFee(__disputeFee);
    await __arbitrator2.setFeeRecipient(__owner);
    await __arbitrator2.setDAOstackProposalDescriptionHash(__proposalDescriptionHash);
    await __arbitrator2.setDAOstackAvatar(__avatarAddress);
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers2);
    await __proxy.askQuestion(__template_id,__question3,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers2);
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    
    await truffleAssert.reverts(
      __arbitrator1.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee*2
      }),
        "DXdaoArbitrator: NO_REALITIOPROXY_ADDRESS"
    );

  });

  it("should revert arbitration request with wrong arbitrator", async () => {
    await __arbitrator1.setRealitioProxy(__proxyAddress,{ from: __owner });
    await __arbitrator2.setRealitioProxy(__proxyAddress,{ from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers);
    await __proxy.askQuestion(__template_id,__question,__arbitrator1Address,__timeout,__opening_ts,__nonce,__answers);
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    
    await truffleAssert.reverts(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee*2
      }),
        "DXdaoArbitrator: WRONG_ARBITRATOR"
    );

  });

  it("should revert arbitration request when fee set to zero", async () => {
    await __arbitrator2.setDisputeFee(0);
    await __arbitrator2.setRealitioProxy(__proxyAddress,{ from: __owner });
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers2);
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts,__nonce,__answers2);
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    await truffleAssert.reverts(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
      }),
        "DXdaoArbitrator: ZERO_FEE"
    );
    await __arbitrator2.setDisputeFee(__disputeFee);
  });

  it("should revert arbitration request for finalized questions", async () => {
    await __arbitrator2.setDAOstackPlugin(__genericSchemeAddress);
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts2,__nonce,__answers2);
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts2,__nonce,__answers2);
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
    await truffleAssert.reverts(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "DXdaoArbitrator: FINALIZED_QUESTION"
    );
  });

  it("should revert arbitration request when question has no answer", async () => {
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts3,__nonce,__answers2);
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts3,__nonce,__answers2);
    await truffleAssert.reverts(
      __arbitrator2.requestArbitration(questiondId,0, {
        from: __owner,
        value: __disputeFee
      }),
        "Question must already have an answer when arbitration is requested."
    );
  });

  it("should accept arbitration request and create DAOstack proposals", async () => {
    const questiondId = await __proxy.askQuestion.call(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts4,__nonce,__answers2);
    const proposalCountBefore = await __genericScheme.proposalCount.call();
    await __proxy.askQuestion(__template_id,__question3,__arbitrator2Address,__timeout,__opening_ts4,__nonce,__answers2);
    await __realitio.submitAnswer(questiondId,web3.utils.toHex(0),0, {
      from: __owner,
      value: web3.utils.toWei('0.2', 'ether')
    });
    const tx = await __arbitrator2.requestArbitration(questiondId,0,{
      from: __owner,
      value: __disputeFee
    });
    truffleAssert.eventEmitted(tx, 'ProposalCreated', (ev) => {
      return ev.schemeAddress === __genericSchemeAddress;
    });
    
    const proposalCountAfter = await __genericScheme.proposalCount.call();
    assert.equal((proposalCountAfter-proposalCountBefore).toString(), "4", "unexpected ProposalCount");
  });

});
