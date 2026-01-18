use anchor_lang::prelude::*;

#[account]
pub struct GlobalConfig {
    pub admin: Pubkey,
    pub fee_destination: Pubkey, // Protocol fee ATA
    pub protocol_fee_bps: u16,
    pub referral_fee_share_bps: u16,
    pub bump: u8,
}

impl GlobalConfig {
    pub const SIZE: usize = 8 + 32 + 32 + 2 + 2 + 1;
}

#[account]
pub struct Position {
    pub owner: Pubkey,
    pub vault: Pubkey,
    pub input_mint: Pubkey,
    pub output_mint: Pubkey,
    pub referrer: Option<Pubkey>,
    pub amount_in: u64,
    pub sl_bps: u16,
    pub tp_bps: u16,
    pub entry_price: u64,
    pub execution_fee_escrow: u64,
    pub bump: u8,
}

impl Position {
    // 8 (disc) + 32 (owner) + 32 (vault) + 32 (input) + 32 (output) 
    // + 33 (Option<Pubkey>) + 8 (amount) + 2 (sl) + 2 (tp) + 8 (price) + 8 (fee) + 1 (bump)
    pub const SIZE: usize = 8 + 32 + 32 + 32 + 32 + 33 + 8 + 2 + 2 + 8 + 8 + 1;
}
