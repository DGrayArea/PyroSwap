import { Connection, PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, Wallet, Idl } from '@coral-xyz/anchor';
import { Keypair } from '@solana/web3.js';
import * as dotenv from 'dotenv';
import bs58 from 'bs58';
import { PositionMonitor } from './monitor';
import { Executor } from './executor';

dotenv.config();

// Program ID from our lib.rs
const PROGRAM_ID = new PublicKey('GC2uAgNLinafxsPP8KNBkM4HZcu1jTZUgGfgV7DUhjnt');

async function main() {
    console.log('🔥 PyroSwap Keeper Node Starting...');

    // 1. Setup Connection & Wallet
    const rpcUrl = process.env.RPC_URL || 'https://api.devnet.solana.com';
    const connection = new Connection(rpcUrl, 'confirmed');
    
    const privateKey = process.env.KEEPER_PRIVATE_KEY;
    if (!privateKey) {
        console.error('❌ KEEPER_PRIVATE_KEY not found in .env');
        process.exit(1);
    }
    
    // Support both base58 and byte array formats
    let secretKey: Uint8Array;
    try {
        if (privateKey.includes('[')) {
            secretKey = Uint8Array.from(JSON.parse(privateKey));
        } else {
            secretKey = bs58.decode(privateKey);
        }
    } catch (e) {
        console.error('❌ Invalid private key format');
        process.exit(1);
    }

    const wallet = new Wallet(Keypair.fromSecretKey(secretKey));
    const provider = new AnchorProvider(connection, wallet, {
        commitment: 'confirmed',
    });

    console.log(`🤖 Keeper Wallet: ${wallet.publicKey.toString()}`);
    console.log(`🌐 Cluster: ${rpcUrl}`);

    // 2. Load IDL (In production, import from file/package)
    // For now, we'll fetch from chain or use a minimal IDL
    let idl: Idl;
    try {
        idl = await Program.fetchIdl(PROGRAM_ID, provider) as Idl;
        if (!idl) throw new Error('IDL not found');
    } catch (e) {
        console.error('❌ Failed to load IDL. Ensure program is deployed and initialized.');
        // Fallback or exit
        // In local dev, you might want to load from target/adl/pyro_swap.json
        console.log('⚠️  Trying to proceed with minimal IDL...');
        idl = require('../../target/idl/pyro_swap.json');
    }

    const program = new Program(idl, PROGRAM_ID, provider);

    // 3. Initialize Components
    const executor = new Executor(program, wallet);
    const monitor = new PositionMonitor(program, connection, executor);

    // 4. Start Monitoring
    await monitor.start();

    // Keep process alive
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping Keeper...');
        monitor.stop();
        process.exit();
    });
}

main().catch(console.error);
