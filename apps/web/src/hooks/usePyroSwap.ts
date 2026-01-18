"use client";

import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { getProgram } from "@/lib/anchor";
import { PublicKey } from "@solana/web3.js";
import { useState, useCallback } from "react";

export function usePyroSwap() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [loading, setLoading] = useState(false);

  const getProgramInstance = useCallback(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: "confirmed",
    });
    return getProgram(provider);
  }, [connection, wallet]);

  const openPosition = async (
    amountIn: number,
    slBps: number,
    tpBps: number,
    inputMint: string,
    outputMint: string
  ) => {
    const program = getProgramInstance();
    if (!program || !wallet) return;

    setLoading(true);
    try {
      // Logic to find PDAs and build instruction
      // This is a placeholder for the actual Anchor call
      console.log("Opening position with", { amountIn, slBps, tpBps });
      
      // const tx = await program.methods.openPosition(
      //   new BN(amountIn),
      //   slBps,
      //   tpBps,
      //   new BN(0) // entry price from Pyth/Jupiter
      // ).accounts({
      //   position: ...,
      //   owner: wallet.publicKey,
      //   ...
      // }).rpc();
      
      return true;
    } catch (err) {
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    openPosition,
    loading,
    connected: !!wallet,
  };
}
