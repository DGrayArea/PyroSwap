'use client';

import { Navbar } from '@/components/layout/Navbar';
import { SwapCard } from '@/components/feature/SwapCard';
import { PositionCard } from '@/components/feature/PositionCard';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'position'>('swap');

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Subtle Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[300px] bg-secondary/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-20 flex flex-col items-center">
        
        {/* Tab Switcher */}
        <div className="flex bg-[#1a1a1a] p-1 rounded-xl mb-8 border border-white/5">
          <button 
            onClick={() => setActiveTab('swap')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'swap' 
                ? 'bg-primary text-white' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            Swap
          </button>
          <button 
            onClick={() => setActiveTab('position')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === 'position' 
                ? 'bg-secondary text-black' 
                : 'text-white/50 hover:text-white'
            }`}
          >
            Limit Order
          </button>
        </div>

        {/* Dynamic Content */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="w-full flex justify-center"
          >
            {activeTab === 'swap' ? <SwapCard /> : <PositionCard />}
          </motion.div>
        </AnimatePresence>

        {/* Info Section */}
        <div className="mt-16 text-center max-w-lg">
          <p className="text-white/40 text-sm">
            Trade instantly with Jupiter aggregation or set automated limit orders with on-chain execution.
          </p>
        </div>
      </div>
    </main>
  );
}
