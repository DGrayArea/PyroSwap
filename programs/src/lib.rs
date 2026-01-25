use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod errors;
pub mod constants;
pub mod dex;
pub mod oracle;

use instructions::*;
use errors::*;

declare_id!("GC2uAgNLinafxsPP8KNBkM4HZcu1jTZUgGfgV7DUhjnt");

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
        preferred_dex: u8, // 0 = Raydium, 1 = Orca, 2 = Meteora
    ) -> Result<()> {
        instructions::open_position::handler(
            ctx,
            amount_in,
            sl_bps,
            tp_bps,
            entry_price,
            execution_fee,
            preferred_dex,
        )
    }

    pub fn execute_position(
        ctx: Context<ExecutePosition>,
        current_price: u64,
    ) -> Result<()> {
        instructions::execute_position::handler(ctx, current_price)
    }

    pub fn cancel_position(ctx: Context<CancelPosition>) -> Result<()> {
        instructions::cancel_position::handler(ctx)
    }

    pub fn withdraw_manual(ctx: Context<WithdrawManual>) -> Result<()> {
        instructions::withdraw_manual::handler(ctx)
    }

    pub fn swap(
        ctx: Context<Swap>,
        amount: u64,
        min_amount_out: u64,
        preferred_dex: u8,
    ) -> Result<()> {
        instructions::swap::handler(ctx, amount, min_amount_out, preferred_dex)
    }
}
