'use client';

import { Navbar } from '@/components/layout/Navbar';
import { useWallet } from '@solana/wallet-adapter-react';
import { motion } from 'framer-motion';
import { Copy, Users, TrendingUp, Gift, Check } from 'lucide-react';
import { useState } from 'react';

export default function ReferralsPage() {
  const { publicKey, connected } = useWallet();
  const [copied, setCopied] = useState(false);

  const referralCode = publicKey ? `PYRO${publicKey.toString().slice(0, 6).toUpperCase()}` : 'PYROXXXXXX';
  const referralLink = `https://pyroswap.io?ref=${referralCode}`;
  
  const stats = {
    totalReferrals: 12,
    activeReferrals: 8,
    totalEarned: 45.67,
    pendingRewards: 12.34,
  };

  const recentReferrals = [
    { id: 1, wallet: '7xKX...9mPq', volume: 1250.5, earned: 6.25, date: '2026-01-24' },
    { id: 2, wallet: '4nQw...2kLp', volume: 890.2, earned: 4.45, date: '2026-01-23' },
    { id: 3, wallet: '9pRt...5vNm', volume: 2100.8, earned: 10.50, date: '2026-01-22' },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Subtle Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-secondary/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 pt-24 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="font-semibold text-2xl md:text-3xl mb-2">Referrals</h1>
          <p className="text-white/50 text-sm mb-8">
            Earn rewards by inviting friends to PyroSwap
          </p>

          {!connected ? (
            <div className="bg-[#1c1c1c] border border-white/10 rounded-2xl p-12 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Users className="w-7 h-7 text-white/40" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Connect Your Wallet</h3>
              <p className="text-white/50 text-sm">
                Connect your wallet to access referrals
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Referral Link Card */}
              <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-5">
                <h2 className="font-semibold text-base mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-primary" />
                  Your Referral Link
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 bg-[#0f0f0f] border border-white/10 rounded-lg px-4 py-2.5 text-white/70 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopy}
                    className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 text-sm"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-3">
                  Earn 0.5% of your referrals' trading fees
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-500/10 rounded-lg">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-xs text-white/50">Total</p>
                  </div>
                  <p className="font-semibold text-2xl">{stats.totalReferrals}</p>
                </div>

                <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-500/10 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-xs text-white/50">Active</p>
                  </div>
                  <p className="font-semibold text-2xl">{stats.activeReferrals}</p>
                </div>

                <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                      <Gift className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-xs text-white/50">Earned</p>
                  </div>
                  <p className="font-semibold text-2xl">${stats.totalEarned}</p>
                </div>

                <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-secondary/10 rounded-lg">
                      <TrendingUp className="w-4 h-4 text-secondary" />
                    </div>
                    <p className="text-xs text-white/50">Pending</p>
                  </div>
                  <p className="font-semibold text-2xl">${stats.pendingRewards}</p>
                </div>
              </div>

              {/* Recent Referrals */}
              <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-5">
                <h2 className="font-semibold text-base mb-4">Recent Activity</h2>
                <div className="space-y-2">
                  {recentReferrals.map((referral, index) => (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center font-semibold text-xs">
                          {referral.wallet.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-mono font-medium text-sm">{referral.wallet}</p>
                          <p className="text-xs text-white/40">{referral.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400 text-sm">+${referral.earned}</p>
                        <p className="text-xs text-white/40">${referral.volume} vol</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-[#1c1c1c] border border-white/10 rounded-xl p-5">
                <h2 className="font-semibold text-base mb-4">How It Works</h2>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1">Share Your Link</h3>
                      <p className="text-xs text-white/50">
                        Share your unique referral link with friends
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1">They Trade</h3>
                      <p className="text-xs text-white/50">
                        Referrals make swaps and limit orders
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-sm text-primary flex-shrink-0">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium text-sm mb-1">Earn Rewards</h3>
                      <p className="text-xs text-white/50">
                        Get 0.5% of their fees to your wallet
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </main>
  );
}
