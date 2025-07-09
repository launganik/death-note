const { ethers } = require("hardhat");

/**
 * Deploy script for CryptoInheritance contract
 * This script deploys the main inheritance contract and a mock ERC20 token for testing
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  // Deploy the mock ERC20 token for testing
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy("TestToken", "TT", ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  
  console.log("MockERC20 deployed to:", await mockToken.getAddress());
  
  // Deploy the CryptoInheritance contract
  const CryptoInheritance = await ethers.getContractFactory("CryptoInheritance");
  const cryptoInheritance = await CryptoInheritance.deploy();
  await cryptoInheritance.waitForDeployment();
  
  console.log("CryptoInheritance deployed to:", await cryptoInheritance.getAddress());
  
  // Save the contract addresses for use in frontend/backend
  const fs = require('fs');
  const contractAddresses = {
    CryptoInheritance: await cryptoInheritance.getAddress(),
    MockERC20: await mockToken.getAddress(),
    network: "localhost",
    deployer: deployer.address
  };
  
  fs.writeFileSync(
    '../frontend/src/contractAddresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  
  fs.writeFileSync(
    '../backend/contractAddresses.json',
    JSON.stringify(contractAddresses, null, 2)
  );
  
  console.log("Contract addresses saved to frontend and backend directories");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
