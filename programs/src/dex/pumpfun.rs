use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use crate::dex::{DexQuote, DexAdapter};
use crate::state::DexType;

/// Pump.fun Program ID
pub const PUMPFUN_PROGRAM_ID: Pubkey = solana_program::pubkey!("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

/// Pump.fun buy instruction discriminator
const BUY_INSTRUCTION: [u8; 8] = [0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea];

/// Pump.fun sell instruction discriminator
const SELL_INSTRUCTION: [u8; 8] = [0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad];

pub struct PumpFunAdapter;

impl DexAdapter for PumpFunAdapter {
    fn get_quote(
        amount_in: u64,
        _input_decimals: u8,
        _output_decimals: u8,
    ) -> Result<DexQuote> {
        // Pump.fun uses a bonding curve model
        // Fee is typically 1% on buys and sells
        let fee_bps = 100u16; // 1% fee
        
        let amount_after_fee = amount_in
            .checked_mul(10000 - fee_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        // Bonding curve provides different pricing
        // Price impact can be higher on smaller pools
        let amount_out = amount_after_fee;
        
        Ok(DexQuote {
            dex_type: DexType::PumpFun,
            amount_out,
            price_impact_bps: 50, // 0.5% estimated impact (higher for bonding curves)
            fee_bps,
        })
    }

    fn swap<'info>(
        amount_in: u64,
        min_amount_out: u64,
        accounts: &[AccountInfo<'info>],
        signer_seeds: Option<&[&[&[u8]]]>,
    ) -> Result<u64> {
        // Pump.fun swap CPI
        // accounts expected:
        // 0. Global state
        // 1. Fee recipient
        // 2. Mint
        // 3. Bonding curve
        // 4. Associated bonding curve
        // 5. User token account
        // 6. User SOL account
        // 7. System program
        // 8. Token program
        // 9. Rent
        // 10. Event authority
        // 11. Program

        require!(accounts.len() >= 12, ErrorCode::InvalidAccountsLength);

        // Determine if buying or selling based on account setup
        // For now, assume buying (SOL -> Token)
        let instruction_discriminator = BUY_INSTRUCTION;

        // Build Pump.fun instruction
        let mut instruction_data = Vec::with_capacity(25);
        instruction_data.extend_from_slice(&instruction_discriminator);
        instruction_data.extend_from_slice(&amount_in.to_le_bytes());
        instruction_data.extend_from_slice(&min_amount_out.to_le_bytes());

        let instruction = anchor_lang::solana_program::instruction::Instruction {
            program_id: PUMPFUN_PROGRAM_ID,
            accounts: accounts.iter().map(|a| {
                anchor_lang::solana_program::instruction::AccountMeta {
                    pubkey: *a.key,
                    is_signer: a.is_signer,
                    is_writable: a.is_writable,
                }
            }).collect(),
            data: instruction_data,
        };

        if let Some(seeds) = signer_seeds {
            anchor_lang::solana_program::program::invoke_signed(&instruction, accounts, seeds)?;
        } else {
            invoke(&instruction, accounts)?;
        }

        Ok(min_amount_out)
    }
}

/// Helper to get Pump.fun bonding curve info
pub fn get_pumpfun_curve_info<'info>(
    bonding_curve_account: &AccountInfo<'info>,
) -> Result<(u64, u64, u64)> {
    // In production, parse bonding curve account to get:
    // - virtual_token_reserves
    // - virtual_sol_reserves
    // - real_token_reserves
    // For now, return placeholder values
    Ok((1_000_000_000_000, 30_000_000_000, 800_000_000_000))
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of accounts provided")]
    InvalidAccountsLength,
}
