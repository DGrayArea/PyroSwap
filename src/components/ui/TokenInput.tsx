'use client';
import { FC } from 'react';
import { ChevronDown } from 'lucide-react';
import { Token } from '@/hooks/useJupiter';

interface TokenInputProps {
    label: string;
    amount: string;
    setAmount: (val: string) => void;
    token: Token | null;
    setToken: (t: Token) => void;
    balance?: number;
    disabled?: boolean;
}

export const TokenInput: FC<TokenInputProps> = ({ 
    label, amount, setAmount, token, setToken, balance, disabled 
}) => {
    return (
        <div className="bg-surface-highlight/50 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors">
            <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-white/50">{label}</span>
                {balance !== undefined && (
                    <span className="text-xs font-medium text-white/50">
                        Balance: {balance.toFixed(4)}
                    </span>
                )}
            </div>
            
            <div className="flex items-center gap-3">
                <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={disabled}
                    className="w-full bg-transparent text-2xl font-bold text-white placeholder-white/20 outline-none"
                    style={{ appearance: 'none' }}
                />
                
                <button 
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-colors shrink-0"
                    // onClick={() => openTokenSelector()} // Todo
                >
                    {token ? (
                        <div className="flex items-center gap-2">
                            {/* In real app, render image here via next/image */}
                            <div className="w-6 h-6 rounded-full bg-primary/20" /> 
                            <span className="font-bold">{token.symbol}</span>
                        </div>
                    ) : (
                        <span className="font-bold text-sm">Select Token</span>
                    )}
                    <ChevronDown className="w-4 h-4 text-white/70" />
                </button>
            </div>
        </div>
    );
};
