'use client';

import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, Idl, BN } from '@coral-xyz/anchor';
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useMemo, useState, useCallback } from 'react';

// IDL - In production, import from generated file after `anchor build`
// For now, use the IDL from src/lib
import IDL from '@/lib/idl.json';

const PROGRAM_ID = new PublicKey('GC2uAgNLinafxsPP8KNBkM4HZcu1jTZUgGfgV7DUhjnt');

// Pyth Price Feeds (Devnet)
const PYTH_FEEDS: Record<string, string> = {
    'So11111111111111111111111111111111111111112': 'J83w4HKfqxwcq3BEMMkPFSppX3gqekLyLJBexebFVkix', // SOL/USD
    'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': '5SSkXsEKQepHHAewytPVwdej4epN1nxgLVM84L4KXgy7', // USDC/USD
};

export interface PositionAccount {
    owner: PublicKey;
    vault: PublicKey;
    inputMint: PublicKey;
    outputMint: PublicKey;
    referrer: PublicKey | null;
    amountIn: BN;
    slBps: number;
    tpBps: number;
    entryPrice: BN;
    executionFeeEscrow: BN;
    oraclePriceFeed: PublicKey;
    preferredDex: { raydium?: {} } | { orca?: {} } | { meteora?: {} };
    status: { active?: {} } | { executed?: {} } | { cancelled?: {} };
    createdAt: BN;
    executedAt: BN | null;
    bump: number;
}

export interface Position {
    publicKey: PublicKey;
    account: PositionAccount;
}

export const usePyroProgram = () => {
    const { connection } = useConnection();
    const wallet = useWallet();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const provider = useMemo(() => {
        if (!wallet.publicKey || !wallet.signTransaction) return null;
        return new AnchorProvider(connection, wallet as any, {
            preflightCommitment: 'confirmed',
        });
    }, [connection, wallet]);

    const program = useMemo(() => {
        if (!provider) return null;
        try {
            return new Program(IDL as Idl, PROGRAM_ID, provider);
        } catch (e) {
            console.error('Failed to initialize program:', e);
            return null;
        }
    }, [provider]);

    const openPosition = useCallback(async (
        inputMint: string,
        outputMint: string,
        amountIn: number,
        inputDecimals: number,
        slPercent: number,
        tpPercent: number,
        currentPrice: number,
        dexType: number = 0
    ): Promise<string> => {
        if (!program || !wallet.publicKey) {
            throw new Error('Wallet not connected');
        }
        
        setLoading(true);
        setError(null);

        try {
            const inputMintPubkey = new PublicKey(inputMint);
            const outputMintPubkey = new PublicKey(outputMint);
            
            // PDAs
            const [positionPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('position'), wallet.publicKey.toBuffer(), inputMintPubkey.toBuffer()],
                PROGRAM_ID
            );

            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault'), positionPda.toBuffer()],
                PROGRAM_ID
            );

            // Get user's Associated Token Account
            const userTokenAccount = await getAssociatedTokenAddress(
                inputMintPubkey,
                wallet.publicKey
            );

            // Convert to program units
            const amountBn = new BN(Math.floor(amountIn * (10 ** inputDecimals)));
            const slBps = Math.floor(slPercent * 100); // 5% = 500 bps
            const tpBps = Math.floor(tpPercent * 100); // 10% = 1000 bps
            const priceBn = new BN(Math.floor(currentPrice * (10 ** 6))); // 6 decimal price
            const executionFee = new BN(5_000_000); // 0.005 SOL

            // Get Pyth oracle feed for the input token
            const oracleFeed = new PublicKey(
                PYTH_FEEDS[inputMint] || PYTH_FEEDS['So11111111111111111111111111111111111111112']
            );

            const tx = await program.methods
                .openPosition(
                    amountBn,
                    slBps,
                    tpBps,
                    priceBn,
                    executionFee,
                    dexType
                )
                .accounts({
                    position: positionPda,
                    vault: vaultPda,
                    inputMint: inputMintPubkey,
                    outputMint: outputMintPubkey,
                    oraclePriceFeed: oracleFeed,
                    user: wallet.publicKey,
                    userInputToken: userTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                    rent: SYSVAR_RENT_PUBKEY,
                })
                .rpc();

            console.log('Position Created:', tx);
            return tx;

        } catch (err: any) {
            const message = err.message || 'Failed to open position';
            console.error('Failed to open position:', err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [program, wallet.publicKey]);

    const fetchPositions = useCallback(async (): Promise<Position[]> => {
        if (!program || !wallet.publicKey) return [];
        
        try {
            const positions = await program.account.position.all([
                {
                    memcmp: {
                        offset: 8, // After discriminator
                        bytes: wallet.publicKey.toBase58(),
                    },
                },
            ]);
            return positions as Position[];
        } catch (e) {
            console.error('Error fetching positions:', e);
            return [];
        }
    }, [program, wallet.publicKey]);

    const cancelPosition = useCallback(async (positionPubkey: PublicKey): Promise<string> => {
        if (!program || !wallet.publicKey) {
            throw new Error('Wallet not connected');
        }

        setLoading(true);
        setError(null);

        try {
            const position = await program.account.position.fetch(positionPubkey);
            
            const [vaultPda] = PublicKey.findProgramAddressSync(
                [Buffer.from('vault'), positionPubkey.toBuffer()],
                PROGRAM_ID
            );

            const ownerTokenAccount = await getAssociatedTokenAddress(
                position.inputMint as PublicKey,
                wallet.publicKey
            );

            const tx = await program.methods
                .cancelPosition()
                .accounts({
                    position: positionPubkey,
                    vault: vaultPda,
                    owner: wallet.publicKey,
                    ownerTokenAccount,
                    tokenProgram: TOKEN_PROGRAM_ID,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log('Position Cancelled:', tx);
            return tx;

        } catch (err: any) {
            const message = err.message || 'Failed to cancel position';
            console.error('Failed to cancel position:', err);
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [program, wallet.publicKey]);

    return {
        program,
        openPosition,
        fetchPositions,
        cancelPosition,
        loading,
        error,
        connected: !!wallet.publicKey && !!program,
    };
};
