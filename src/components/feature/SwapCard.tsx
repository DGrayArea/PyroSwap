'use client';
import { FC, useState, useEffect, useCallback } from 'react';
import { TokenInput } from '@/components/ui/TokenInput';
import { Token } from '@/hooks/useJupiter';
import { useSwap, formatAmount } from '@/hooks/useSwap';
import { useTokenList } from '@/hooks/useTokenList';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDownUp, RefreshCw, Settings, Check, ExternalLink, AlertTriangle } from 'lucide-react';

// Default tokens with logos
const DEFAULT_SOL: Token = { 
    address: 'So11111111111111111111111111111111111111112', 
    chainId: 101, 
    decimals: 9, 
    name: 'Solana', 
    symbol: 'SOL',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
};
const DEFAULT_USDC: Token = { 
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 
    chainId: 101, 
    decimals: 6, 
    name: 'USD Coin', 
    symbol: 'USDC',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
};

type SwapState = 'idle' | 'quoting' | 'ready' | 'signing' | 'confirming' | 'success' | 'error';

export const SwapCard: FC = () => {
    const { connected, publicKey } = useWallet();
    const { quote, loading, error, swapping, getQuote, executeSwap, clearQuote } = useSwap();
    const { getToken, topTokens } = useTokenList();

    const [inputToken, setInputToken] = useState<Token>(DEFAULT_SOL);
    const [outputToken, setOutputToken] = useState<Token>(DEFAULT_USDC);
    const [amountIn, setAmountIn] = useState<string>('');
    const [slippage, setSlippage] = useState<number>(50); // 0.5%
    const [showSettings, setShowSettings] = useState(false);
    const [swapState, setSwapState] = useState<SwapState>('idle');
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Update tokens with full data from token list when available
    useEffect(() => {
        if (topTokens.length > 0) {
            const sol = getToken(DEFAULT_SOL.address);
            const usdc = getToken(DEFAULT_USDC.address);
            if (sol && inputToken.address === DEFAULT_SOL.address) setInputToken(sol);
            if (usdc && outputToken.address === DEFAULT_USDC.address) setOutputToken(usdc);
        }
    }, [topTokens, getToken]);

    // Debounced quote fetching
    useEffect(() => {
        const amount = parseFloat(amountIn);
        if (!amount || amount <= 0) {
            clearQuote();
            setSwapState('idle');
            return;
        }

        setSwapState('quoting');
        const timeoutId = setTimeout(() => {
            getQuote(inputToken.address, outputToken.address, amount, inputToken.decimals, slippage)
                .then(q => {
                    setSwapState(q ? 'ready' : 'idle');
                });
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [amountIn, inputToken, outputToken, slippage, getQuote, clearQuote]);

    const handleSwapTokens = useCallback(() => {
        const temp = inputToken;
        setInputToken(outputToken);
        setOutputToken(temp);
        setAmountIn('');
        clearQuote();
    }, [inputToken, outputToken, clearQuote]);

    const handleSwap = async () => {
        if (!quote || swapping) return;

        setSwapState('signing');
        setTxSignature(null);

        const signature = await executeSwap();
        
        if (signature) {
            setTxSignature(signature);
            setSwapState('success');
            setAmountIn('');
            // Reset after 5 seconds
            setTimeout(() => {
                setSwapState('idle');
                setTxSignature(null);
                clearQuote();
            }, 5000);
        } else {
            setSwapState('error');
        }
    };

    // Calculate output amount
    const getOutputAmount = (): string => {
        if (!quote) return '';
        return formatAmount(quote.outAmount, outputToken.decimals);
    };

    // Get button state
    const getButtonContent = () => {
        if (!connected) {
            return { text: 'Connect Wallet', disabled: true };
        }
        
        switch (swapState) {
            case 'quoting':
                return { text: 'Finding Route...', disabled: true, loading: true };
            case 'signing':
                return { text: 'Confirm in Wallet', disabled: true, loading: true };
            case 'confirming':
                return { text: 'Confirming...', disabled: true, loading: true };
            case 'success':
                return { text: 'Swap Successful!', disabled: true, success: true };
            case 'error':
                return { text: 'Try Again', disabled: false };
            case 'ready':
                return { text: 'Swap', disabled: false };
            default:
                const amount = parseFloat(amountIn);
                if (!amount || amount <= 0) {
                    return { text: 'Enter Amount', disabled: true };
                }
                return { text: 'Swap', disabled: true };
        }
    };

    const buttonState = getButtonContent();

    // Calculate rate
    const getRate = (): string | null => {
        if (!quote || !amountIn) return null;
        const outAmount = parseInt(quote.outAmount) / (10 ** outputToken.decimals);
        const inAmount = parseFloat(amountIn);
        if (inAmount <= 0) return null;
        return (outAmount / inAmount).toFixed(6);
    };

    return (
        <div className="w-full max-w-[420px] mx-auto">
            {/* Card */}
            <div className="bg-[#131313] rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/5">
                    <h2 className="text-base font-semibold text-white">Swap</h2>
                    <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-white/10 text-white' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                {/* Settings Panel */}
                {showSettings && (
                    <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-white/60">Slippage Tolerance</span>
                            <div className="flex gap-1">
                                {[10, 50, 100].map(bps => (
                                    <button
                                        key={bps}
                                        onClick={() => setSlippage(bps)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                                            slippage === bps 
                                                ? 'bg-primary text-white' 
                                                : 'bg-white/5 text-white/60 hover:bg-white/10'
                                        }`}
                                    >
                                        {bps / 100}%
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-4 space-y-1">
                    {/* Input Token */}
                    <TokenInput 
                        label="You Pay"
                        amount={amountIn}
                        setAmount={setAmountIn}
                        token={inputToken}
                        setToken={setInputToken}
                    />
                    
                    {/* Swap Direction Button */}
                    <div className="relative h-0 flex items-center justify-center z-10">
                        <button 
                            onClick={handleSwapTokens}
                            className="absolute bg-[#131313] border-4 border-[#0a0a0a] p-2 rounded-xl hover:bg-white/10 transition-all hover:rotate-180 duration-300"
                        >
                            <ArrowDownUp className="w-4 h-4 text-white/70" />
                        </button>
                    </div>

                    {/* Output Token */}
                    <TokenInput 
                        label="You Receive"
                        amount={getOutputAmount()}
                        setAmount={() => {}}
                        token={outputToken}
                        setToken={setOutputToken}
                        disabled
                    />
                </div>

                {/* Quote Info */}
                {quote && (
                    <div className="mx-4 mb-4 p-3 bg-white/[0.03] rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Rate</span>
                            <span className="text-white">
                                1 {inputToken.symbol} ≈ {getRate()} {outputToken.symbol}
                            </span>
                        </div>
                        {quote.priceImpactPct > 1 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-white/50">Price Impact</span>
                                <span className={quote.priceImpactPct > 5 ? 'text-red-400' : 'text-yellow-400'}>
                                    {quote.priceImpactPct.toFixed(2)}%
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between text-sm">
                            <span className="text-white/50">Route</span>
                            <span className="text-white capitalize">{quote.source}</span>
                        </div>
                    </div>
                )}
                
                {/* Error Display */}
                {error && swapState !== 'success' && (
                    <div className="mx-4 mb-4 flex items-center gap-2 text-sm py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                        <span className="text-red-400">{error}</span>
                    </div>
                )}

                {/* Success Message */}
                {swapState === 'success' && txSignature && (
                    <div className="mx-4 mb-4 flex items-center justify-between py-3 px-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Swap successful!</span>
                        </div>
                        <a
                            href={`https://solscan.io/tx/${txSignature}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-green-400 hover:underline"
                        >
                            View <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}

                {/* Main Action Button */}
                <div className="p-4 pt-0">
                    <button 
                        onClick={handleSwap}
                        disabled={buttonState.disabled}
                        className={`w-full h-14 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2
                            ${buttonState.success
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : buttonState.disabled
                                    ? 'bg-white/5 text-white/40 cursor-not-allowed'
                                    : 'bg-primary hover:bg-primary/90 text-white'
                            }`}
                    >
                        {buttonState.loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                        {buttonState.success && <Check className="w-5 h-5" />}
                        <span>{buttonState.text}</span>
                    </button>
                </div>
            </div>
            
            <div className="mt-4 text-center">
                <p className="text-white/30 text-xs">Powered by PyroSwap Protocol</p>
            </div>
        </div>
    );
};
