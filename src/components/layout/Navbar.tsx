'use client';

import { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PyroFlameIcon } from '@/components/ui/PyroFlameIcon';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const Navbar: FC = () => {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full z-[100] bg-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        {/* Logo Area */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="group-hover:scale-110 transition-transform duration-300">
            <PyroFlameIcon className="w-8 h-8" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight">
            Pyro<span className="text-primary">Swap</span>
          </span>
        </Link>

        {/* Navigation Links (Center) */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 rounded-xl p-1">
          <Link 
            href="/" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/') 
                ? 'bg-white/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Swap
          </Link>
          <Link 
            href="/positions" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/positions') 
                ? 'bg-white/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Positions
          </Link>
          <Link 
            href="/referrals" 
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isActive('/referrals') 
                ? 'bg-white/10 text-white' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            Referrals
          </Link>
        </div>

        {/* Wallet Button */}
        <WalletMultiButton />
      </div>
    </nav>
  );
};
