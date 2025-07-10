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

      console.log(`[triggerInheritance] Called for wallet: ${walletAddress}`);
      console.log(`[triggerInheritance] Contract addresses:`, this.contractAddresses);

      // Check if the walletAddress is a valid Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        console.error(`[triggerInheritance] Invalid wallet address: ${walletAddress}`);
        return { success: false, error: 'Invalid wallet address' };
      }

      // Get the inheritor for the given wallet
      let inheritor;
      try {
        inheritor = await this.cryptoInheritanceContract.getInheritor();
        console.log(`[triggerInheritance] Inheritor for ${walletAddress}: ${inheritor}`);
      } catch (error) {
        console.error(`[triggerInheritance] Error getting inheritor:`, error);
        return {
          success: false,
          error: 'No inheritor nominated for this wallet',
          nomineeAddress: null
        };
      }
      
      if (!inheritor || inheritor === ethers.ZeroAddress) {
        console.error(`[triggerInheritance] No inheritor nominated for wallet: ${walletAddress}`);
        return {
          success: false,
          error: 'No inheritor nominated for this wallet',
          nomineeAddress: null
        };
      }

      // Get the token balance of the deceased wallet
      const balance = await this.mockTokenContract.balanceOf(walletAddress);
      console.log(`[triggerInheritance] Token balance for ${walletAddress}: ${balance}`);
      if (balance === 0n) {
        console.error(`[triggerInheritance] No tokens to transfer for wallet: ${walletAddress}`);
        return {
          success: false,
          error: 'No tokens to transfer for this wallet'
        };
      }

      // Try to get a signer for the deceased wallet (must have private key)
      let deceasedSigner;
      try {
        // For local Hardhat accounts, we need to create a signer with the private key
        // Hardhat account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
        const hardhatPrivateKeys = [
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account #0
          '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account #1
          '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account #2
          '0x7c852118e8d7e3b58184ae9b0c93aa8c92d841d953e7aa3f81d819d7c3a600e0', // Account #3
          '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a', // Account #4
          '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba', // Account #5
          '0x92db14e403b83dfe3df233f83dfa3a8d4025f2755dc4e8a0254c65493cde9a92', // Account #6
          '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f3f8a6c912e1b3a', // Account #7
          '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97', // Account #8
          '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6a409ae'  // Account #9
        ];
        
        const hardhatAddresses = [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
          '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
          '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
          '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
          '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
        ];
        
        const addressIndex = hardhatAddresses.findIndex(addr => addr.toLowerCase() === walletAddress.toLowerCase());
        if (addressIndex !== -1) {
          const privateKey = hardhatPrivateKeys[addressIndex];
          deceasedSigner = new ethers.Wallet(privateKey, this.provider);
          console.log(`[triggerInheritance] Using Hardhat signer for wallet: ${walletAddress} (account #${addressIndex})`);
        } else {
          console.error(`[triggerInheritance] Backend does not have signing authority for wallet: ${walletAddress}`);
          return {
            success: false,
            error: 'Backend does not have signing authority for this wallet. Only local test accounts are supported.'
          };
        }
      } catch (e) {
        console.error(`[triggerInheritance] Failed to get signer for wallet: ${walletAddress}`, e);
        return {
          success: false,
          error: 'Failed to get signer for the deceased wallet.'
        };
      }

      // Connect contracts as the deceased wallet
      const inheritanceAsDeceased = this.cryptoInheritanceContract.connect(deceasedSigner);
      const tokenAsDeceased = this.mockTokenContract.connect(deceasedSigner);

      // Check allowance using provider-connected contract (read-only)
      const allowance = await this.mockTokenContract.allowance(walletAddress, this.cryptoInheritanceContract.target);
      console.log(`[triggerInheritance] Allowance for contract to spend tokens from ${walletAddress}: ${allowance}`);
      if (allowance < balance) {
        console.log(`[triggerInheritance] Allowance insufficient. Attempting to approve tokens...`);
        
        // Try to approve the full balance
        const approvalResult = await this.approveTokens(walletAddress, balance);
        if (!approvalResult.success) {
          console.error(`[triggerInheritance] Failed to approve tokens:`, approvalResult.error);
          return {
            success: false,
            error: `Failed to approve tokens: ${approvalResult.error}`
          };
        }
        
        console.log(`[triggerInheritance] Token approval successful. Transaction: ${approvalResult.transactionHash}`);
        
        // Wait a moment for the approval to be processed
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verify the new allowance
        const newAllowance = await this.mockTokenContract.allowance(walletAddress, this.cryptoInheritanceContract.target);
        console.log(`[triggerInheritance] New allowance after approval: ${newAllowance}`);
        
        if (newAllowance < balance) {
          console.error(`[triggerInheritance] Allowance still insufficient after approval. Allowance: ${newAllowance}, Balance: ${balance}`);
          return {
            success: false,
            error: 'Allowance is still insufficient after approval attempt.'
          };
        }
      }

      // Trigger the inheritance transfer as the deceased wallet
      try {
        console.log(`[triggerInheritance] Attempting to trigger inheritance transfer...`);
        const tx = await inheritanceAsDeceased.triggerInheritance(this.contractAddresses.MockERC20);
        console.log(`[triggerInheritance] Transaction sent. Hash: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`[triggerInheritance] Inheritance transfer successful. Tx hash: ${tx.hash}`);
        return {
          success: true,
          transactionHash: tx.hash,
          tokenAddress: this.contractAddresses.MockERC20,
          nomineeAddress: inheritor
        };
      } catch (error) {
        console.error(`[triggerInheritance] Error during inheritance transfer:`, error);
        return {
          success: false,
          error: error.message || 'Failed to trigger inheritance',
          nomineeAddress: inheritor
        };
      }
    } catch (error) {
      console.error(`[triggerInheritance] Unexpected error:`, error);
      return {
        success: false,
        error: error.message || 'Failed to trigger inheritance',
        nomineeAddress: null
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
      
      // Check if inheritor is valid (not zero address)
      if (!inheritor || inheritor === ethers.ZeroAddress) {
        return {
          success: true,
          inheritor: null
        };
      }
      
      return {
        success: true,
        inheritor: inheritor
      };

    } catch (error) {
      console.error('Error getting inheritor:', error);
      return {
        success: true,
        inheritor: null
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
   * Approve the inheritance contract to spend tokens on behalf of a wallet
   */
  async approveTokens(walletAddress, amount) {
    try {
      if (!this.isInitialized) {
        await this.init();
      }

      console.log(`[approveTokens] Approving ${amount} tokens for wallet: ${walletAddress}`);

      // Check if the walletAddress is a valid Ethereum address
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        console.error(`[approveTokens] Invalid wallet address: ${walletAddress}`);
        return { success: false, error: 'Invalid wallet address' };
      }

      // Try to get a signer for the wallet (must have private key)
      let walletSigner;
      try {
        // For local Hardhat accounts, we need to create a signer with the private key
        // Hardhat account #0 (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
        const hardhatPrivateKeys = [
          '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', // Account #0
          '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', // Account #1
          '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', // Account #2
          '0x7c852118e8d7e3b58184ae9b0c93aa8c92d841d953e7aa3f81d819d7c3a600e0', // Account #3
          '0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a', // Account #4
          '0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba', // Account #5
          '0x92db14e403b83dfe3df233f83dfa3a8d4025f2755dc4e8a0254c65493cde9a92', // Account #6
          '0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f3f8a6c912e1b3a', // Account #7
          '0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97', // Account #8
          '0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6a409ae'  // Account #9
        ];
        
        const hardhatAddresses = [
          '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
          '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
          '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
          '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc',
          '0x976EA74026E726554dB657fA54763abd0C3a0aa9',
          '0x14dC79964da2C08b23698B3D3cc7Ca32193d9955',
          '0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f',
          '0xa0Ee7A142d267C1f36714E4a8F75612F20a79720'
        ];
        
        const addressIndex = hardhatAddresses.findIndex(addr => addr.toLowerCase() === walletAddress.toLowerCase());
        if (addressIndex !== -1) {
          const privateKey = hardhatPrivateKeys[addressIndex];
          walletSigner = new ethers.Wallet(privateKey, this.provider);
          console.log(`[approveTokens] Using Hardhat signer for wallet: ${walletAddress} (account #${addressIndex})`);
        } else {
          console.error(`[approveTokens] Backend does not have signing authority for wallet: ${walletAddress}`);
          return {
            success: false,
            error: 'Backend does not have signing authority for this wallet. Only local test accounts are supported.'
          };
        }
      } catch (e) {
        console.error(`[approveTokens] Failed to get signer for wallet: ${walletAddress}`, e);
        return {
          success: false,
          error: 'Failed to get signer for the wallet.'
        };
      }

      // Connect token contract as the wallet
      const tokenAsWallet = this.mockTokenContract.connect(walletSigner);

      // Convert amount to wei if it's a string (assuming it's in ether)
      let approvalAmount;
      if (typeof amount === 'string') {
        approvalAmount = ethers.parseEther(amount);
      } else {
        approvalAmount = BigInt(amount);
      }

      // Approve the inheritance contract to spend tokens
      console.log(`[approveTokens] Sending approval transaction...`);
      const tx = await tokenAsWallet.approve(this.cryptoInheritanceContract.target, approvalAmount);
      console.log(`[approveTokens] Approval transaction sent. Hash: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`[approveTokens] Approval successful. Tx hash: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        approvedAmount: ethers.formatEther(approvalAmount)
      };

    } catch (error) {
      console.error(`[approveTokens] Error during approval:`, error);
      return {
        success: false,
        error: error.message || 'Failed to approve tokens'
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
