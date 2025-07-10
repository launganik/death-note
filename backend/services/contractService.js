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
   * Now supports arbitrary source wallet (deceased)
   */
  async triggerInheritance(walletAddress) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      // Check if the walletAddress is a valid Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { success: false, error: 'Invalid wallet address' };
      }

      // Get the inheritor for the given wallet
      const inheritor = await this.cryptoInheritanceContract.getInheritor();
      if (inheritor === ethers.ZeroAddress) {
        return {
          success: false,
          error: 'No inheritor nominated for this wallet'
        };
      }

      // Get the token balance of the deceased wallet
      const balance = await this.mockTokenContract.balanceOf(walletAddress);
      if (balance === 0n) {
        return {
          success: false,
          error: 'No tokens to transfer for this wallet'
        };
      }

      // Try to get a signer for the deceased wallet (must have private key)
      let deceasedSigner;
      try {
        // If the backend has the private key, use it; otherwise, error
        // For demo: check if walletAddress matches one of the local Hardhat accounts
        const accounts = await this.provider.listAccounts();
        if (accounts.map(a => a.toLowerCase()).includes(walletAddress.toLowerCase())) {
          deceasedSigner = this.provider.getSigner(walletAddress);
        } else {
          return {
            success: false,
            error: 'Backend does not have signing authority for this wallet. Only local test accounts are supported.'
          };
        }
      } catch (e) {
        return {
          success: false,
          error: 'Failed to get signer for the deceased wallet.'
        };
      }

      // Connect contracts as the deceased wallet
      const inheritanceAsDeceased = this.cryptoInheritanceContract.connect(deceasedSigner);
      const tokenAsDeceased = this.mockTokenContract.connect(deceasedSigner);

      // Check allowance
      const allowance = await tokenAsDeceased.allowance(walletAddress, this.cryptoInheritanceContract.target);
      if (allowance < balance) {
        return {
          success: false,
          error: 'Allowance is not sufficient for inheritance transfer.'
        };
      }

      // Trigger the inheritance transfer as the deceased wallet
      const tx = await inheritanceAsDeceased.triggerInheritance(this.contractAddresses.MockERC20);
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
