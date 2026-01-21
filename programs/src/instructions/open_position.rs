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
    execution_fee: u64, // New argument: The bounty for the bot (in lamports)
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
    position.execution_fee_escrow = execution_fee; // Store it so we know how much to pay the bot
    position.bump = ctx.bumps.position;
    
    // Position referrer is left as None (default/unused for SL/TP)
    position.referrer = None;

    // 1. Transfer the Execution Fee (SOL) from User to the Position Account
    // This effectively "tops up" the account with the bot's future payment.
    let transfer_ix = anchor_lang::solana_program::system_instruction::transfer(
        &ctx.accounts.user.key(),
        &position.key(),
        execution_fee,
    );
    anchor_lang::solana_program::program::invoke(
        &transfer_ix,
        &[
            ctx.accounts.user.to_account_info(),
            position.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // 2. Jupiter Swap CPI / Token Transfer Logic
    // (Existing placeholder logic...)
    // For MVP, we assume tokens are transferred to the vault here (not shown in this snippet)

    msg!("Opening position with SL: {} bps, TP: {} bps", sl_bps, tp_bps);
    msg!("Escrowed execution fee: {} lamports", execution_fee);
    
    Ok(())
}
