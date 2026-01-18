"use client";

import React, { useState } from "react";
import { ArrowDown, Settings, Info, Flame } from "lucide-react";
import { motion } from "framer-motion";

export const SwapCard: React.FC = () => {
  const [amount, setAmount] = useState("");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");

  return (
    <div className="w-full max-w-[480px] mx-auto mt-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-[24px] p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
            Swap Tokens
          </h2>
          <div className="flex gap-2">
            <button className="p-2 text-slate-400 hover:text-slate-100 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* From Section */}
        <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 mb-2 hover:border-slate-700 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">You Pay</span>
            <span className="text-xs text-slate-500 font-medium text-right">Balance: 0.00</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-transparent border-none text-3xl font-bold text-slate-100 focus:outline-none w-full placeholder:text-slate-700"
            />
            <button className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors">
              <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold">SOL</span>
              </div>
              <span className="font-semibold text-sm">SOL</span>
            </button>
          </div>
        </div>

        {/* Swap Icon */}
        <div className="flex justify-center -my-3 relative z-10">
          <button className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-500/50 transition-all shadow-lg">
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        {/* To Section */}
        <div className="bg-slate-950/50 border border-slate-800/50 rounded-2xl p-4 mb-6 hover:border-slate-700 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-slate-500 font-medium">You Receive</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              placeholder="0.0"
              disabled
              className="bg-transparent border-none text-3xl font-bold text-slate-100 focus:outline-none w-full placeholder:text-slate-700"
            />
            <button className="bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl flex items-center gap-2 transition-colors">
              <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-sm">PYRO</span>
            </button>
          </div>
        </div>

        {/* Conditional Logic Section */}
        <div className="space-y-4 mb-6 pt-4 border-t border-slate-800/50">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-300">Conditional Swap</span>
              <Info className="w-3.5 h-3.5 text-slate-500" />
            </div>
            <div className="flex gap-2">
              <button className="text-[10px] bg-slate-800 px-2 py-0.5 rounded-md hover:bg-slate-700 transition-colors">Market</button>
              <button className="text-[10px] bg-orange-600/20 text-orange-400 px-2 py-0.5 rounded-md border border-orange-500/20">SL/TP</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Stop Loss (%)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="5.0"
                  value={sl}
                  onChange={(e) => setSl(e.target.value)}
                  className="bg-slate-950/50 border border-slate-800 w-full rounded-xl px-4 py-2 text-sm focus:border-red-500/50 transition-colors"
                />
                <span className="absolute right-3 top-2 text-slate-600 text-sm">%</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Take Profit (%)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="20.0"
                  value={tp}
                  onChange={(e) => setTp(e.target.value)}
                  className="bg-slate-950/50 border border-slate-800 w-full rounded-xl px-4 py-2 text-sm focus:border-green-500/50 transition-colors"
                />
                <span className="absolute right-3 top-2 text-slate-600 text-sm">%</span>
              </div>
            </div>
          </div>
        </div>

        <button className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-900/20 transition-all active:scale-[0.98]">
          Initiate PyroSwap
        </button>

        <div className="mt-4 flex justify-between text-[10px] text-slate-500 font-medium px-2">
          <span>Fee: 0.1%</span>
          <span>Slippage: 0.5%</span>
        </div>
      </motion.div>
    </div>
  );
};
