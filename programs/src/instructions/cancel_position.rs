use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::*;

#[derive(Accounts)]
pub struct CancelPosition<'info> {
    #[account(
        mut,
        seeds = [b"position", owner.key().as_ref(), position.input_mint.as_ref()],
        bump = position.bump,
        has_one = owner,
        constraint = position.status == PositionStatus::Active @ PyroSwapError::PositionAlreadyExecuted
    )]
    pub position: Account<'info, Position>,

    #[account(
        mut,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(mut)]
    pub owner_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<CancelPosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    
    // Mark position as cancelled
    position.status = PositionStatus::Cancelled;

    // Refund execution fee to owner
    let execution_fee = position.execution_fee_escrow;
    if execution_fee > 0 {
        **position.to_account_info().try_borrow_mut_lamports()? -= execution_fee;
        **ctx.accounts.owner.to_account_info().try_borrow_mut_lamports()? += execution_fee;
    }

    // Transfer tokens back from vault to owner
    let vault_balance = ctx.accounts.vault.amount;
    if vault_balance > 0 {
        let position_key = position.key();
        let seeds = &[
            b"vault",
            position_key.as_ref(),
            &[ctx.bumps.vault],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.owner_token_account.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, vault_balance)?;
    }

    msg!("Position cancelled. Refunded {} lamports execution fee", execution_fee);
    msg!("Returned {} tokens to owner", vault_balance);

    Ok(())
}
