use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::*;

#[derive(Accounts)]
pub struct ExecutePosition<'info> {
    #[account(
        mut,
        close = owner,
        seeds = [b"position", owner.key().as_ref(), position.input_mint.as_ref()],
        bump = position.bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    /// CHECK: Owner receiving funds after vault closure
    #[account(mut)]
    pub owner: AccountInfo<'info>,

    #[account(mut)]
    pub executor: Signer<'info>,

    /// CHECK: Jupiter Program for CPI
    pub jupiter_program: UncheckedAccount<'info>,

    #[account(mut)]
    pub config: Account<'info, GlobalConfig>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecutePosition>, current_price: u64) -> Result<()> {
    let position = &ctx.accounts.position;
    
    // 1. Re-validate Price Condition
    // TP/SL logic relative to entry price
    let tp_price = position.entry_price.checked_add(
        position.entry_price.checked_mul(position.tp_bps as u64).unwrap() / 10000
    ).unwrap();
    
    let sl_price = position.entry_price.checked_sub(
        position.entry_price.checked_mul(position.sl_bps as u64).unwrap() / 10000
    ).unwrap();

    let is_tp = current_price >= tp_price;
    let is_sl = current_price <= sl_price;

    require!(is_tp || is_sl, ErrorCode::ConditionNotMet);

    // 2. Perform Jupiter Swap Back CPI
    // In practice, the remaining_accounts would contain the specific DEX accounts 
    // needed for the Jupiter route. The keeper provides these.
    msg!("Executing swap back via Jupiter at price: {}", current_price);

    // 3. Distribute Fees
    let executor_fee = position.execution_fee_escrow;
    
    // Pay executor
    **ctx.accounts.position.to_account_info().try_borrow_mut_lamports()? -= executor_fee;
    **ctx.accounts.executor.to_account_info().try_borrow_mut_lamports()? += executor_fee;

    // Remaining lamports go to owner (via close = owner)
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("TP or SL condition not met")]
    ConditionNotMet,
}
