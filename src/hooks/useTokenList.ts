'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Token } from './useJupiter';

interface JupiterToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  daily_volume?: number;
}

const CUSTOM_TOKENS_KEY = 'pyroswap_custom_tokens';
const TOKEN_CACHE_KEY = 'pyroswap_token_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

// Top tokens by popularity/volume - these will always be shown first
const TOP_TOKEN_ADDRESSES = [
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', // WIF
  'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', // PYTH
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
  'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', // JitoSOL
  'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1', // bSOL
  'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', // RENDER
  '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', // POPCAT
  'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5', // MEW
  '27G8MtK7VtTcCHkpASjSDdkWWYfoqT6ggEuKidVJidD4', // JLP
  '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH (Wormhole)
  '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // WBTC
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // ORCA
  'RLBxxFkseAZ4RgJH3Sqn8jXxhmGoz9jWxDNJMh8pL7a', // RAY
  'MNDEFzGvMt87ueuHvVU9VcTqsAP5b3fTGPsHuuPA5ey', // MNDE
  'BLZEEuZUBVqFhj8adcCFPJvPVCiCyVmh3hkJMrU8KuJA', // BLZE
];

export const useTokenList = () => {
  const [allTokens, setAllTokens] = useState<Token[]>([]);
  const [topTokens, setTopTokens] = useState<Token[]>([]);
  const [customTokens, setCustomTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tokenMapRef = useRef<Map<string, Token>>(new Map());

  // Load custom tokens from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
      if (stored) {
        setCustomTokens(JSON.parse(stored));
      }
    } catch (err) {
      console.error('Failed to load custom tokens:', err);
    }
  }, []);

  // Fetch token list from Jupiter
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);

        // Check cache first
        const cached = localStorage.getItem(TOKEN_CACHE_KEY);
        if (cached) {
          const { tokens, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_DURATION) {
            processTokens(tokens);
            setLoading(false);
            return;
          }
        }

        // Fetch from Jupiter strict list (verified tokens only)
        const response = await fetch('https://token.jup.ag/strict');
        
        if (!response.ok) {
          throw new Error('Failed to fetch token list');
        }

        const jupiterTokens: JupiterToken[] = await response.json();
        
        // Cache the result
        try {
          localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify({
            tokens: jupiterTokens,
            timestamp: Date.now(),
          }));
        } catch (e) {
          // Cache might be full, ignore
        }

        processTokens(jupiterTokens);
        setError(null);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to load tokens');
        
        // Fallback tokens
        const fallback = getFallbackTokens();
        setAllTokens(fallback);
        setTopTokens(fallback);
      } finally {
        setLoading(false);
      }
    };

    const processTokens = (jupiterTokens: JupiterToken[]) => {
      const tokens: Token[] = jupiterTokens.map(t => ({
        address: t.address,
        chainId: t.chainId,
        decimals: t.decimals,
        name: t.name,
        symbol: t.symbol,
        logoURI: t.logoURI,
      }));

      // Build a map for quick lookup
      const tokenMap = new Map<string, Token>();
      tokens.forEach(t => tokenMap.set(t.address, t));
      tokenMapRef.current = tokenMap;

      setAllTokens(tokens);

      // Get top tokens - prioritize our curated list, then fill with others
      const topList: Token[] = [];
      TOP_TOKEN_ADDRESSES.forEach(addr => {
        const token = tokenMap.get(addr);
        if (token) topList.push(token);
      });

      // Add more tokens to reach 50
      const remaining = tokens.filter(t => !TOP_TOKEN_ADDRESSES.includes(t.address));
      const additionalTokens = remaining.slice(0, 50 - topList.length);
      
      setTopTokens([...topList, ...additionalTokens]);
    };

    fetchTokens();
  }, []);

  // Add custom token
  const addCustomToken = useCallback((token: Token) => {
    setCustomTokens(prev => {
      // Don't add if already exists
      if (prev.some(t => t.address === token.address)) return prev;
      
      const updated = [token, ...prev];
      try {
        localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save custom token:', err);
      }
      return updated;
    });
  }, []);

  // Remove custom token
  const removeCustomToken = useCallback((address: string) => {
    setCustomTokens(prev => {
      const updated = prev.filter(t => t.address !== address);
      try {
        localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to remove custom token:', err);
      }
      return updated;
    });
  }, []);

  // Search tokens
  const searchTokens = useCallback((query: string): Token[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase().trim();
    const allAvailable = [...customTokens, ...allTokens];
    const seen = new Set<string>();
    
    return allAvailable.filter(token => {
      if (seen.has(token.address)) return false;
      seen.add(token.address);
      
      return (
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.address.toLowerCase() === lowerQuery
      );
    }).slice(0, 50);
  }, [allTokens, customTokens]);

  // Get token by address
  const getToken = useCallback((address: string): Token | undefined => {
    return tokenMapRef.current.get(address) || customTokens.find(t => t.address === address);
  }, [customTokens]);

  return {
    allTokens,
    topTokens,
    customTokens,
    loading,
    error,
    addCustomToken,
    removeCustomToken,
    searchTokens,
    getToken,
  };
};

// DexScreener token import hook
export const useTokenImport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewToken, setPreviewToken] = useState<Token | null>(null);

  const fetchTokenInfo = useCallback(async (address: string): Promise<Token | null> => {
    try {
      setLoading(true);
      setError(null);
      setPreviewToken(null);

      // Try DexScreener API for Solana
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      
      if (!response.ok) {
        throw new Error('Token not found');
      }

      const data = await response.json();
      
      if (!data.pairs || data.pairs.length === 0) {
        throw new Error('No trading pairs found');
      }

      // Find Solana pairs
      const solanaPairs = data.pairs.filter((p: any) => p.chainId === 'solana');
      if (solanaPairs.length === 0) {
        throw new Error('Not a Solana token');
      }

      // Get the most liquid pair
      const pair = solanaPairs.sort((a: any, b: any) => 
        (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0)
      )[0];

      const tokenInfo = pair.baseToken.address.toLowerCase() === address.toLowerCase() 
        ? pair.baseToken 
        : pair.quoteToken;

      const token: Token = {
        address: tokenInfo.address,
        chainId: 101,
        decimals: 9, // Default, might need adjustment
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        logoURI: pair.info?.imageUrl,
      };

      setPreviewToken(token);
      return token;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch token';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearPreview = useCallback(() => {
    setPreviewToken(null);
    setError(null);
  }, []);

  return { 
    fetchTokenInfo, 
    loading, 
    error, 
    previewToken,
    clearPreview,
  };
};

// Fallback tokens if API fails
function getFallbackTokens(): Token[] {
  return [
    { address: 'So11111111111111111111111111111111111111112', chainId: 101, decimals: 9, name: 'Solana', symbol: 'SOL', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png' },
    { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 101, decimals: 6, name: 'USD Coin', symbol: 'USDC', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png' },
    { address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', chainId: 101, decimals: 6, name: 'Tether USD', symbol: 'USDT', logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png' },
    { address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', chainId: 101, decimals: 6, name: 'Jupiter', symbol: 'JUP', logoURI: 'https://static.jup.ag/jup/icon.png' },
    { address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', chainId: 101, decimals: 5, name: 'Bonk', symbol: 'BONK', logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I' },
  ];
}
