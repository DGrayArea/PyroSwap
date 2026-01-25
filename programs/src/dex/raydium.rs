use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use crate::dex::{DexQuote, DexAdapter};
use crate::state::DexType;

/// Raydium AMM Program ID
pub const RAYDIUM_AMM_PROGRAM_ID: Pubkey = solana_program::pubkey!("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");

/// Raydium swap instruction discriminator
const SWAP_INSTRUCTION: u8 = 9;

pub struct RaydiumAdapter;

impl DexAdapter for RaydiumAdapter {
    fn get_quote(
        amount_in: u64,
        _input_decimals: u8,
        _output_decimals: u8,
    ) -> Result<DexQuote> {
        // In production, this would call Raydium's quote calculation
        // For now, we'll use a simplified version
        
        // Raydium typically has 0.25% fee
        let fee_bps = 25u16;
        let amount_after_fee = amount_in
            .checked_mul(10000 - fee_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        // Simplified quote - in production, calculate from pool reserves
        let amount_out = amount_after_fee;
        
        Ok(DexQuote {
            dex_type: DexType::Raydium,
            amount_out,
            price_impact_bps: 10, // 0.1% estimated impact
            fee_bps,
        })
    }

    fn swap<'info>(
        amount_in: u64,
        min_amount_out: u64,
        accounts: &[AccountInfo<'info>],
        signer_seeds: Option<&[&[&[u8]]]>,
    ) -> Result<u64> {
        // Raydium swap CPI
        // accounts expected:
        // 0. Token program
        // 1. AMM program
        // 2. AMM pool
        // 3. AMM authority
        // 4. AMM open orders
        // 5. AMM target orders
        // 6. Pool coin token account
        // 7. Pool pc token account
        // 8. Serum program
        // 9. Serum market
        // 10. Serum bids
        // 11. Serum asks
        // 12. Serum event queue
        // 13. Serum coin vault
        // 14. Serum pc vault
        // 15. Serum vault signer
        // 16. User source token account
        // 17. User destination token account
        // 18. User owner

        require!(accounts.len() >= 19, ErrorCode::InvalidAccountsLength);

        // Build Raydium swap instruction
        let mut instruction_data = Vec::with_capacity(17);
        instruction_data.push(SWAP_INSTRUCTION);
        instruction_data.extend_from_slice(&amount_in.to_le_bytes());
        instruction_data.extend_from_slice(&min_amount_out.to_le_bytes());

        let instruction = anchor_lang::solana_program::instruction::Instruction {
            program_id: RAYDIUM_AMM_PROGRAM_ID,
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

        // Return the output amount (would be read from account data in production)
        Ok(min_amount_out)
    }
}

/// Helper to get Raydium pool info
pub fn get_raydium_pool_info<'info>(
    pool_account: &AccountInfo<'info>,
) -> Result<(u64, u64)> {
    // In production, parse pool account data to get reserves
    // For now, return placeholder values
    Ok((1_000_000_000, 100_000_000))
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of accounts provided")]
    InvalidAccountsLength,
}
