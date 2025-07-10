import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InheritorNomination from '../components/InheritorNomination';

/**
 * Tests for InheritorNomination component
 * Tests inheritor nomination functionality
 */
describe('InheritorNomination', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';
  const mockInheritorAddress = '0x0987654321098765432109876543210987654321';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nomination form', () => {
    render(<InheritorNomination walletAddress={mockWalletAddress} />);
    
    expect(screen.getByText('Nominate Inheritor')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter inheritor wallet address')).toBeInTheDocument();
    expect(screen.getByText('Nominate')).toBeInTheDocument();
  });

  it('should display current inheritor when set', () => {
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        currentInheritor={mockInheritorAddress}
      />
    );
    
    expect(screen.getByText('Current Inheritor:')).toBeInTheDocument();
    expect(screen.getByText(mockInheritorAddress)).toBeInTheDocument();
  });

  it('should validate wallet address format', async () => {
    const mockOnNominate = jest.fn();
    
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        onNominate={mockOnNominate}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter inheritor wallet address');
    const nominateButton = screen.getByText('Nominate');
    
    fireEvent.change(input, { target: { value: 'invalid-address' } });
    fireEvent.click(nominateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid Ethereum address')).toBeInTheDocument();
    });
    
    expect(mockOnNominate).not.toHaveBeenCalled();
  });

  it('should call onNominate with valid address', async () => {
    const mockOnNominate = jest.fn();
    
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        onNominate={mockOnNominate}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter inheritor wallet address');
    const nominateButton = screen.getByText('Nominate');
    
    fireEvent.change(input, { target: { value: mockInheritorAddress } });
    fireEvent.click(nominateButton);
    
    await waitFor(() => {
      expect(mockOnNominate).toHaveBeenCalledWith(mockInheritorAddress);
    });
  });

  it('should show loading state during nomination', async () => {
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Nominating...')).toBeInTheDocument();
  });

  it('should display error message when nomination fails', () => {
    const mockError = 'Nomination failed';
    
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        error={mockError}
      />
    );
    
    expect(screen.getByText(mockError)).toBeInTheDocument();
  });

  it('should allow changing inheritor', async () => {
    const mockOnChange = jest.fn();
    
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        currentInheritor={mockInheritorAddress}
        onChangeInheritor={mockOnChange}
      />
    );
    
    const changeButton = screen.getByText('Change Inheritor');
    fireEvent.click(changeButton);
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledTimes(1);
    });
  });

  it('should prevent self-nomination', async () => {
    const mockOnNominate = jest.fn();
    
    render(
      <InheritorNomination 
        walletAddress={mockWalletAddress}
        onNominate={mockOnNominate}
      />
    );
    
    const input = screen.getByPlaceholderText('Enter inheritor wallet address');
    const nominateButton = screen.getByText('Nominate');
    
    fireEvent.change(input, { target: { value: mockWalletAddress } });
    fireEvent.click(nominateButton);
    
    await waitFor(() => {
      expect(screen.getByText('You cannot nominate yourself as inheritor')).toBeInTheDocument();
    });
    
    expect(mockOnNominate).not.toHaveBeenCalled();
  });
});
