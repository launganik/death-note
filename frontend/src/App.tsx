import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import WalletConnection from './components/WalletConnection';
import InheritorNomination from './components/InheritorNomination';
import TransferAnimation from './components/TransferAnimation';
import DeathWebhook from './components/DeathWebhook';
import TokenBalances from './components/TokenBalances';
import './App.css';
import contractAddresses from './contractAddresses.json';
import { ethers } from 'ethers';

function DeathEventPage({ walletAddress, status, onTrigger, onError }: {
  walletAddress: string | null;
  status: any;
  onTrigger: (address: string) => void;
  onError: (error: string) => void;
}) {
  return (
    <div style={{ maxWidth: 500, margin: '40px auto' }}>
      <h2>Death Event Trigger</h2>
      <DeathWebhook
        onTrigger={onTrigger}
        onError={onError}
        status={status}
      />
      <Link to="/" style={{ display: 'block', marginTop: 24 }}>← Back to Dashboard</Link>
    </div>
  );
}

function App() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [currentInheritor, setCurrentInheritor] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [transferActive, setTransferActive] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastTriggeredWallet, setLastTriggeredWallet] = useState<string | null>(null);
  const [nomineeInput, setNomineeInput] = useState<string>('');

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, []);

  // Subscribe to status updates for the connected wallet only
  useEffect(() => {
    if (socket && walletAddress) {
      socket.emit('subscribe', walletAddress);
      socket.on('statusUpdate', (data) => {
        setStatus(data);
        if (data.status === 'processing') setTransferActive(true);
        if (data.status === 'completed' || data.status === 'failed') setTransferActive(false);
      });
      return () => { socket.off('statusUpdate'); };
    }
  }, [socket, walletAddress]);

  // Only set walletAddress when user explicitly connects via WalletConnection
  const handleWalletConnect = async (address: string) => {
    setWalletAddress(address);
    setError(null);
    
    // Check if there's already an inheritor nominated
    try {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(
          contractAddresses.CryptoInheritance,
          ['function getInheritor() view returns (address)'],
          provider
        );
        const inheritor = await contract.getInheritor();
        if (inheritor && inheritor !== ethers.ZeroAddress) {
          setCurrentInheritor(inheritor);
        }
      }
    } catch (err) {
      // No inheritor set yet, which is fine
      setCurrentInheritor(null);
    }
  };
  const handleWalletDisconnect = () => { setWalletAddress(null); setCurrentInheritor(null); setStatus(null); setError(null); setNomineeInput(''); };
  const handleInheritorNomination = async (inheritorAddress: string) => {
    if (!walletAddress) return;
    try {
      if (typeof window.ethereum === 'undefined') {
        setError('Please install MetaMask or another Ethereum wallet');
        return;
      }
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddresses.CryptoInheritance,
        [
          'function nominateInheritor(address _inheritor) external',
          'function getInheritor() view returns (address)'
        ],
        signer
      );
      const tx = await contract.nominateInheritor(inheritorAddress);
      await tx.wait();
      // Confirm nomination
      try {
        const nominated = await contract.getInheritor();
        setCurrentInheritor(nominated);
      } catch (err) {
        // If getInheritor fails, assume no inheritor is set yet
        setCurrentInheritor(null);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to nominate inheritor');
    }
  };
  const handleDeathTrigger = (address: string) => { setError(null); setLastTriggeredWallet(address); };
  const handleError = (errorMessage: string) => { setError(errorMessage); };
  const handleTransferComplete = () => { setTransferActive(false); };

  // Helper to get valid Ethereum address
  const isValidEthereumAddress = (address: string): boolean => /^0x[a-fA-F0-9]{40}$/.test(address);

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>🏦 Crypto Inheritance System</h1>
          <p>Secure your digital assets for future generations</p>
        </header>
        <main className="App-main">
          {error && (
            <div className="global-error">
              <p>❌ {error}</p>
              <button onClick={() => setError(null)}>Dismiss</button>
            </div>
          )}
          <Routes>
            <Route path="/" element={
              <div className="components-grid">
                <WalletConnection
                  onConnect={handleWalletConnect}
                  onDisconnect={handleWalletDisconnect}
                  error={error || undefined}
                />
                {/* Show balance for connected wallet only below WalletConnection */}
                {walletAddress && (
                  <TokenBalances
                    tokenAddress={contractAddresses.MockERC20}
                    address={walletAddress}
                    balanceType="owner"
                  />
                )}
                {walletAddress && (
                  <>
                    <InheritorNomination
                      walletAddress={walletAddress}
                      currentInheritor={currentInheritor || undefined}
                      onNominate={handleInheritorNomination}
                      error={error || undefined}
                      nomineeInput={nomineeInput}
                      setNomineeInput={setNomineeInput}
                    />
                    {/* Show balance for nominee only below Nominate Inheritor */}
                    {isValidEthereumAddress(nomineeInput) && nomineeInput.toLowerCase() !== walletAddress.toLowerCase() && (
                      <TokenBalances
                        tokenAddress={contractAddresses.MockERC20}
                        address={nomineeInput}
                        balanceType="nominee"
                      />
                    )}
                  </>
                )}
                {/* Link to Death Event page */}
                <Link to="/death-event" className="death-event-link" style={{marginTop: 16, fontWeight: 'bold'}}>Go to Death Event Trigger →</Link>
              </div>
            } />
            <Route path="/death-event" element={
              <DeathEventPage
                walletAddress={walletAddress}
                status={status}
                onTrigger={handleDeathTrigger}
                onError={handleError}
              />
            } />
          </Routes>
          {/* Show status and timer only for the connected wallet */}
          {walletAddress && status && (
            <div className="status-panel">
              <h3>System Status</h3>
              <p><strong>Status:</strong> {status.status}</p>
              <p><strong>Message:</strong> {status.message}</p>
              <p><strong>Timestamp:</strong> {new Date(status.timestamp).toLocaleString()}</p>
            </div>
          )}
        </main>
        <TransferAnimation
          isActive={transferActive}
          inheritorAddress={status?.nomineeAddress || undefined}
          onComplete={handleTransferComplete}
        />
        <footer className="App-footer">
          <p>Built with React, ethers.js, and Solidity</p>
          <p>Test-driven development approach</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
