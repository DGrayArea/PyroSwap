'use client';

import { Navbar } from '@/components/layout/Navbar';
import { SwapCard } from '@/components/feature/SwapCard';
import { PositionCard } from '@/components/feature/PositionCard';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'swap' | 'position'>('swap');

  return (
    <main className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <Navbar />

      {/* Hero / Light Effects */}
      <div className="fixed top-0 left-0 w-full h-[500px] pointer-events-none">
          <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full mix-blend-screen animate-pulse" style={{animationDuration: '4s'}} />
          <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-secondary/10 blur-[100px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-32 pb-20 relative z-10 flex flex-col items-center">
        
        {/* Tab Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 backdrop-blur-md border border-white/5">
          <button 
            onClick={() => setActiveTab('swap')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold font-display transition-all duration-300 ${activeTab === 'swap' ? 'bg-primary text-white shadow-lg shadow-primary/25' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Instant Swap
          </button>
          <button 
            onClick={() => setActiveTab('position')}
            className={`px-8 py-2.5 rounded-xl text-sm font-bold font-display transition-all duration-300 ${activeTab === 'position' ? 'bg-secondary text-black shadow-lg shadow-secondary/25' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
          >
            Limit Order
          </button>
        </div>

        {/* Dynamic Content */}
        <motion.div 
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="w-full flex justify-center"
        >
            {activeTab === 'swap' ? <SwapCard /> : <PositionCard />}
        </motion.div>

        {/* Marketing / Info */}
        <div className="mt-20 text-center max-w-2xl opacity-60 hover:opacity-100 transition-opacity">
            <h3 className="font-display font-bold text-2xl mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                Advanced Trading. Zero Compromise.
            </h3>
            <p className="text-white/60 leading-relaxed">
                Execute lightning-fast swaps powered by Jupiter or automate your strategy with on-chain Stop Loss & Take Profit orders that never sleep.
            </p>
        </div>

      </div>
    </main>
  );
}
