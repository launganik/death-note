import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeathWebhook from '../components/DeathWebhook';

describe('DeathWebhook', () => {
  const mockWalletAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders trigger button', () => {
    render(<DeathWebhook />);
    expect(screen.getByText('Trigger Death Event')).toBeInTheDocument();
  });

  it('makes webhook call when confirmed', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, message: 'Webhook received' })
    });
    render(<DeathWebhook />);
    // Set wallet id input
    fireEvent.change(screen.getByPlaceholderText('Wallet id of the deceased person'), { target: { value: mockWalletAddress } });
    fireEvent.click(screen.getByText('Trigger Death Event'));
    await waitFor(() => expect(screen.getByText('Confirm')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Confirm'));
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  });

  it('shows status message', () => {
    const mockStatus = { status: 'processing', message: 'Transfer in progress...' };
    render(<DeathWebhook status={mockStatus} />);
    expect(screen.getByText((content, node) => {
      const hasText = (node: Element) => node.textContent === 'Status: processing';
      const nodeHasText = hasText(node as Element);
      const childrenDontHaveText = Array.from(node?.children || []).every(
        child => !hasText(child as Element)
      );
      return nodeHasText && childrenDontHaveText;
    })).toBeInTheDocument();
    expect(screen.getByText('Transfer in progress...')).toBeInTheDocument();
  });
});
