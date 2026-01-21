'use client';

import { FC } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Flame } from 'lucide-react';
import Link from 'next/link';

export const Navbar: FC = () => {
  return (
    <nav className="fixed top-0 w-full z-50 glass-panel border-b-0 border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Flame className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <span className="font-display font-bold text-2xl tracking-tight">
            Pyro<span className="text-primary">Swap</span>
          </span>
        </Link>

        {/* Navigation Links (Center) */}
        <div className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Swap</Link>
            <Link href="/positions" className="text-sm font-medium text-white/70 hover:text-white transition-colors">My Positions</Link>
            <Link href="/referrals" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Referrals</Link>
        </div>

        {/* Wallet Connection */}
        <div className="flex items-center gap-4">
             {/* Custom styling for wallet button provided by adapter-ui via variables or override */}
             <WalletMultiButton style={{
                 backgroundColor: 'rgba(255, 69, 0, 0.1)',
                 color: '#ff4500',
                 border: '1px solid rgba(255, 69, 0, 0.2)',
                 fontFamily: 'var(--font-outfit)',
                 fontWeight: '600',
                 borderRadius: '0.75rem',
                 height: '42px'
             }} />
        </div>
      </div>
    </nav>
  );
};
