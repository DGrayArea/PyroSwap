use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;

use instructions::*;

declare_id!("6R9gN2L5pM6K7d9X7vFv2o8sXp7Z9q4E1X6y8rA5bC3D"); // Placeholder ID

#[program]
pub mod pyro_swap {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        protocol_fee_bps: u16,
        referral_fee_share_bps: u16,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, protocol_fee_bps, referral_fee_share_bps)
    }

    pub fn open_position(
        ctx: Context<OpenPosition>,
        amount_in: u64,
        sl_bps: u16,
        tp_bps: u16,
        entry_price: u64,
        execution_fee: u64,
    ) -> Result<()> {
        instructions::open_position::handler(ctx, amount_in, sl_bps, tp_bps, entry_price, execution_fee)
    }

    pub fn execute_position(ctx: Context<ExecutePosition>, current_price: u64, data: Vec<u8>) -> Result<()> {
        instructions::execute_position::handler(ctx, current_price, data)
    }

    pub fn withdraw_manual(ctx: Context<WithdrawManual>) -> Result<()> {
        instructions::withdraw_manual::handler(ctx)
    }

    pub fn swap(ctx: Context<Swap>, amount: u64, min_amount_out: u64, referral_fee_bps: u16) -> Result<()> {
        instructions::swap::handler(ctx, amount, min_amount_out, referral_fee_bps)
    }
}
