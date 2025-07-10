import React, { useState } from 'react';
import { BrowserProvider } from 'ethers';
import './WalletConnection.css';

interface WalletConnectionProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
  initialAddress?: string;
  error?: string;
}

/**
 * WalletConnection component handles wallet connection and disconnection
 * Uses ethers.js to interact with browser wallet providers
 */
const WalletConnection: React.FC<WalletConnectionProps> = ({
  onConnect,
  onDisconnect,
  initialAddress,
  error
}) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(error || null);

  // Removed auto-connect on mount. User must always click connect.

  /**
   * Handle wallet connection
   */
  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    try {
      if (typeof window.ethereum === 'undefined') {
        throw new Error('Please install MetaMask or another Ethereum wallet');
      }

      const provider = new BrowserProvider(window.ethereum);
      
      // Request account access
      await provider.send('eth_requestAccounts', []);
      
      const signer = await provider.getSigner();
      const connectedAddress = await signer.getAddress();
      
      setAddress(connectedAddress);
      onConnect?.(connectedAddress);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setConnectionError(errorMessage);
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  /**
   * Handle wallet disconnection
   */
  const handleDisconnect = () => {
    setAddress(null);
    setConnectionError(null);
    onDisconnect?.();
  };

  /**
   * Format address for display (show first 6 and last 4 characters)
   */
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="wallet-connection">
      <h2>Wallet Connection</h2>
      
      {!address ? (
        <div className="connect-section">
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="connect-button"
          >
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </button>
          
          {connectionError && (
            <div className="error-message">
              {connectionError}
            </div>
          )}
        </div>
      ) : (
        <div className="connected-section">
          <div className="address-display">
            <strong>Connected Address:</strong>
            <span className="address">{address}</span>
          </div>
          
          <button 
            onClick={handleDisconnect}
            className="disconnect-button"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;
