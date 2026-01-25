'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePyroProgram, Position } from '@/hooks/usePyroProgram';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

// Token symbol mapping
const TOKEN_SYMBOLS: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
};

const getTokenSymbol = (mint: string): string => {
  return TOKEN_SYMBOLS[mint] || mint.slice(0, 4) + '...';
};

const getPositionStatus = (status: any): string => {
  if (status.active) return 'Active';
  if (status.executed) return 'Executed';
  if (status.cancelled) return 'Cancelled';
  return 'Unknown';
};

export default function PositionsPage() {
  const { connected } = useWallet();
  const { fetchPositions, cancelPosition, loading } = usePyroProgram();
  
  const [positions, setPositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadPositions = useCallback(async () => {
    setLoadingPositions(true);
    try {
      const data = await fetchPositions();
      setPositions(data);
    } catch (e) {
      console.error('Failed to load positions:', e);
    } finally {
      setLoadingPositions(false);
    }
  }, [fetchPositions]);

  useEffect(() => {
    if (connected) {
      loadPositions();
    } else {
      setPositions([]);
    }
  }, [connected, loadPositions]);

  const handleCancel = async (positionPubkey: string) => {
    setCancellingId(positionPubkey);
    try {
      const { PublicKey } = await import('@solana/web3.js');
      await cancelPosition(new PublicKey(positionPubkey));
      await loadPositions(); // Refresh
    } catch (e) {
      console.error('Failed to cancel position:', e);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-semibold text-2xl md:text-3xl mb-2">My Positions</h1>
              <p className="text-white/50 text-sm">
                Monitor and manage your active limit orders
              </p>
            </div>
            {connected && (
              <button
                onClick={loadPositions}
                disabled={loadingPositions}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/50 hover:text-white"
              >
                <RefreshCw className={`w-5 h-5 ${loadingPositions ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          {!connected ? (
            <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Clock className="w-7 h-7 text-white/40" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect Your Wallet</h3>
              <p className="text-white/50 text-sm">
                Connect your wallet to view positions
              </p>
            </div>
          ) : loadingPositions && positions.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-4 text-white/40 animate-spin" />
              <p className="text-white/50 text-sm">Loading positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-white/40" />
              </div>
              <h3 className="font-semibold text-lg mb-2">No Active Positions</h3>
              <p className="text-white/50 text-sm mb-6">
                You don't have any active limit orders
              </p>
              <Link 
                href="/"
                className="inline-block px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors text-sm"
              >
                Create Position
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((position, index) => {
                const account = position.account;
                const fromToken = getTokenSymbol(account.inputMint.toString());
                const toToken = getTokenSymbol(account.outputMint.toString());
                const amount = account.amountIn.toNumber() / (10 ** 9); // Assuming SOL decimals
                const entryPrice = account.entryPrice.toNumber() / (10 ** 6);
                const tpPrice = entryPrice * (1 + account.tpBps / 10000);
                const slPrice = entryPrice * (1 - account.slBps / 10000);
                const status = getPositionStatus(account.status);
                const isActive = status === 'Active';
                const positionKey = position.publicKey.toString();

                return (
                  <motion.div
                    key={positionKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-[#1c1c1c] border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Position Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-secondary/10">
                            <TrendingUp className="w-5 h-5 text-secondary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">
                              {fromToken} → {toToken}
                            </h3>
                            <p className="text-sm text-white/40">TP/SL Order</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-white/40 mb-1">Amount</p>
                            <p className="font-medium text-sm">{amount.toFixed(4)} {fromToken}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-1">Entry</p>
                            <p className="font-medium text-sm">${entryPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-1">Take Profit</p>
                            <p className="font-medium text-sm text-green-400">${tpPrice.toFixed(2)} (+{account.tpBps / 100}%)</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-1">Stop Loss</p>
                            <p className="font-medium text-sm text-red-400">${slPrice.toFixed(2)} (-{account.slBps / 100}%)</p>
                          </div>
                          <div>
                            <p className="text-xs text-white/40 mb-1">Status</p>
                            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                              isActive 
                                ? 'bg-green-500/20 text-green-400'
                                : status === 'Executed'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-white/10 text-white/50'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      {isActive && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleCancel(positionKey)}
                            disabled={cancellingId === positionKey}
                            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 flex items-center gap-2"
                          >
                            {cancellingId === positionKey && <Loader2 className="w-4 h-4 animate-spin" />}
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
