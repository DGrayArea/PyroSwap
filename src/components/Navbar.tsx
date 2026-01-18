"use client";

import React from "react";
import Link from "next/link";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Flame } from "lucide-react";

export const Navbar: React.FC = () => {
  return (
    <nav className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                <Flame className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-100 italic">
                PYRO<span className="text-orange-500">SWAP</span>
              </span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-8">
              <Link href="/swap" className="text-slate-400 hover:text-slate-100 transition-colors font-medium">
                Swap
              </Link>
              <Link href="/positions" className="text-slate-400 hover:text-slate-100 transition-colors font-medium">
                Positions
              </Link>
              <Link href="/admin" className="text-slate-400 hover:text-slate-100 transition-colors font-medium text-xs self-center">
                Admin
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <WalletMultiButton className="!bg-orange-600 hover:!bg-orange-700 !transition-all !rounded-xl !h-10 !px-4 !text-sm !font-semibold" />
          </div>
        </div>
      </div>
    </nav>
  );
};
