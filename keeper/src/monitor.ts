import { Connection, PublicKey } from '@solana/web3.js';
import { Program } from '@coral-xyz/anchor';
import { PythConnection, getPythProgramKeyForCluster } from '@pythnetwork/client';
import { Executor } from './executor';
import bs58 from 'bs58';

export class PositionMonitor {
    private isRunning = false;
    private checkInterval: NodeJS.Timeout | null = null;
    private pythConnection: PythConnection;

    constructor(
        private program: Program,
        private connection: Connection,
        private executor: Executor
    ) {
        const pythKey = getPythProgramKeyForCluster('devnet');
        this.pythConnection = new PythConnection(connection, pythKey);
    }

    async start() {
        if (this.isRunning) return;
        this.isRunning = true;

        console.log('👀 Starting Position Monitor...');
        this.pythConnection.start();

        // Initial scan
        await this.scanPositions();

        // Polling loop
        this.checkInterval = setInterval(() => this.scanPositions(), 10000);
    }

    stop() {
        this.isRunning = false;
        this.pythConnection.stop();
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }
    }

    private async scanPositions() {
        try {
            console.log('Scanning for open positions...');
            
            // Filter: first byte of status is 0 (Active)
            // Position layout:
            // 8 (disc) + 32 (owner) + 32 (vault) + 32 (input) + 32 (output) 
            // + 33 (Option<Pubkey>) + 8 (amount) + 2 (sl) + 2 (tp) + 8 (price) 
            // + 8 (fee) + 32 (oracle) + 1 (dex) -> Status is at +230
            
            const positions = await this.program.account.position.all([
                {
                    memcmp: {
                        offset: 230, 
                        bytes: bs58.encode(Buffer.from([0])) // 0 = Active
                    }
                }
            ]);

            console.log(`📊 Found ${positions.length} active positions`);

            for (const pos of positions) {
                await this.checkPosition(pos);
            }

        } catch (err) {
            console.error('Error scanning positions:', err);
        }
    }

    private async checkPosition(position: any) {
        try {
            const account = position.account;
            const oracleAddress = account.oraclePriceFeed;
            
            // Get price from Pyth
            // In production, we'd use the streaming connection
            // For MVP, we'll fetch on demand for simplicity
            
            // Note: Pyth client logic varies by version. 
            // Simplified here: fetch account info and decode
            // Or use price service API
            
            // Placeholder: Assume we got the price
            // const currentPrice = await this.getOraclePrice(oracleAddress);
            
            // For dev/test, just log that we would check it
            console.log(`Checking Position ${position.publicKey.toString()}: Entry ${account.entryPrice.toString()}`);
            
            // Calculate thresholds on-chain logic replication
            // TP Price = Entry * (1 + TP%)
            // SL Price = Entry * (1 - SL%)
            
            // If condition met -> execute
            // await this.executor.execute(position.publicKey);

        } catch(e) {
            console.error(`Failed to check position ${position.publicKey}:`, e);
        }
    }
}
