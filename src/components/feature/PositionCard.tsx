'use client';
import { FC, useState, useEffect, useCallback } from 'react';
import { TokenInput } from '@/components/ui/TokenInput';
import { Token } from '@/hooks/useJupiter';
import { useTokenList } from '@/hooks/useTokenList';
import { usePyroProgram } from '@/hooks/usePyroProgram';
import { useWallet } from '@solana/wallet-adapter-react';
import { PlusCircle, Target, ShieldAlert, Loader2, Check, ExternalLink } from 'lucide-react';

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

type PositionState = 'idle' | 'creating' | 'success' | 'error';

export const PositionCard: FC = () => {
    const { connected } = useWallet();
    const { getToken, topTokens } = useTokenList();
    const { openPosition, loading, error } = usePyroProgram();
    
    const [token, setToken] = useState<Token>(DEFAULT_SOL);
    const [amount, setAmount] = useState<string>('');
    const [tp, setTp] = useState<string>('10');
    const [sl, setSl] = useState<string>('5');
    const [state, setState] = useState<PositionState>('idle');
    const [txSignature, setTxSignature] = useState<string | null>(null);

    // Update token with full data when available
    useEffect(() => {
        if (topTokens.length > 0) {
            const sol = getToken(DEFAULT_SOL.address);
            if (sol && token.address === DEFAULT_SOL.address) setToken(sol);
        }
    }, [topTokens, getToken]);

    const hasAmount = amount && parseFloat(amount) > 0;
    const hasTp = tp && parseFloat(tp) > 0;
    const hasSl = sl && parseFloat(sl) > 0;
    const canCreate = connected && hasAmount && hasTp && hasSl && state !== 'creating';

    // Mock current price - in production, fetch from Pyth
    const getCurrentPrice = useCallback(async (): Promise<number> => {
        // TODO: Fetch real price from Pyth oracle
        // For now, use approximate SOL price
        return 100; // $100 per SOL (placeholder)
    }, []);

    const handleCreatePosition = useCallback(async () => {
        if (!canCreate) return;

        setState('creating');
        setTxSignature(null);

        try {
            const currentPrice = await getCurrentPrice();
            
            const tx = await openPosition(
                token.address,
                DEFAULT_USDC.address, // Output to USDC
                parseFloat(amount),
                token.decimals,
                parseFloat(sl),
                parseFloat(tp),
                currentPrice,
                0 // Raydium by default
            );

            setTxSignature(tx);
            setState('success');
            
            // Reset form after success
            setTimeout(() => {
                setAmount('');
                setState('idle');
                setTxSignature(null);
            }, 5000);

        } catch (err) {
            console.error('Failed to create position:', err);
            setState('error');
        }
    }, [canCreate, token, amount, sl, tp, openPosition, getCurrentPrice]);

    const getButtonText = () => {
        if (!connected) return 'Connect Wallet';
        if (state === 'creating') return 'Creating Position...';
        if (state === 'success') return 'Position Created!';
        if (state === 'error') return 'Try Again';
        if (!hasAmount) return 'Enter Amount';
        if (!hasTp || !hasSl) return 'Set TP/SL';
        return 'Create Position';
    };

    return (
        <div className="w-full max-w-[420px] mx-auto">
            {/* Card */}
            <div className="bg-[#1c1c1c] rounded-2xl p-4 border border-white/10 shadow-xl">
                {/* Header */}
                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-white">Limit Order</h2>
                    <p className="text-sm text-white/50">Set automated TP/SL triggers</p>
                </div>

                {/* Asset Selection */}
                <TokenInput 
                    label="Asset to Trade"
                    amount={amount}
                    setAmount={setAmount}
                    token={token}
                    setToken={setToken}
                />

                {/* Controls */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                    {/* Take Profit */}
                    <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4 hover:border-green-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-3 text-green-400">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Take Profit</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-medium text-green-400">+</span>
                            <input 
                                type="text"
                                inputMode="decimal"
                                value={tp}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setTp(val);
                                    }
                                }}
                                className="w-full bg-transparent text-2xl font-semibold text-white outline-none" 
                            />
                            <span className="text-sm text-white/50">%</span>
                        </div>
                    </div>

                    {/* Stop Loss */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 hover:border-red-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-3 text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase tracking-wide">Stop Loss</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-lg font-medium text-red-400">-</span>
                            <input 
                                type="text"
                                inputMode="decimal"
                                value={sl}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setSl(val);
                                    }
                                }}
                                className="w-full bg-transparent text-2xl font-semibold text-white outline-none" 
                            />
                            <span className="text-sm text-white/50">%</span>
                        </div>
                    </div>
                </div>

                {/* Fee Info */}
                <div className="mt-4 p-3 bg-white/5 rounded-xl space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-white/50">Execution Bounty</span>
                        <span className="text-white">0.005 SOL</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-white/50">Protocol Fee</span>
                        <span className="text-white">1.0%</span>
                    </div>
                </div>

                {/* Success Message */}
                {state === 'success' && txSignature && (
                    <div className="mt-4 flex items-center justify-between py-3 px-4 bg-green-500/10 rounded-xl border border-green-500/20">
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400" />
                            <span className="text-sm text-green-400">Position created!</span>
                        </div>
                        <a
                            href={`https://solscan.io/tx/${txSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-green-400 hover:underline"
                        >
                            View <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                )}

                {/* Error Message */}
                {state === 'error' && error && (
                    <div className="mt-4 py-3 px-4 bg-red-500/10 rounded-xl border border-red-500/20">
                        <span className="text-sm text-red-400">{error}</span>
                    </div>
                )}

                {/* Action */}
                <button 
                    disabled={!canCreate && state !== 'error'}
                    onClick={handleCreatePosition}
                    className={`w-full h-14 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 mt-4
                        ${state === 'success'
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : canCreate || state === 'error'
                                ? 'bg-secondary hover:bg-secondary/90 text-black'
                                : 'bg-white/5 text-white/40 cursor-not-allowed'}`}
                >
                    {state === 'creating' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : state === 'success' ? (
                        <Check className="w-5 h-5" />
                    ) : (
                        <PlusCircle className="w-5 h-5" />
                    )}
                    <span>{getButtonText()}</span>
                </button>
            </div>
        </div>
    );
};
