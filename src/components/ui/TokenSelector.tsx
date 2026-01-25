'use client';

import { FC, useState, useEffect, useCallback } from 'react';
import { X, Search, Trash2, Loader2, AlertCircle, Plus } from 'lucide-react';
import { Token } from '@/hooks/useJupiter';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenList, useTokenImport } from '@/hooks/useTokenList';

interface TokenSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  currentToken: Token | null;
}

// Quick select tokens
const QUICK_SELECT = ['SOL', 'USDC', 'USDT', 'JUP', 'BONK', 'WIF'];

export const TokenSelector: FC<TokenSelectorProps> = ({ isOpen, onClose, onSelect, currentToken }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  
  const { topTokens, customTokens, loading, searchTokens, addCustomToken, removeCustomToken, getToken } = useTokenList();
  const { fetchTokenInfo, loading: importing, error: importError, previewToken, clearPreview } = useTokenImport();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Check if input is a valid Solana address
  const isValidAddress = useCallback((input: string) => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(input.trim());
  }, []);

  // Auto-fetch token info when valid address is pasted
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (isValidAddress(trimmed)) {
      // Check if token already exists in our list
      const existing = getToken(trimmed);
      if (!existing) {
        fetchTokenInfo(trimmed);
      }
    } else {
      clearPreview();
    }
  }, [debouncedQuery, isValidAddress, getToken, fetchTokenInfo, clearPreview]);

  // Get display tokens
  const getDisplayTokens = useCallback(() => {
    if (debouncedQuery.trim()) {
      return searchTokens(debouncedQuery);
    }
    return topTokens;
  }, [debouncedQuery, searchTokens, topTokens]);

  const displayTokens = getDisplayTokens();

  const handleSelect = (token: Token) => {
    onSelect(token);
    onClose();
    setSearchQuery('');
    clearPreview();
  };

  const handleImport = () => {
    if (previewToken) {
      addCustomToken(previewToken);
      handleSelect(previewToken);
    }
  };

  const handleQuickSelect = (symbol: string) => {
    const token = topTokens.find(t => t.symbol === symbol);
    if (token) {
      handleSelect(token);
    }
  };

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      clearPreview();
    }
  }, [isOpen, clearPreview]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="relative w-full max-w-[420px] bg-[#131313] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
          style={{ maxHeight: 'min(600px, 85vh)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="font-semibold text-base">Select a token</h3>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          {/* Search Input */}
          <div className="p-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name or paste address"
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-white/30 outline-none focus:border-white/20 transition-colors text-sm"
                autoFocus
              />
              {importing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              )}
            </div>

            {/* Quick Select */}
            {!searchQuery && (
              <div className="flex flex-wrap gap-2 mt-3">
                {QUICK_SELECT.map(symbol => {
                  const token = topTokens.find(t => t.symbol === symbol);
                  if (!token) return null;
                  return (
                    <button
                      key={symbol}
                      onClick={() => handleQuickSelect(symbol)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors text-sm ${
                        currentToken?.symbol === symbol
                          ? 'bg-primary/20 border-primary/50 text-primary'
                          : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                      }`}
                    >
                      {token.logoURI && (
                        <img src={token.logoURI} alt={symbol} className="w-4 h-4 rounded-full" />
                      )}
                      <span className="font-medium">{symbol}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Import Preview - Shows when pasting an unknown address */}
          {previewToken && (
            <div className="mx-4 mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3">
                {previewToken.logoURI ? (
                  <img
                    src={previewToken.logoURI}
                    alt={previewToken.symbol}
                    className="w-10 h-10 rounded-full"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/80 to-orange-500 flex items-center justify-center font-bold text-sm">
                    {previewToken.symbol.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{previewToken.symbol}</div>
                  <div className="text-xs text-white/50 truncate">{previewToken.name}</div>
                </div>
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors text-sm flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Import
                </button>
              </div>
            </div>
          )}

          {/* Import Error */}
          {importError && isValidAddress(debouncedQuery) && !previewToken && (
            <div className="mx-4 mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{importError}</span>
            </div>
          )}

          {/* Imported Tokens */}
          {customTokens.length > 0 && !searchQuery && (
            <div className="px-4 pb-2">
              <div className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
                Imported
              </div>
              <div className="flex flex-wrap gap-2">
                {customTokens.slice(0, 6).map(token => (
                  <div
                    key={token.address}
                    className="flex items-center gap-1.5 pl-1.5 pr-1 py-1 bg-white/5 border border-white/10 rounded-full group"
                  >
                    <button
                      onClick={() => handleSelect(token)}
                      className="flex items-center gap-1.5"
                    >
                      {token.logoURI ? (
                        <img src={token.logoURI} alt={token.symbol} className="w-5 h-5 rounded-full" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/80 to-orange-500 flex items-center justify-center font-bold text-[8px]">
                          {token.symbol.slice(0, 2)}
                        </div>
                      )}
                      <span className="text-sm font-medium">{token.symbol}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeCustomToken(token.address);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-3 h-3 text-white/50 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Header */}
          <div className="px-4 py-2 text-xs font-medium text-white/40 uppercase tracking-wide border-t border-white/5 bg-white/[0.02]">
            {searchQuery ? `Results (${displayTokens.length})` : 'Popular Tokens'}
          </div>

          {/* Token List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
              </div>
            ) : displayTokens.length === 0 ? (
              <div className="text-center py-12 text-white/40 text-sm">
                {searchQuery ? 'No tokens found' : 'Loading tokens...'}
              </div>
            ) : (
              <div className="py-1">
                {displayTokens.map((token) => (
                  <button
                    key={token.address}
                    onClick={() => handleSelect(token)}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      currentToken?.address === token.address
                        ? 'bg-primary/10'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    {/* Token Icon */}
                    {token.logoURI ? (
                      <img
                        src={token.logoURI}
                        alt={token.symbol}
                        className="w-9 h-9 rounded-full bg-white/5"
                        onError={(e) => {
                          e.currentTarget.src = '';
                          e.currentTarget.className = 'hidden';
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/80 to-orange-500 flex items-center justify-center font-bold text-xs">
                        {token.symbol.slice(0, 2)}
                      </div>
                    )}
                    
                    {/* Token Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-sm">{token.symbol}</div>
                      <div className="text-xs text-white/40 truncate">{token.name}</div>
                    </div>

                    {/* Selected Indicator */}
                    {currentToken?.address === token.address && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-white/5 text-center">
            <p className="text-xs text-white/30">
              Showing {displayTokens.length} tokens from Jupiter
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
