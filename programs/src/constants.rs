// Constants for the PyroSwap program

// Fee constraints
pub const MAX_PROTOCOL_FEE_BPS: u16 = 500; // 5% max
pub const MAX_REFERRAL_SHARE_BPS: u16 = 5000; // 50% of protocol fee max

// Position constraints
pub const MIN_EXECUTION_FEE: u64 = 5_000_000; // 0.005 SOL minimum
pub const MAX_STOP_LOSS_BPS: u16 = 5000; // 50% max stop loss
pub const MIN_TAKE_PROFIT_BPS: u16 = 100; // 1% min take profit
pub const MAX_TAKE_PROFIT_BPS: u16 = 10000; // 100% max take profit

// Oracle constraints
pub const MAX_PRICE_AGE_SLOTS: u64 = 25; // ~10 seconds on Solana
pub const MIN_PRICE_CONFIDENCE_BPS: u64 = 100; // 1% max confidence interval

// Slippage
pub const DEFAULT_SLIPPAGE_BPS: u16 = 50; // 0.5% default slippage tolerance
pub const MAX_SLIPPAGE_BPS: u16 = 1000; // 10% max slippage

// Seeds
pub const GLOBAL_CONFIG_SEED: &[u8] = b"global_config";
pub const POSITION_SEED: &[u8] = b"position";
pub const VAULT_SEED: &[u8] = b"vault";
