use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use crate::dex::{DexQuote, DexAdapter};
use crate::state::DexType;

/// Meteora DLMM Program ID
pub const METEORA_DLMM_PROGRAM_ID: Pubkey = solana_program::pubkey!("LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo");

/// Meteora swap instruction discriminator
const SWAP_INSTRUCTION: [u8; 8] = [0x14, 0x8e, 0x41, 0x5c, 0x7b, 0x8c, 0x3a, 0x9f];

pub struct MeteoraAdapter;

impl DexAdapter for MeteoraAdapter {
    fn get_quote(
        amount_in: u64,
        _input_decimals: u8,
        _output_decimals: u8,
    ) -> Result<DexQuote> {
        // Meteora DLMM (Dynamic Liquidity Market Maker) has dynamic fees
        // Base fee is typically 0.1-0.3%
        let fee_bps = 20u16; // 0.2% base fee
        
        let amount_after_fee = amount_in
            .checked_mul(10000 - fee_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        // DLMM provides better prices due to concentrated liquidity
        let amount_out = amount_after_fee;
        
        Ok(DexQuote {
            dex_type: DexType::Meteora,
            amount_out,
            price_impact_bps: 5, // 0.05% estimated impact (better than AMM)
            fee_bps,
        })
    }

    fn swap<'info>(
        amount_in: u64,
        min_amount_out: u64,
        accounts: &[AccountInfo<'info>],
        signer_seeds: Option<&[&[&[u8]]]>,
    ) -> Result<u64> {
        // Meteora DLMM swap CPI
        // accounts expected:
        // 0. LB pair
        // 1. Bin array bitmap extension (optional)
        // 2. Reserve X
        // 3. Reserve Y
        // 4. User token in
        // 5. User token out
        // 6. Token X mint
        // 7. Token Y mint
        // 8. Oracle
        // 9. Host fee account (optional)
        // 10. User
        // 11. Token X program
        // 12. Token Y program
        // 13. Event authority
        // 14. Program

        require!(accounts.len() >= 15, ErrorCode::InvalidAccountsLength);

        // Build Meteora swap instruction
        let mut instruction_data = Vec::with_capacity(17);
        instruction_data.extend_from_slice(&SWAP_INSTRUCTION);
        instruction_data.extend_from_slice(&amount_in.to_le_bytes());
        instruction_data.extend_from_slice(&min_amount_out.to_le_bytes());

        let instruction = anchor_lang::solana_program::instruction::Instruction {
            program_id: METEORA_DLMM_PROGRAM_ID,
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

/// Helper to get Meteora DLMM pool info
pub fn get_meteora_pool_info<'info>(
    lb_pair_account: &AccountInfo<'info>,
) -> Result<(u32, u16)> {
    // In production, parse LB pair account to get active_id and base_fee_bps
    // For now, return placeholder values
    Ok((8388608u32, 20)) // active_id (price bin), fee_bps
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of accounts provided")]
    InvalidAccountsLength,
}
