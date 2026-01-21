'use client';
import { FC, useState, useEffect } from 'react';
import { TokenInput } from '@/components/ui/TokenInput';
import { useJupiter, Token } from '@/hooks/useJupiter';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowDown, RefreshCw, Layers } from 'lucide-react';

const SOL_TOKEN: Token = { address: 'So11111111111111111111111111111111111111112', chainId: 101, decimals: 9, name: 'Solana', symbol: 'SOL' };
const USDC_TOKEN: Token = { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 101, decimals: 6, name: 'USDC', symbol: 'USDC' };

export const SwapCard: FC = () => {
    const { connected } = useWallet();
    const { quoteResponse, loading, error, fetchQuote } = useJupiter();

    const [inputToken, setInputToken] = useState<Token>(SOL_TOKEN);
    const [outputToken, setOutputToken] = useState<Token>(USDC_TOKEN);
    const [amountIn, setAmountIn] = useState<string>('');

    // Debounce Fetch
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (amountIn && parseFloat(amountIn) > 0) {
                fetchQuote(inputToken.address, outputToken.address, parseFloat(amountIn), inputToken.decimals);
            }
        }, 600); // 600ms debounce
        return () => clearTimeout(timeoutId);
    }, [amountIn, inputToken, outputToken, fetchQuote]);

    return (
        <div className="w-full max-w-[480px] mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 px-2">
                <h2 className="text-xl font-bold font-display">Swap</h2>
                <button className="p-2 hover:bg-white/5 rounded-full text-white/50 hover:text-white transition-colors">
                     <Layers className="w-5 h-5" />
                </button>
            </div>

            {/* Card */}
            <div className="glass-card rounded-3xl p-4 space-y-2">
                <TokenInput 
                    label="You Pay"
                    amount={amountIn}
                    setAmount={setAmountIn}
                    token={inputToken}
                    setToken={setInputToken}
                />
                
                <div className="relative h-4 flex items-center justify-center z-10">
                    <button className="absolute bg-surface border border-white/10 p-2 rounded-xl hover:scale-110 transition-transform">
                        <ArrowDown className="w-4 h-4 text-primary" />
                    </button>
                </div>

                <TokenInput 
                    label="You Receive"
                    amount={quoteResponse ? (parseInt(quoteResponse.outAmount) / (10 ** outputToken.decimals)).toFixed(outputToken.decimals > 5 ? 4 : 2) : ''}
                    setAmount={() => {}} // Read only
                    token={outputToken}
                    setToken={setOutputToken}
                    disabled
                />

                {/* Route Info */}
                {quoteResponse && (
                    <div className="px-2 py-3 text-xs text-white/50 flex justify-between items-center bg-white/5 rounded-xl mt-2">
                        <span>Rate Loop</span>
                        <div className="flex items-center gap-1">
                            <span className="text-primary font-bold">Best Price</span>
                            <span className="bg-primary/20 text-primary px-1.5 rounded text-[10px]">JUPITER</span>
                        </div>
                    </div>
                )}
                
                {/* Error Display */}
                {error && (
                    <div className="text-red-500 text-xs text-center py-2 bg-red-500/10 rounded-xl">
                        {error}
                    </div>
                )}

                {/* Main Action Button */}
                <div className="mt-4">
                    {!connected ? (
                        <WalletMultiButton className="w-full !bg-primary !h-14 !rounded-2xl !font-display !font-bold justify-center" />
                    ) : (
                        <button 
                            disabled={loading || !quoteResponse}
                            className={`w-full h-14 rounded-2xl font-display font-bold text-lg transition-all
                                ${loading 
                                    ? 'bg-white/10 text-white/30 cursor-wait' 
                                    : 'bg-primary hover:bg-primary/90 text-white shadow-[0_0_20px_rgba(255,69,0,0.4)] hover:shadow-[0_0_30px_rgba(255,69,0,0.6)]'}`}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    <span>Fetching Best Route...</span>
                                </div>
                            ) : 'Swap Now'}
                        </button>
                    )}
                </div>
            </div>
            
            <div className="mt-6 text-center">
                 <p className="text-white/30 text-xs">Powered by PyroSwap Protocol & Jupiter</p>
            </div>
        </div>
    );
};
