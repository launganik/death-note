import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { formatUnits } from '@ethersproject/units';

interface TokenBalancesProps {
  tokenAddress: string;
  address: string; // Single address to show balance for
  balanceType: 'owner' | 'nominee'; // Type of balance to display
  providerUrl?: string; // Optional, defaults to localhost
}

const erc20Abi = [
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
];

const TokenBalances: React.FC<TokenBalancesProps> = ({ tokenAddress, address, balanceType, providerUrl }) => {
  const [balance, setBalance] = useState<string>('0');
  const [symbol, setSymbol] = useState<string>('');
  const [decimals, setDecimals] = useState<number>(18);
  const [loading, setLoading] = useState(false);

  const fetchBalance = async () => {
    setLoading(true);
    try {
      // For ethers v6, use new ethers.JsonRpcProvider
      const provider = new ethers.JsonRpcProvider(providerUrl || 'http://localhost:8545');
      const token = new ethers.Contract(tokenAddress, erc20Abi, provider);
      const [addressBal, tokenSymbol, tokenDecimals] = await Promise.all([
        token.balanceOf(address),
        token.symbol(),
        token.decimals()
      ]);
      setBalance(formatUnits(addressBal, tokenDecimals));
      setSymbol(tokenSymbol);
      setDecimals(tokenDecimals);
    } catch (err) {
      setBalance('Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // eslint-disable-next-line
  }, [tokenAddress, address]);

  const getTitle = () => {
    const shortAddress = `${address.slice(0, 8)}...`;
    return balanceType === 'owner' ? `Owner Balance (${shortAddress})` : `Nominee Balance (${shortAddress})`;
  };

  return (
    <div className="token-balances">
      <h3>{getTitle()}</h3>
      <button onClick={fetchBalance} disabled={loading} style={{marginBottom: 8}}>
        {loading ? 'Refreshing...' : 'Refresh'}
      </button>
      <div>
        <strong>Balance:</strong> {balance} {symbol}
      </div>
    </div>
  );
};

export default TokenBalances;
