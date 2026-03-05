const hre = require("hardhat");

async function main() {
  console.log("Deploying Crowdfunding contract...");

  const Crowdfunding = await hre.ethers.getContractFactory("Crowdfunding");
  const crowdfunding = await Crowdfunding.deploy();

  // ethers v6: waitForDeployment() replaces deployed()
  await crowdfunding.waitForDeployment();

  // ethers v6: .target replaces .address
  const deployedAddress = await crowdfunding.target;
  console.log("Crowdfunding deployed to:", deployedAddress);
  console.log("Update client/redux/interactions.js crowdFundingContractAddress with:", deployedAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
