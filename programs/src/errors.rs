use anchor_lang::prelude::*;

#[error_code]
pub enum PyroSwapError {
    #[msg("Invalid basis points value (must be <= 10000)")]
    InvalidBasisPoints,
    
    #[msg("Stop loss percentage too high (max 50%)")]
    StopLossTooHigh,
    
    #[msg("Take profit percentage too low (min 1%)")]
    TakeProfitTooLow,
    
    #[msg("Execution fee too low")]
    ExecutionFeeTooLow,
    
    #[msg("Position not ready for execution")]
    PositionNotTriggered,
    
    #[msg("Position already executed")]
    PositionAlreadyExecuted,
    
    #[msg("Position already cancelled")]
    PositionAlreadyCancelled,
    
    #[msg("Oracle price is stale")]
    StalePriceData,
    
    #[msg("Oracle price confidence too low")]
    LowPriceConfidence,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageExceeded,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Invalid DEX type")]
    InvalidDexType,
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Invalid oracle account")]
    InvalidOracleAccount,
    #[msg("Invalid oracle price")]
    InvalidOraclePrice,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Math overflow")]
    MathOverflow,
}
