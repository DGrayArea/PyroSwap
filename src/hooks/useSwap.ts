'use client';

import { useState, useCallback, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';

// Quote response interface
export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  priceImpactPct: number;
  routePlan?: any[];
  source: 'jupiter' | 'raydium' | 'orca';
}

// Quote cache to reduce API calls
interface CacheEntry {
  quote: SwapQuote;
  timestamp: number;
}

const quoteCache = new Map<string, CacheEntry>();
const CACHE_TTL = 10000; // 10 seconds

// Rate limit tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 500; // 500ms between requests

export const useSwap = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [swapping, setSwapping] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Get quote with caching and rate limiting
  const getQuote = useCallback(async (
    inputMint: string,
    outputMint: string,
    amount: number,
    inputDecimals: number,
    slippageBps: number = 50
  ): Promise<SwapQuote | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Validation
    if (!amount || amount <= 0) {
      setQuote(null);
      return null;
    }

    const amountInLamports = Math.floor(amount * (10 ** inputDecimals));
    const cacheKey = `${inputMint}-${outputMint}-${amountInLamports}-${slippageBps}`;

    // Check cache
    const cached = quoteCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setQuote(cached.quote);
      return cached.quote;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    try {
      setLoading(true);
      setError(null);

      // Try Jupiter first (best aggregation)
      const jupiterQuote = await fetchJupiterQuote(
        inputMint,
        outputMint,
        amountInLamports,
        slippageBps,
        abortControllerRef.current.signal
      );

      if (jupiterQuote) {
        const swapQuote: SwapQuote = {
          inputMint,
          outputMint,
          inAmount: jupiterQuote.inAmount,
          outAmount: jupiterQuote.outAmount,
          otherAmountThreshold: jupiterQuote.otherAmountThreshold,
          priceImpactPct: jupiterQuote.priceImpactPct || 0,
          routePlan: jupiterQuote.routePlan,
          source: 'jupiter',
        };

        // Cache the result
        quoteCache.set(cacheKey, { quote: swapQuote, timestamp: Date.now() });
        setQuote(swapQuote);
        return swapQuote;
      }

      throw new Error('No route found');
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return null; // Request was cancelled, ignore
      }
      
      const message = err.message || 'Failed to get quote';
      
      // Handle rate limit errors gracefully
      if (message.includes('429') || message.includes('rate')) {
        setError('Rate limited. Please wait a moment...');
      } else {
        setError(message);
      }
      
      setQuote(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Execute swap
  const executeSwap = useCallback(async (): Promise<string | null> => {
    if (!publicKey || !signTransaction || !quote) {
      setError('Wallet not connected or no quote available');
      return null;
    }

    try {
      setSwapping(true);
      setError(null);

      // Get swap transaction from Jupiter
      const response = await fetch('https://quote-api.jup.ag/v6/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey: publicKey.toBase58(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to build swap transaction');
      }

      const { swapTransaction } = await response.json();

      // Deserialize
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);

      // Sign
      const signedTx = await signTransaction(transaction);

      // Send
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
        maxRetries: 3,
      });

      // Confirm
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error('Transaction failed');
      }

      return signature;
    } catch (err: any) {
      setError(err.message || 'Swap failed');
      return null;
    } finally {
      setSwapping(false);
    }
  }, [connection, publicKey, signTransaction, quote]);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return {
    quote,
    loading,
    error,
    swapping,
    getQuote,
    executeSwap,
    clearQuote,
  };
};

// Jupiter API helper
async function fetchJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number,
  signal: AbortSignal
): Promise<any | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const response = await fetch(`https://quote-api.jup.ag/v6/quote?${params}`, {
      signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limited');
      }
      return null;
    }

    return await response.json();
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    console.error('Jupiter quote error:', err);
    return null;
  }
}

// Helper to format amounts
export function formatAmount(amount: string, decimals: number): string {
  const value = parseInt(amount) / (10 ** decimals);
  if (value < 0.0001) return value.toExponential(2);
  if (value < 1) return value.toFixed(6);
  if (value < 1000) return value.toFixed(4);
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}
