const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

/**
 * Contract Service for Crypto Inheritance System
 * Handles all interactions with the smart contracts
 */

class ContractService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.cryptoInheritanceContract = null;
    this.mockTokenContract = null;
    this.contractAddresses = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the contract service with provider and contracts
   */
  async init() {
    try {
      // Connect to local Hardhat network
      this.provider = new ethers.JsonRpcProvider('http://localhost:8545');
      
      // Load contract addresses
      const addressesPath = path.join(__dirname, '../contractAddresses.json');
      if (fs.existsSync(addressesPath)) {
        this.contractAddresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
      } else {
        console.warn('Contract addresses file not found. Using default addresses.');
        this.contractAddresses = {
          CryptoInheritance: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          MockERC20: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'
        };
      }

      // Use a funded account from Hardhat (account #0)
      const accounts = await this.provider.listAccounts();
      if (accounts.length > 0) {
        this.wallet = accounts[0];
      } else {
        // Fallback to creating a wallet with a known private key from Hardhat
        const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
        this.wallet = new ethers.Wallet(privateKey, this.provider);
      }

      // Load contract ABIs
      const cryptoInheritanceABI = this.loadContractABI('CryptoInheritance');
      const mockTokenABI = this.loadContractABI('MockERC20');

      // Initialize contracts
      this.cryptoInheritanceContract = new ethers.Contract(
        this.contractAddresses.CryptoInheritance,
        cryptoInheritanceABI,
        this.wallet
      );

      this.mockTokenContract = new ethers.Contract(
        this.contractAddresses.MockERC20,
        mockTokenABI,
        this.wallet
      );

      this.isInitialized = true;
      console.log('Contract service initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize contract service:', error);
      throw error;
    }
  }

  /**
   * Load contract ABI from the compiled artifacts
   */
  loadContractABI(contractName) {
    try {
      const artifactsPath = path.join(__dirname, `../../contracts/artifacts/contracts/${contractName}.sol/${contractName}.json`);
      const artifact = JSON.parse(fs.readFileSync(artifactsPath, 'utf8'));
      return artifact.abi;
    } catch (error) {
      console.error(`Failed to load ABI for ${contractName}:`, error);
      // Return minimal ABI as fallback
      return [];
    }
  }

  /**
   * Trigger inheritance transfer for a wallet
   */
  async triggerInheritance(walletAddress) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Check if there's an inheritor nominated
      const inheritor = await this.cryptoInheritanceContract.getInheritor();
      if (inheritor === ethers.ZeroAddress) {
        console.log(inheritor + ' is the inheritor address nominated for this wallet');
        return {
          success: false,
          error: 'No inheritor nominated for this wallet'
        };
      }

      // Check if inheritance has already been triggered
      const isTriggered = await this.cryptoInheritanceContract.isTriggered();
      if (isTriggered) {
        return {
          success: false,
          error: 'Inheritance has already been triggered for this wallet'
        };
      }

      // Trigger the inheritance transfer
      const tx = await this.cryptoInheritanceContract.triggerInheritance(
        this.contractAddresses.MockERC20
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      return {
        success: true,
        transactionHash: receipt.hash,
        inheritor: inheritor,
        tokenAddress: this.contractAddresses.MockERC20
      };

    } catch (error) {
      console.error('Error triggering inheritance:', error);
      return {
        success: false,
        error: error.message || 'Failed to trigger inheritance'
      };
    }
  }

  /**
   * Get the nominated inheritor for a wallet
   */
  async getInheritor(walletAddress) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const inheritor = await this.cryptoInheritanceContract.getInheritor();
      return {
        success: true,
        inheritor: inheritor
      };

    } catch (error) {
      console.error('Error getting inheritor:', error);
      return {
        success: false,
        error: error.message || 'Failed to get inheritor'
      };
    }
  }

  /**
   * Get the owner of the inheritance contract
   */
  async getOwner() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const owner = await this.cryptoInheritanceContract.getOwner();
      return {
        success: true,
        owner: owner
      };

    } catch (error) {
      console.error('Error getting owner:', error);
      return {
        success: false,
        error: error.message || 'Failed to get owner'
      };
    }
  }

  /**
   * Check if inheritance has been triggered
   */
  async isTriggered() {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const triggered = await this.cryptoInheritanceContract.isTriggered();
      return {
        success: true,
        isTriggered: triggered
      };

    } catch (error) {
      console.error('Error checking trigger status:', error);
      return {
        success: false,
        error: error.message || 'Failed to check trigger status'
      };
    }
  }

  /**
   * Get token balance for an address
   */
  async getTokenBalance(walletAddress) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      const balance = await this.mockTokenContract.balanceOf(walletAddress);
      return {
        success: true,
        balance: ethers.formatEther(balance)
      };

    } catch (error) {
      console.error('Error getting token balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to get token balance'
      };
    }
  }
}

// Create singleton instance
const contractService = new ContractService();

module.exports = contractService;
