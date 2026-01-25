import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PyroSwap } from "../../target/types/pyro_swap";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo } from "@solana/spl-token";
import { assert } from "chai";

describe("pyro-swap", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PyroSwap as Program<PyroSwap>;
  
  // Test accounts
  const admin = Keypair.generate();
  const feeDestination = Keypair.generate();
  let inputMint: PublicKey;
  let outputMint: PublicKey;
  
  // PDAs
  let configPda: PublicKey;
  let configBump: number;

  before(async () => {
    // Airdrop SOL to admin
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(admin.publicKey, 10 * anchor.web3.LAMPORTS_PER_SOL)
    );

    // Create Mints
    inputMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      9
    );
    
    outputMint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );

    // Find Config PDA
    [configPda, configBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("global_config")],
      program.programId
    );
  });

  it("Is initialized!", async () => {
    const protocolFeeBps = 50; // 0.5%
    const referralFeeShareBps = 5000; // 50%

    // Create fee destination token account (mock)
    // Actually config stores the fee destination WALLET/ATA depending on implementation
    // In state.rs: pub fee_destination: Pubkey (Protocol fee ATA or Wallet?)
    // Usually a wallet implementation is more flexible for SOL, but for tokens needs ATA
    // Let's check state.rs struct... it's just a Pubkey.
    
    await program.methods
      .initialize(protocolFeeBps, referralFeeShareBps)
      .accounts({
        admin: admin.publicKey,
        config: configPda,
        feeDestination: feeDestination.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const config = await program.account.globalConfig.fetch(configPda);
    
    assert.ok(config.admin.equals(admin.publicKey));
    assert.ok(config.feeDestination.equals(feeDestination.publicKey));
    assert.equal(config.protocolFeeBps, protocolFeeBps);
    assert.equal(config.referralFeeShareBps, referralFeeShareBps);
  });

  it("Updates config (if updated instruction exists)", async () => {
    // Add logic if update instruction exists
  });
});
