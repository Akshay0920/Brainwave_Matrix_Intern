const hre = require("hardhat");

async function main() {
  const Voting = await hre.ethers.getContractFactory("Voting");
  const voting = await Voting.deploy(["Robert", "Chris", "Scarlett", "Hemsworth", "Mark", "Jeremy"]); // Customize names
  await voting.waitForDeployment();

  console.log("Voting deployed to:", await voting.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
