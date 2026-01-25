'use client';
import { FC, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Token } from '@/hooks/useJupiter';
import { TokenSelector } from './TokenSelector';

interface TokenInputProps {
    label: string;
    amount: string;
    setAmount: (val: string) => void;
    token: Token | null;
    setToken: (t: Token) => void;
    balance?: number;
    disabled?: boolean;
}

// Token icon component with fallback
const TokenIcon: FC<{ token: Token; size?: 'sm' | 'md' }> = ({ token, size = 'md' }) => {
    const [imgError, setImgError] = useState(false);
    const dimensions = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
    const textSize = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

    if (token.logoURI && !imgError) {
        return (
            <img 
                src={token.logoURI} 
                alt={token.symbol} 
                className={`${dimensions} rounded-full bg-white/10`}
                onError={() => setImgError(true)}
            />
        );
    }

    return (
        <div className={`${dimensions} rounded-full bg-gradient-to-br from-primary to-orange-500 flex items-center justify-center font-bold ${textSize}`}>
            {token.symbol.slice(0, 2)}
        </div>
    );
};

export const TokenInput: FC<TokenInputProps> = ({ 
    label, amount, setAmount, token, setToken, balance, disabled 
}) => {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);

    return (
        <>
            <div className="bg-[#0a0a0a] rounded-xl p-4">
                <div className="flex justify-between mb-2">
                    <span className="text-sm text-white/50">{label}</span>
                    {balance !== undefined && (
                        <button 
                            onClick={() => !disabled && setAmount(balance.toString())}
                            className="text-sm text-white/50 hover:text-white transition-colors"
                        >
                            Balance: {balance.toFixed(4)}
                        </button>
                    )}
                </div>
                
                <div className="flex items-center gap-3">
                    <input 
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                setAmount(val);
                            }
                        }}
                        placeholder="0"
                        disabled={disabled}
                        className={`flex-1 bg-transparent text-2xl font-medium placeholder-white/20 outline-none min-w-0 ${
                            disabled ? 'text-white/70' : 'text-white'
                        }`}
                    />
                    
                    <button 
                        onClick={() => setIsSelectorOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors shrink-0 ${
                            token 
                                ? 'bg-[#1a1a1a] hover:bg-[#252525]' 
                                : 'bg-primary hover:bg-primary/90 text-white'
                        }`}
                    >
                        {token ? (
                            <>
                                <TokenIcon token={token} />
                                <span className="font-semibold">{token.symbol}</span>
                            </>
                        ) : (
                            <span className="font-semibold text-sm px-1">Select token</span>
                        )}
                        <ChevronDown className="w-4 h-4 text-white/60" />
                    </button>
                </div>
            </div>

            <TokenSelector
                isOpen={isSelectorOpen}
                onClose={() => setIsSelectorOpen(false)}
                onSelect={setToken}
                currentToken={token}
            />
        </>
    );
};
