use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use crate::dex::{DexQuote, DexAdapter};
use crate::state::DexType;

/// Orca Whirlpool Program ID
pub const ORCA_WHIRLPOOL_PROGRAM_ID: Pubkey = solana_program::pubkey!("whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc");

/// Orca swap instruction discriminator
const SWAP_INSTRUCTION: [u8; 8] = [0xf8, 0xc6, 0x9e, 0x91, 0xe1, 0x75, 0x87, 0xc8];

pub struct OrcaAdapter;

impl DexAdapter for OrcaAdapter {
    fn get_quote(
        amount_in: u64,
        _input_decimals: u8,
        _output_decimals: u8,
    ) -> Result<DexQuote> {
        // Orca Whirlpools have dynamic fees based on tier
        // Common tiers: 0.01%, 0.05%, 0.3%, 1%
        let fee_bps = 30u16; // 0.3% for standard pools
        
        let amount_after_fee = amount_in
            .checked_mul(10000 - fee_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        
        // Simplified quote - in production, use Whirlpool's sqrt price
        let amount_out = amount_after_fee;
        
        Ok(DexQuote {
            dex_type: DexType::Orca,
            amount_out,
            price_impact_bps: 8, // 0.08% estimated impact
            fee_bps,
        })
    }

    fn swap<'info>(
        amount_in: u64,
        min_amount_out: u64,
        accounts: &[AccountInfo<'info>],
        signer_seeds: Option<&[&[&[u8]]]>,
    ) -> Result<u64> {
        // Orca Whirlpool swap CPI
        // accounts expected:
        // 0. Token program
        // 1. Whirlpool program
        // 2. Whirlpool
        // 3. Token authority
        // 4. Token vault A
        // 5. Token vault B
        // 6. Tick array 0
        // 7. Tick array 1
        // 8. Tick array 2
        // 9. Oracle
        // 10. User token account A
        // 11. User token account B
        // 12. User authority

        require!(accounts.len() >= 13, ErrorCode::InvalidAccountsLength);

        // Build Orca swap instruction
        let mut instruction_data = Vec::with_capacity(25);
        instruction_data.extend_from_slice(&SWAP_INSTRUCTION);
        instruction_data.extend_from_slice(&amount_in.to_le_bytes());
        instruction_data.extend_from_slice(&min_amount_out.to_le_bytes());
        instruction_data.extend_from_slice(&[1u8]); // a_to_b direction
        instruction_data.extend_from_slice(&[0u8; 8]); // sqrt_price_limit (0 = no limit)

        let instruction = anchor_lang::solana_program::instruction::Instruction {
            program_id: ORCA_WHIRLPOOL_PROGRAM_ID,
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

/// Helper to get Orca Whirlpool info
pub fn get_orca_whirlpool_info<'info>(
    whirlpool_account: &AccountInfo<'info>,
) -> Result<(u128, u16)> {
    // In production, parse whirlpool account to get sqrt_price and fee_rate
    // For now, return placeholder values
    Ok((79228162514264337593543950336u128, 30)) // sqrt_price, fee_bps
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid number of accounts provided")]
    InvalidAccountsLength,
}
