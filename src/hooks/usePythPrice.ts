'use client';

import { useState, useEffect, useCallback } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

// Pyth Price Feed IDs on Solana (mainnet)
// Full list: https://pyth.network/developers/price-feed-ids
export const PYTH_PRICE_FEEDS: Record<string, string> = {
  'SOL/USD': 'H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG',
  'BTC/USD': 'GVXRSBjFk6e6J3NbVPXohDJetcTjaeeuykUpbQF8UoMU',
  'ETH/USD': 'JBu1AL4obBcCMqKBBxhpWCNUt136ijcuMZLFvTP7iWdB',
  'USDC/USD': 'Gnt27xtC473ZT2Mw5u8wZ68Z3gULkSTb5DuxJy7eJotD',
  'USDT/USD': '3vxLXJqLqF3JG5TCbYycbKWRBbCJQLxQmBGCkyqEEefL',
  'JUP/USD': 'g6eRCbboSwK4tSWngn773RCMexr1APQr4uA9bGZBYfo',
  'BONK/USD': '8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN',
  'RAY/USD': 'AnLf8tVYCM816gmBjiy8n53eXKKEDydT5piYjjQDPgTB',
  'ORCA/USD': '4ivThkX8uRxBpHsdWSqyXYihzKF3zpRGAUCqyuagnLoV',
  'PYTH/USD': 'nrYkQQQur7z8rYTST3G9GqATviK5SxTDkrqd21MW6Ue',
};

// Token mint to Pyth feed mapping
export const TOKEN_TO_PYTH_FEED: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL/USD', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC/USD', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT/USD', // USDT
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP/USD', // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK/USD', // BONK
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY/USD', // RAY
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'ORCA/USD', // ORCA
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3': 'PYTH/USD', // PYTH
};

export interface PythPrice {
  price: number;
  confidence: number;
  expo: number;
  publishTime: number;
}

// Parse Pyth price account data
function parsePythPriceData(data: Buffer): PythPrice | null {
  try {
    // Pyth V2 price account layout (simplified)
    // Full layout: https://github.com/pyth-network/pyth-sdk-solana
    
    // Magic number check (first 4 bytes should be 0xa1b2c3d4 for price accounts)
    const magic = data.readUInt32LE(0);
    if (magic !== 0xa1b2c3d4) {
      // Try parsing as V1 format
      return null;
    }

    // Version
    const version = data.readUInt32LE(4);
    
    // Price data starts at offset 208 for V2
    const priceOffset = version >= 2 ? 208 : 16;
    
    // Read price components
    const price = data.readBigInt64LE(priceOffset);
    const conf = data.readBigUInt64LE(priceOffset + 8);
    const expo = data.readInt32LE(priceOffset + 20);
    const publishTime = data.readBigInt64LE(priceOffset + 24);

    return {
      price: Number(price) * Math.pow(10, expo),
      confidence: Number(conf) * Math.pow(10, expo),
      expo,
      publishTime: Number(publishTime),
    };
  } catch (err) {
    console.error('Failed to parse Pyth price data:', err);
    return null;
  }
}

export const usePythPrice = (feedId: string) => {
  const { connection } = useConnection();
  const [price, setPrice] = useState<PythPrice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    try {
      const feedPubkey = PYTH_PRICE_FEEDS[feedId];
      if (!feedPubkey) {
        throw new Error(`Unknown feed: ${feedId}`);
      }

      const accountInfo = await connection.getAccountInfo(new PublicKey(feedPubkey));
      if (!accountInfo) {
        throw new Error('Price feed not found');
      }

      const priceData = parsePythPriceData(accountInfo.data);
      if (!priceData) {
        throw new Error('Failed to parse price data');
      }

      setPrice(priceData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch price');
      setPrice(null);
    } finally {
      setLoading(false);
    }
  }, [connection, feedId]);

  useEffect(() => {
    fetchPrice();
    
    // Poll every 5 seconds (Pyth updates every ~400ms, but we don't need that frequency)
    const interval = setInterval(fetchPrice, 5000);
    return () => clearInterval(interval);
  }, [fetchPrice]);

  return { price, loading, error, refetch: fetchPrice };
};

// Hook to get price for a token by its mint address
export const useTokenPrice = (mintAddress: string) => {
  const feedId = TOKEN_TO_PYTH_FEED[mintAddress];
  const { price, loading, error, refetch } = usePythPrice(feedId || 'SOL/USD');

  if (!feedId) {
    return { price: null, loading: false, error: 'Price feed not available for this token', refetch: () => {} };
  }

  return { price, loading, error, refetch };
};

// Hook to get multiple prices at once
export const usePythPrices = (feedIds: string[]) => {
  const { connection } = useConnection();
  const [prices, setPrices] = useState<Record<string, PythPrice>>({});
  const [loading, setLoading] = useState(true);

  const fetchPrices = useCallback(async () => {
    try {
      const pubkeys = feedIds
        .map(id => PYTH_PRICE_FEEDS[id])
        .filter(Boolean)
        .map(pk => new PublicKey(pk));

      const accounts = await connection.getMultipleAccountsInfo(pubkeys);
      
      const newPrices: Record<string, PythPrice> = {};
      
      accounts.forEach((account, index) => {
        if (account) {
          const priceData = parsePythPriceData(account.data);
          if (priceData) {
            newPrices[feedIds[index]] = priceData;
          }
        }
      });

      setPrices(newPrices);
    } catch (err) {
      console.error('Failed to fetch prices:', err);
    } finally {
      setLoading(false);
    }
  }, [connection, feedIds]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, refetch: fetchPrices };
};
