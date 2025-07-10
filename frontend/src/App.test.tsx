import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders crypto inheritance system header', () => {
  render(<App />);
  const headerElement = screen.getByText(/crypto inheritance system/i);
  expect(headerElement).toBeInTheDocument();
});

test('renders wallet connection component', () => {
  render(<App />);
  const walletConnectionElement = screen.getByText(/wallet connection/i);
  expect(walletConnectionElement).toBeInTheDocument();
});

test('renders secure your digital assets text', () => {
  render(<App />);
  const textElement = screen.getByText(/secure your digital assets for future generations/i);
  expect(textElement).toBeInTheDocument();
});
