use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use crate::state::*;

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(
        init,
        payer = user,
        space = Position::SIZE,
        seeds = [b"position", user.key().as_ref(), input_mint.key().as_ref()],
        bump
    )]
    pub position: Account<'info, Position>,

    #[account(
        init,
        payer = user,
        token::mint = output_mint,
        token::authority = vault,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub input_mint: Account<'info, Mint>,
    pub output_mint: Account<'info, Mint>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_input_token: Account<'info, TokenAccount>,
    
    /// CHECK: Jupiter Program
    pub jupiter_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn handler(
    ctx: Context<OpenPosition>,
    amount_in: u64,
    sl_bps: u16,
    tp_bps: u16,
    entry_price: u64,
) -> Result<()> {
    let position = &mut ctx.accounts.position;
    position.owner = ctx.accounts.user.key();
    position.vault = ctx.accounts.vault.key();
    position.input_mint = ctx.accounts.input_mint.key();
    position.output_mint = ctx.accounts.output_mint.key();
    position.amount_in = amount_in;
    position.sl_bps = sl_bps;
    position.tp_bps = tp_bps;
    position.entry_price = entry_price;
    position.bump = ctx.bumps.position;

    // Jupiter Swap CPI
    // The specific routing instructions and accounts are passed as remaining accounts
    // by the client (frontend/keeper) to avoid hardcoding complex DEX paths.
    
    // 1. Transfer tokens from user to a temporary authority or just use direct CPI if possible
    // For Jupiter CPI, we typically use the standard `invoke` or `invoke_signed`.
    
    msg!("Opening position with SL: {} bps, TP: {} bps", sl_bps, tp_bps);
    
    Ok(())
}
