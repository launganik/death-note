import React, { useState } from 'react';
import './InheritorNomination.css';

interface InheritorNominationProps {
  walletAddress?: string;
  currentInheritor?: string;
  onNominate?: (address: string) => void;
  onChangeInheritor?: () => void;
  isLoading?: boolean;
  error?: string;
  nomineeInput?: string;
  setNomineeInput?: (value: string) => void;
}

/**
 * InheritorNomination component handles nominating and managing inheritor
 */
const InheritorNomination: React.FC<InheritorNominationProps> = ({
  walletAddress,
  currentInheritor,
  onNominate,
  onChangeInheritor,
  isLoading = false,
  error,
  nomineeInput,
  setNomineeInput
}) => {
  const inheritorAddress = nomineeInput ?? '';
  const [validationError, setValidationError] = useState('');

  /**
   * Validate Ethereum address format
   */
  const isValidEthereumAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  /**
   * Handle nomination submission
   *
   * Note: Wallet connection/transaction is only triggered on button click (or form submit),
   * never on input change. This prevents accidental wallet popups when typing or pressing Enter.
   */
  const handleNominate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError('');

    if (!inheritorAddress) {
      setValidationError('Please enter an inheritor address');
      return;
    }

    if (!isValidEthereumAddress(inheritorAddress)) {
      setValidationError('Please enter a valid Ethereum address');
      return;
    }

    if (inheritorAddress.toLowerCase() === walletAddress?.toLowerCase()) {
      setValidationError('You cannot nominate yourself as inheritor');
      return;
    }

    onNominate?.(inheritorAddress);
  };

  return (
    <div className="inheritor-nomination">
      <h2>Nominate Inheritor</h2>
      
      {currentInheritor && (
        <div className="current-inheritor">
          <p><strong>Current Inheritor:</strong></p>
          <p className="address">{currentInheritor}</p>
          <button onClick={onChangeInheritor} className="change-button">
            Change Inheritor
          </button>
        </div>
      )}

      <div className="nomination-form">
        <form onSubmit={handleNominate} style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
          <input
            type="text"
            placeholder="Enter inheritor wallet address"
            value={inheritorAddress}
            onChange={(e) => setNomineeInput ? setNomineeInput(e.target.value) : undefined}
            className="address-input"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={isLoading || !walletAddress}
            className="nominate-button"
          >
            {isLoading ? 'Nominating...' : 'Nominate'}
          </button>
        </form>
      </div>

      {(validationError || error) && (
        <div className="error-message">
          {validationError || error}
        </div>
      )}
    </div>
  );
};

export default InheritorNomination;
