const { expect } = require("chai");
const { ethers } = require("hardhat");

// ethers v6: parseUnits is now a top-level function (no more ethers.utils)
const etherToWei = (n) => {
  return ethers.parseUnits(n, 'ether');
};

const dateToUNIX = (date) => {
  return Math.round(new Date(date).getTime() / 1000);
};

describe("Crowdfunding", () => {

  let address1;
  let address2;
  let crowdfundingContract;

  beforeEach(async function () {
    [address1, address2, ...address] = await ethers.getSigners();

    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    crowdfundingContract = await Crowdfunding.deploy();
    // ethers v6: waitForDeployment() replaces deployed()
    await crowdfundingContract.waitForDeployment();
  });

  describe("Request for funding", async function () {
    it("Start a project", async function () {

      const minimumContribution = etherToWei('1');
      // Use a future date so the contract doesn't reject it
      const deadline = dateToUNIX('2028-01-01');
      const targetContribution = etherToWei('100');
      const projectTitle = 'Testing title';
      const projectDesc = 'Testing description';

      const project = await crowdfundingContract.connect(address1).createProject(
        minimumContribution,
        deadline,
        targetContribution,
        projectTitle,
        projectDesc
      );
      // ethers v6: use .wait() to get the receipt, then use filters for events
      const receipt = await project.wait();

      const projectList = await crowdfundingContract.returnAllProjects();

      // Verify project was created
      expect(projectList.length).to.equal(1);

      // Check the emitted ProjectStarted event
      const filter = crowdfundingContract.filters.ProjectStarted();
      const events = await crowdfundingContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.projectContractAddress).to.equal(projectList[0]);
      expect(evt.creator).to.equal(address1.address);
      expect(evt.minContribution).to.equal(minimumContribution);
      expect(Number(evt.projectDeadline)).to.be.greaterThan(0);
      expect(evt.goalAmount).to.equal(targetContribution);
      expect(evt.currentAmount).to.equal(0n);
      expect(evt.noOfContributors).to.equal(0n);
      expect(evt.title).to.equal(projectTitle);
      expect(evt.desc).to.equal(projectDesc);
      expect(evt.currentState).to.equal(0n);
    });

    it("Get data / contribute", async function () {

      const minimumContribution = etherToWei('1');
      const deadline = dateToUNIX('2028-01-01');
      const targetContribution = etherToWei('100');
      const projectTitle = 'Testing title';
      const projectDesc = 'Testing description';

      await crowdfundingContract.connect(address1).createProject(
        minimumContribution,
        deadline,
        targetContribution,
        projectTitle,
        projectDesc
      );
      const projectList = await crowdfundingContract.returnAllProjects();
      const contribute = await crowdfundingContract.connect(address1).contribute(
        projectList[0],
        { value: etherToWei("4") }
      );

      const receipt = await contribute.wait();

      // Check the emitted ContributionReceived event
      const filter = crowdfundingContract.filters.ContributionReceived();
      const events = await crowdfundingContract.queryFilter(filter, receipt.blockNumber, receipt.blockNumber);
      expect(events.length).to.equal(1);
      const evt = events[0].args;

      expect(evt.projectAddress).to.equal(projectList[0]);
      expect(evt.contributedAmount).to.equal(etherToWei("4"));
      expect(evt.contributor).to.equal(address1.address);
    });
  });
});
