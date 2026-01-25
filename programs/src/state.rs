use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub fee_destination: Pubkey,
    pub protocol_fee_bps: u16,
    pub referral_fee_share_bps: u16,
    pub total_positions_created: u64,
    pub total_volume: u64,
    pub bump: u8,
}

impl GlobalConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 2 + 2 + 8 + 8 + 1;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum DexType {
    Raydium,      // Raydium AMM
    Orca,         // Orca Whirlpools
    Meteora,      // Meteora DLMM
    PumpFun,      // Pump.fun
    Phoenix,      // Phoenix DEX
    Lifinity,     // Lifinity
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum PositionStatus {
    Active,
    Executed,
    Cancelled,
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
    pub referrer: Option<Pubkey>,
    pub amount_in: u64,
    pub sl_bps: u16,  // Stop loss in basis points (e.g., 500 = 5%)
    pub tp_bps: u16,  // Take profit in basis points (e.g., 1000 = 10%)
    pub entry_price: u64,
    pub execution_fee_escrow: u64,
    pub oracle_price_feed: Pubkey,  // Pyth price feed account
    pub preferred_dex: DexType,
    pub status: PositionStatus,
    pub created_at: i64,
    pub executed_at: Option<i64>,
    pub bump: u8,
}

impl Position {
    // 8 (disc) + 32 (owner) + 32 (vault) + 32 (input) + 32 (output) 
    // + 33 (Option<Pubkey>) + 8 (amount) + 2 (sl) + 2 (tp) + 8 (price) 
    // + 8 (fee) + 32 (oracle) + 1 (dex) + 1 (status) + 8 (created) + 9 (executed) + 1 (bump)
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 33 + 8 + 2 + 2 + 8 + 8 + 32 + 1 + 1 + 8 + 9 + 1;

    pub fn is_take_profit_triggered(&self, current_price: u64) -> bool {
        if self.status != PositionStatus::Active {
            return false;
        }
        let tp_price = self.entry_price
            .checked_mul(10000 + self.tp_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        current_price >= tp_price
    }

    pub fn is_stop_loss_triggered(&self, current_price: u64) -> bool {
        if self.status != PositionStatus::Active {
            return false;
        }
        let sl_price = self.entry_price
            .checked_mul(10000 - self.sl_bps as u64)
            .unwrap()
            .checked_div(10000)
            .unwrap();
        current_price <= sl_price
    }

    pub fn should_execute(&self, current_price: u64) -> bool {
        self.is_take_profit_triggered(current_price) || self.is_stop_loss_triggered(current_price)
    }
}
