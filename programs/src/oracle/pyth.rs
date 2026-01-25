use anchor_lang::prelude::*;
use pyth_sdk_solana::load_price_feed_from_account_info;
use crate::errors::PyroSwapError;
use crate::constants::{MAX_PRICE_AGE_SLOTS, MIN_PRICE_CONFIDENCE_BPS};

pub struct OraclePrice {
    pub price: u64,
    pub exponent: i32,
    pub confidence: u64,
    pub publish_time: i64,
}

pub fn get_pyth_price<'info>(
    oracle_account: &AccountInfo<'info>,
    current_slot: u64,
    current_time: i64,
) -> Result<OraclePrice> {
    let feed = load_price_feed_from_account_info(oracle_account)
        .map_err(|_| PyroSwapError::InvalidOracleAccount)?;

    // Get price no older than MAX_PRICE_AGE_SLOTS
    // Note: Pyth SDK uses seconds for age check, but we can verify slot/time manually for stricter control
    let price_data = feed.get_price_no_older_than(current_time, MAX_PRICE_AGE_SLOTS)
        .ok_or(PyroSwapError::StalePriceData)?;

    // Basic validation
    if price_data.price <= 0 {
        return Err(PyroSwapError::InvalidOraclePrice.into());
    }

    // Check confidence interval (if confidence is > 1% of price, it might be too volatile/uncertain)
    // confidence_bps = (confidence * 10000) / price
    let confidence_bps = (price_data.conf as u128 * 10000) / price_data.price as u128;
    if confidence_bps > MIN_PRICE_CONFIDENCE_BPS as u128 {
        return Err(PyroSwapError::LowPriceConfidence.into());
    }

    Ok(OraclePrice {
        price: price_data.price as u64,
        exponent: price_data.expo,
        confidence: price_data.conf,
        publish_time: price_data.publish_time,
    })
}

/// Verify if the execution price is within acceptable range of the oracle price
pub fn validate_execution_price(
    execution_price: u64,
    oracle_price: u64,
    max_slippage_bps: u16,
) -> Result<()> {
    // Calculate allowed range
    // min_allowed = oracle_price * (1 - slippage)
    // max_allowed = oracle_price * (1 + slippage)
    
    let slippage_amount = (oracle_price as u128 * max_slippage_bps as u128 / 10000) as u64;
    let min_allowed = oracle_price.saturating_sub(slippage_amount);
    let max_allowed = oracle_price.saturating_add(slippage_amount);

    if execution_price < min_allowed || execution_price > max_allowed {
        return Err(PyroSwapError::SlippageExceeded.into());
    }

    Ok(())
}
