const { expect } = require("chai");
const { ethers } = require("hardhat");

// ethers v6: parseUnits is now a top-level function
const etherToWei = (n) => {
  return ethers.parseUnits(n, 'ether');
};

const dateToUNIX = (date) => {
  return Math.round(new Date(date).getTime() / 1000).toString();
};

describe("Project", () => {

  let address1;
  let address2;
  let projectContract;

  beforeEach(async function () {
    [address1, address2, ...address] = await ethers.getSigners();

    const creator = address1.address;
    const minimumContribution = etherToWei("1");
    // Use a future date so deadline validation passes
    const deadline = dateToUNIX('2028-05-22');
    const targetContribution = etherToWei("10");
    const projectTitle = "Testing project";
    const projectDes = "Testing project description";

    const Project = await ethers.getContractFactory("Project");
    projectContract = await Project.deploy(
      creator,
      minimumContribution,
      deadline,
      targetContribution,
      projectTitle,
      projectDes
    );
    // ethers v6: waitForDeployment() replaces deployed()
    await projectContract.waitForDeployment();
  });

  describe("Check project variables & Contribute", async function () {
    it("Validate variables", async function () {
      expect(await projectContract.creator()).to.equal(address1.address);
      expect(await projectContract.minimumContribution()).to.equal(etherToWei("1"));
      expect(Number(await projectContract.deadline())).to.be.greaterThan(0);
      expect(await projectContract.targetContribution()).to.equal(etherToWei("10"));
      expect(await projectContract.projectTitle()).to.equal("Testing project");
      expect(await projectContract.projectDes()).to.equal("Testing project description");
      expect(await projectContract.state()).to.equal(0n);
      // Updated variable name: noOfContributors (was noOfContributers)
      expect(await projectContract.noOfContributors()).to.equal(0n);
    });

    it("Contribute", async function () {
      const tx = await projectContract.contribute(address1.address, { value: etherToWei('4') });
      const receipt = await tx.wait();

      // ethers v6: use queryFilter for event inspection
      const filter = projectContract.filters.FundingReceived();
      const events = await projectContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.contributor).to.equal(address1.address);
      expect(evt.amount).to.equal(etherToWei('4'));
      expect(evt.currentTotal).to.equal(etherToWei('4'));

      expect(await projectContract.noOfContributors()).to.equal(1n);
      expect(await projectContract.getContractBalance()).to.equal(etherToWei('4'));
    });

    it("Should fail if amount is less than minimum contribution amount", async () => {
      await expect(
        projectContract.connect(address1).contribute(address1.address, { value: etherToWei('0.5') })
      ).to.be.revertedWith('Contribution amount is too low!');
    });

    it("State should change to Successful if targeted amount hit", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('12') });
      expect(Number(await projectContract.completeAt())).to.be.greaterThan(0);
      expect(await projectContract.state()).to.equal(2n);
    });
  });

  describe("Create withdraw request", async function () {
    it("Should fail if someone else tries to request (Only owner can make request)", async () => {
      await expect(
        projectContract.connect(address2).createWithdrawRequest(
          "Testing description",
          etherToWei('2'),
          address2.address
        )
      ).to.be.revertedWith('You dont have access to perform this operation!');
    });

    it("Withdraw request should fail if status is not Successful", async () => {
      await expect(
        projectContract.connect(address1).createWithdrawRequest(
          "Testing description",
          etherToWei('2'),
          address1.address
        )
      ).to.be.revertedWith('Invalid state');
    });

    it("Request for withdraw", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('12') });
      const tx = await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      const receipt = await tx.wait();

      const filter = projectContract.filters.WithdrawRequestCreated();
      const events = await projectContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.description).to.equal("Testing description");
      expect(evt.amount).to.equal(etherToWei('2'));
      expect(evt.noOfVotes).to.equal(0n);
      expect(evt.isCompleted).to.equal(false);
      // Updated field name: recipient (was reciptent)
      expect(evt.recipient).to.equal(address1.address);
    });
  });

  describe("Vote for withdraw request", async function () {

    it("Only contributor can vote", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('12') });
      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      await expect(
        projectContract.connect(address2).voteWithdrawRequest(0)
      ).to.be.revertedWith('Only contributor can vote!');
    });

    it("Vote withdraw request", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('6') });
      await projectContract.contribute(address2.address, { value: etherToWei('7') });

      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      const tx = await projectContract.connect(address2).voteWithdrawRequest(0);
      const receipt = await tx.wait();

      const filter = projectContract.filters.WithdrawVote();
      const events = await projectContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.voter).to.equal(address2.address);
      expect(Number(evt.totalVote)).to.equal(1);
    });

    it("Should fail if request already voted", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('6') });
      await projectContract.contribute(address2.address, { value: etherToWei('7') });

      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      await projectContract.connect(address2).voteWithdrawRequest(0);

      await expect(
        projectContract.connect(address2).voteWithdrawRequest(0)
      ).to.be.revertedWith('You already voted!');
    });
  });

  describe("Withdraw balance", async function () {
    it("Should fail if 50% of contributors have not voted", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('6') });
      await projectContract.contribute(address2.address, { value: etherToWei('7') });

      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );

      await expect(
        projectContract.connect(address1).withdrawRequestedAmount(0)
      ).to.be.revertedWith('At least 50% contributor need to vote for this request');
    });

    it("Withdraw requested balance", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('6') });
      await projectContract.contribute(address2.address, { value: etherToWei('7') });

      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      await projectContract.connect(address1).voteWithdrawRequest(0);
      await projectContract.connect(address2).voteWithdrawRequest(0);

      const tx = await projectContract.connect(address1).withdrawRequestedAmount(0);
      const receipt = await tx.wait();

      const filter = projectContract.filters.AmountWithdrawSuccessful();
      const events = await projectContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.amount).to.equal(etherToWei('2'));
      expect(evt.noOfVotes).to.equal(2n);
      expect(evt.isCompleted).to.equal(true);
      expect(evt.recipient).to.equal(address1.address);
    });

    it("Should fail if request already completed", async () => {
      await projectContract.contribute(address1.address, { value: etherToWei('6') });
      await projectContract.contribute(address2.address, { value: etherToWei('7') });

      await projectContract.connect(address1).createWithdrawRequest(
        "Testing description",
        etherToWei('2'),
        address1.address
      );
      await projectContract.connect(address1).voteWithdrawRequest(0);
      await projectContract.connect(address2).voteWithdrawRequest(0);
      await projectContract.connect(address1).withdrawRequestedAmount(0);

      await expect(
        projectContract.connect(address1).withdrawRequestedAmount(0)
      ).to.be.revertedWith('Request already completed');
    });
  });
});