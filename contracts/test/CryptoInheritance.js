const { expect } = require("chai");
const { ethers } = require("hardhat");

/**
 * Unit tests for the CryptoInheritance smart contract
 * These tests cover the core functionality of the inheritance system:
 * - Nominating an inheritor
 * - Transferring tokens on death event
 * - Access control (only owner can nominate)
 * - Emergency functions
 */
describe("CryptoInheritance", function () {
  let cryptoInheritance;
  let mockToken;
  let owner;
  let inheritor;
  let unauthorized;
  
  // Deploy contracts before each test
  beforeEach(async function () {
    [owner, inheritor, unauthorized] = await ethers.getSigners();
    
    // Deploy a mock ERC20 token for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy("TestToken", "TT", ethers.parseEther("1000"));
    
    // Deploy the main inheritance contract
    const CryptoInheritance = await ethers.getContractFactory("CryptoInheritance");
    cryptoInheritance = await CryptoInheritance.deploy();
    
    // The owner is the deployer of the mock token, so they already have the tokens
    // No need to transfer tokens to the owner
  });

  describe("Deployment", function () {
    it("Should set the deployer as the owner", async function () {
      expect(await cryptoInheritance.owner()).to.equal(owner.address);
    });

    it("Should initialize with no inheritor", async function () {
      expect(await cryptoInheritance.inheritor()).to.equal(ethers.ZeroAddress);
    });

    it("Should initialize as not triggered", async function () {
      expect(await cryptoInheritance.isTriggered()).to.equal(false);
    });
  });

  describe("Inheritor Nomination", function () {
    it("Should allow owner to nominate an inheritor", async function () {
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
      expect(await cryptoInheritance.inheritor()).to.equal(inheritor.address);
    });

    it("Should emit InheritorNominated event", async function () {
      await expect(cryptoInheritance.connect(owner).nominateInheritor(inheritor.address))
        .to.emit(cryptoInheritance, "InheritorNominated")
        .withArgs(inheritor.address);
    });

    it("Should not allow non-owner to nominate inheritor", async function () {
      await expect(
        cryptoInheritance.connect(unauthorized).nominateInheritor(inheritor.address)
      ).to.be.revertedWithCustomError(cryptoInheritance, "OwnableUnauthorizedAccount");
    });

    it("Should not allow nominating zero address", async function () {
      await expect(
        cryptoInheritance.connect(owner).nominateInheritor(ethers.ZeroAddress)
      ).to.be.revertedWith("Inheritor cannot be zero address");
    });

    it("Should allow changing inheritor", async function () {
      // First nomination
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
      expect(await cryptoInheritance.inheritor()).to.equal(inheritor.address);
      
      // Change to new inheritor
      await cryptoInheritance.connect(owner).nominateInheritor(unauthorized.address);
      expect(await cryptoInheritance.inheritor()).to.equal(unauthorized.address);
    });
  });

  describe('Inheritor nomination persistence', function () {
    it('should not revert to zero address after nomination', async function () {
      const [owner, nominee] = await ethers.getSigners();
      const contract = await ethers.deployContract('CryptoInheritance');
      await contract.waitForDeployment();
      // Initially zero
      expect(await contract.getInheritor()).to.equal(ethers.ZeroAddress);
      // Nominate
      await contract.connect(owner).nominateInheritor(nominee.address);
      expect(await contract.getInheritor()).to.equal(nominee.address);
      // Should remain unless cancelled
      await contract.connect(owner).nominateInheritor(nominee.address);
      expect(await contract.getInheritor()).to.equal(nominee.address);
      // Cancel
      await contract.connect(owner).cancelNomination();
      expect(await contract.getInheritor()).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Token Transfer on Death", function () {
    beforeEach(async function () {
      // Nominate inheritor before each test
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
      
      // Approve the contract to transfer tokens (approve full balance)
      await mockToken.connect(owner).approve(cryptoInheritance.target, ethers.parseEther("1000"));
    });

    it("Should transfer tokens to inheritor when triggered", async function () {
      // Check initial balances
      const initialOwnerBalance = await mockToken.balanceOf(owner.address);
      const initialInheritorBalance = await mockToken.balanceOf(inheritor.address);
      
      // Trigger the inheritance
      await cryptoInheritance.connect(owner).triggerInheritance(mockToken.target);
      
      // Check final balances
      const finalOwnerBalance = await mockToken.balanceOf(owner.address);
      const finalInheritorBalance = await mockToken.balanceOf(inheritor.address);
      
      expect(finalOwnerBalance).to.equal(0);
      expect(finalInheritorBalance).to.equal(initialOwnerBalance + initialInheritorBalance);
    });

    it("Should emit InheritanceTriggered event", async function () {
      await expect(cryptoInheritance.connect(owner).triggerInheritance(mockToken.target))
        .to.emit(cryptoInheritance, "InheritanceTriggered")
        .withArgs(mockToken.target, inheritor.address);
    });

    it("Should set isTriggered to true", async function () {
      await cryptoInheritance.connect(owner).triggerInheritance(mockToken.target);
      expect(await cryptoInheritance.isTriggered()).to.equal(true);
    });

    it("Should not allow triggering without inheritor", async function () {
      // Deploy new contract without inheritor
      const CryptoInheritance = await ethers.getContractFactory("CryptoInheritance");
      const newContract = await CryptoInheritance.deploy();
      
      await expect(
        newContract.connect(owner).triggerInheritance(mockToken.target)
      ).to.be.revertedWith("No inheritor nominated");
    });

    it("Should not allow non-owner to trigger inheritance", async function () {
      await expect(
        cryptoInheritance.connect(unauthorized).triggerInheritance(mockToken.target)
      ).to.be.revertedWithCustomError(cryptoInheritance, "OwnableUnauthorizedAccount");
    });

    it("Should not allow triggering twice", async function () {
      await cryptoInheritance.connect(owner).triggerInheritance(mockToken.target);
      
      await expect(
        cryptoInheritance.connect(owner).triggerInheritance(mockToken.target)
      ).to.be.revertedWith("Inheritance already triggered");
    });
  });

  describe("Emergency Functions", function () {
    beforeEach(async function () {
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
    });

    it("Should allow owner to cancel nomination", async function () {
      await cryptoInheritance.connect(owner).cancelNomination();
      expect(await cryptoInheritance.inheritor()).to.equal(ethers.ZeroAddress);
    });

    it("Should emit NominationCancelled event", async function () {
      await expect(cryptoInheritance.connect(owner).cancelNomination())
        .to.emit(cryptoInheritance, "NominationCancelled");
    });

    it("Should not allow non-owner to cancel nomination", async function () {
      await expect(
        cryptoInheritance.connect(unauthorized).cancelNomination()
      ).to.be.revertedWithCustomError(cryptoInheritance, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to pause/unpause contract", async function () {
      await cryptoInheritance.connect(owner).pause();
      expect(await cryptoInheritance.paused()).to.equal(true);
      
      await cryptoInheritance.connect(owner).unpause();
      expect(await cryptoInheritance.paused()).to.equal(false);
    });

    it("Should not allow triggering when paused", async function () {
      await cryptoInheritance.connect(owner).pause();
      
      await expect(
        cryptoInheritance.connect(owner).triggerInheritance(mockToken.target)
      ).to.be.revertedWithCustomError(cryptoInheritance, "EnforcedPause");
    });
  });

  describe("View Functions", function () {
    it("Should return current inheritor", async function () {
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
      expect(await cryptoInheritance.getInheritor()).to.equal(inheritor.address);
    });

    it("Should return owner address", async function () {
      expect(await cryptoInheritance.getOwner()).to.equal(owner.address);
    });

    it("Should return trigger status", async function () {
      expect(await cryptoInheritance.isTriggered()).to.equal(false);
      
      await cryptoInheritance.connect(owner).nominateInheritor(inheritor.address);
      await mockToken.connect(owner).approve(cryptoInheritance.target, ethers.parseEther("1000"));
      await cryptoInheritance.connect(owner).triggerInheritance(mockToken.target);
      
      expect(await cryptoInheritance.isTriggered()).to.equal(true);
    });
  });
});
