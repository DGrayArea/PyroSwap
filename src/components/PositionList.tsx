"use client";

import React from "react";
import { ExternalLink, Trash2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export const PositionList: React.FC = () => {
  // Mock positions
  const positions = [
    {
      id: "1",
      input: "SOL",
      output: "PYRO",
      amount: "10.0",
      sl: "5%",
      tp: "20%",
      status: "Active",
      entry: "$95.20",
      current: "$98.50",
    },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto mt-12 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          Active Positions
          <span className="bg-orange-500/10 text-orange-500 text-[10px] px-2 py-0.5 rounded-full border border-orange-500/20">
            {positions.length}
          </span>
        </h2>
      </div>

      <div className="space-y-4">
        {positions.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <p className="text-slate-500 italic">No active positions found.</p>
          </div>
        ) : (
          positions.map((pos) => (
            <motion.div
              key={pos.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-all group"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 bg-slate-800 rounded-full border-2 border-slate-900 flex items-center justify-center text-xs font-bold">SOL</div>
                    <div className="w-10 h-10 bg-orange-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{pos.amount} {pos.input}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      <span className="font-bold text-lg text-orange-500">{pos.output}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-medium">
                      Entry: {pos.entry} • Current: <span className="text-green-400">{pos.current}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stop Loss</span>
                      <span className="text-sm font-bold text-red-500">{pos.sl}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Take Profit</span>
                      <span className="text-sm font-bold text-green-500">{pos.tp}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
