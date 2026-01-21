import { useState, useCallback, useEffect } from 'react';
import { QuoteResponse, QuoteGetRequest } from '@jup-ag/api';

const JUPITER_API_ENDPOINT = "https://quote.jup.ag/v6/quote";

// Basic Token Interface
export interface Token {
    address: string;
    chainId: number;
    decimals: number;
    name: string;
    symbol: string;
    logoURI?: string;
}

// Minimal hook to fetch quotes directly (Client-Side)
export const useJupiter = () => {
    const [quoteResponse, setQuoteResponse] = useState<QuoteResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch quote
    const fetchQuote = useCallback(async (
        inputMint: string,
        outputMint: string,
        amount: number, // Raw amount (not lamports, needs conversion)
        decimals: number,
        slippageBps: number = 50 // 0.5%
    ) => {
        if (!inputMint || !outputMint || !amount) return;

        setLoading(true);
        setError(null);

        try {
            // Convert amount to integer based on decimals
            const amountInLamports = Math.floor(amount * (10 ** decimals));

            const params = new URLSearchParams({
                inputMint,
                outputMint,
                amount: amountInLamports.toString(),
                slippageBps: slippageBps.toString(),
                // 'onlyDirectRoutes': 'false', 
                // 'asLegacyTransaction': 'false', 
            });

            const response = await fetch(`${JUPITER_API_ENDPOINT}?${params.toString()}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch quote');
            }

            const data: QuoteResponse = await response.json();
            setQuoteResponse(data);
        } catch (err: any) {
            console.error("Jupiter Quote Error:", err);
            setError(err.message || "Failed to get quote");
            setQuoteResponse(null);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearQuote = () => setQuoteResponse(null);

    return {
        quoteResponse,
        loading,
        error,
        fetchQuote,
        clearQuote
    };
};
