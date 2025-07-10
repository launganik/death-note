import React, { useState } from 'react';
import './DeathWebhook.css';

interface DeathWebhookProps {
  status?: {
    status: string;
    message: string;
  };
  onTrigger?: (walletAddress: string) => void;
  onError?: (error: string) => void;
}

/**
 * DeathWebhook component handles triggering the death notification webhook
 * with confirmation dialog and safety measures
 */
const DeathWebhook: React.FC<DeathWebhookProps> = ({
  status,
  onTrigger,
  onError
}) => {
  const [inputWallet, setInputWallet] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const handleTriggerClick = () => {
    if (!isValidEthereumAddress(inputWallet)) {
      setError('Please enter a valid Wallet id of the deceased person');
      return;
    }
    setShowConfirmation(true);
    setError(null);
  };

  const handleConfirm = async () => {
    if (!isValidEthereumAddress(inputWallet)) return;
    setIsTriggering(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/webhook/death-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress: inputWallet,
          timestamp: Date.now(),
          eventType: 'death-notification'
        })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setIsTriggered(true);
        onTrigger?.(inputWallet);
      } else {
        throw new Error(data.error || 'Failed to trigger death event');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Network error';
      setError('Failed to trigger death event');
      onError?.(errorMessage);
    } finally {
      setIsTriggering(false);
      setShowConfirmation(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setError(null);
  };

  return (
    <div className="death-webhook">
      <h2>Death Event Trigger</h2>
      <div className="warning">
        ⚠️ WARNING: This will trigger the inheritance transfer
      </div>
      <div className="trigger-section">
        <input
          type="text"
          placeholder="Wallet id of the deceased person"
          value={inputWallet}
          onChange={e => setInputWallet(e.target.value)}
          className="address-input"
          disabled={isTriggering || isTriggered}
          style={{ marginBottom: 12, width: '100%' }}
        />
        <button
          onClick={handleTriggerClick}
          disabled={isTriggering || isTriggered}
          className={`trigger-button ${isTriggered ? 'triggered' : ''}`}
        >
          {isTriggering ? 'Triggering...' : isTriggered ? 'Death event triggered' : 'Trigger Death Event'}
        </button>
        {error && (
          <div className="error-message">{error}</div>
        )}
        {status && (
          <div className="status-display">
            <p><strong>Status:</strong> {status.status}</p>
            <p>{status.message}</p>
          </div>
        )}
      </div>
      {showConfirmation && (
        <div className="confirmation-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Death Event</h3>
            <p>Are you sure you want to trigger the inheritance transfer for this wallet?</p>
            <p><strong>This action cannot be undone.</strong></p>
            <div className="confirmation-buttons">
              <button onClick={handleCancel} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleConfirm} className="confirm-button">
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeathWebhook;
