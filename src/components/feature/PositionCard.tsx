'use client';
import { FC, useState } from 'react';
import { TokenInput } from '@/components/ui/TokenInput';
import { Token } from '@/hooks/useJupiter';
import { useWallet } from '@solana/wallet-adapter-react';
import { PlusCircle, Target, ShieldAlert } from 'lucide-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const SOL_TOKEN: Token = { address: 'So11111111111111111111111111111111111111112', chainId: 101, decimals: 9, name: 'Solana', symbol: 'SOL' };
const USDC_TOKEN: Token = { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chainId: 101, decimals: 6, name: 'USDC', symbol: 'USDC' };

export const PositionCard: FC = () => {
    const { connected } = useWallet();
    
    const [token, setToken] = useState<Token>(SOL_TOKEN);
    const [amount, setAmount] = useState<string>('');
    const [tp, setTp] = useState<string>('10'); // %
    const [sl, setSl] = useState<string>('5'); // %

    return (
        <div className="w-full max-w-[480px] mx-auto opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-forwards" style={{animationDelay: '100ms'}}>
             {/* Header */}
             <div className="mb-4 px-2">
                <h2 className="text-xl font-bold font-display">Create Order</h2>
                <p className="text-xs text-white/50">Automated Stop Loss & Take Profit</p>
            </div>

            <div className="glass-card rounded-3xl p-4 space-y-4">
                 {/* Asset Selection */}
                <div className="space-y-2">
                    <TokenInput 
                        label="Asset to Trade"
                        amount={amount}
                        setAmount={setAmount}
                        token={token}
                        setToken={setToken}
                    />
                </div>

                {/* Controls */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Take Profit */}
                    <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 hover:border-green-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-green-400">
                            <Target className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Take Profit</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-lg font-medium text-green-400">+</span>
                            <input 
                                type="number" 
                                value={tp}
                                onChange={(e) => setTp(e.target.value)}
                                className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                            <span className="text-sm font-medium text-white/50 mb-1">%</span>
                        </div>
                    </div>

                    {/* Stop Loss */}
                    <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-4 hover:border-red-500/40 transition-colors">
                        <div className="flex items-center gap-2 mb-2 text-red-400">
                            <ShieldAlert className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Stop Loss</span>
                        </div>
                        <div className="flex items-end gap-1">
                            <span className="text-lg font-medium text-red-400">-</span>
                            <input 
                                type="number" 
                                value={sl}
                                onChange={(e) => setSl(e.target.value)}
                                className="w-full bg-transparent text-2xl font-bold text-white outline-none" 
                            />
                            <span className="text-sm font-medium text-white/50 mb-1">%</span>
                        </div>
                    </div>
                </div>

                {/* Fee Info */}
                <div className="bg-white/5 rounded-xl p-3 text-xs text-white/60 space-y-1">
                    <div className="flex justify-between">
                        <span>Bot Execution Bounty (Gas)</span>
                        <span className="text-white">0.005 SOL</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Protocol Fee (on Success)</span>
                        <span className="text-white">1.0%</span>
                    </div>
                </div>

                {/* Action */}
                <div className="pt-2">
                     {!connected ? (
                        <WalletMultiButton className="w-full !bg-white/10 !h-14 !rounded-2xl !font-display !font-bold justify-center" />
                    ) : (
                        <button className="w-full h-14 bg-gradient-to-r from-secondary/80 to-blue-600 hover:from-secondary hover:to-blue-500 text-white rounded-2xl font-display font-bold text-lg shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-2">
                            <PlusCircle className="w-5 h-5" />
                            <span>Create Position</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
