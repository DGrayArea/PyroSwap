// DEX integration modules
pub mod raydium;
pub mod orca;
pub mod meteora;
pub mod pumpfun;

pub use raydium::*;
pub use orca::*;
pub use meteora::*;
pub use pumpfun::*;

use anchor_lang::prelude::*;
use crate::state::DexType;

/// Result of a DEX quote
#[derive(Debug, Clone)]
pub struct DexQuote {
    pub dex_type: DexType,
    pub amount_out: u64,
    pub price_impact_bps: u16,
    pub fee_bps: u16,
}

/// Trait for DEX integrations
pub trait DexAdapter {
    /// Get a quote for swapping tokens
    fn get_quote(
        amount_in: u64,
        input_decimals: u8,
        output_decimals: u8,
    ) -> Result<DexQuote>;

    /// Execute a swap
    fn swap<'info>(
        amount_in: u64,
        min_amount_out: u64,
        accounts: &[AccountInfo<'info>],
        signer_seeds: Option<&[&[&[u8]]]>,
    ) -> Result<u64>;
}

/// Find the best quote across all DEXes
pub fn get_best_quote(quotes: Vec<DexQuote>) -> Option<DexQuote> {
    quotes.into_iter()
        .max_by_key(|q| q.amount_out)
}

/// Calculate price impact in basis points
pub fn calculate_price_impact(
    amount_in: u64,
    amount_out: u64,
    expected_out: u64,
) -> u16 {
    if expected_out == 0 {
        return 10000; // 100% impact
    }
    
    let diff = if amount_out < expected_out {
        expected_out - amount_out
    } else {
        0
    };
    
    ((diff as u128 * 10000) / expected_out as u128) as u16
}
