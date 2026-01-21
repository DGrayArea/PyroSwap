use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::*;

#[derive(Accounts)]
pub struct Swap<'info> {
    /// CHECK: This is the user or aggregator calling the swap
    pub authority: Signer<'info>,

    #[account(mut)]
    pub user_source_token: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_destination_token: Account<'info, TokenAccount>,

    /// The Protocol's fee collection wallet (ATA)
    #[account(mut)]
    pub protocol_fee_destination: Account<'info, TokenAccount>,

    /// Optional: The Referrer's fee collection wallet (ATA)
    #[account(mut)]
    pub referrer_fee_account: Option<Account<'info, TokenAccount>>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, GlobalConfig>,

    pub token_program: Program<'info, Token>,
}

pub fn handler(
    ctx: Context<Swap>, 
    amount: u64, 
    min_amount_out: u64,
    referral_fee_bps: u16
) -> Result<()> {
    // 1. Validation
    require!(referral_fee_bps <= 1000, ErrorCode::dbr); // Max 10%

    let config = &ctx.accounts.config;
    
    // 2. Calculate Fees
    // Protocol Fee (Base)
    let protocol_fee = (amount as u128 * config.protocol_fee_bps as u128 / 10000) as u64;
    
    // Referral Fee (Variable)
    let referral_fee = (amount as u128 * referral_fee_bps as u128 / 10000) as u64;

    let total_fee = protocol_fee + referral_fee;
    let _swap_amount = amount.checked_sub(total_fee).ok_or(ErrorCode::NotEnoughFunds)?;

    msg!("Swapping: {}. Protocol Fee: {}. Referral Fee: {}", _swap_amount, protocol_fee, referral_fee);

    // 3. Transfer Protocol Fee
    if protocol_fee > 0 {
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.user_source_token.to_account_info(),
            to: ctx.accounts.protocol_fee_destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
        token::transfer(cpi_ctx, protocol_fee)?;
    }

    // 4. Transfer Referral Fee (if applicable)
    if referral_fee > 0 {
        if let Some(referrer_account) = &ctx.accounts.referrer_fee_account {
             let cpi_accounts = token::Transfer {
                from: ctx.accounts.user_source_token.to_account_info(),
                to: referrer_account.to_account_info(),
                authority: ctx.accounts.authority.to_account_info(),
            };
            let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
            token::transfer(cpi_ctx, referral_fee)?;
        }
    }

    // 5. Jupiter Swap CPI
    // In a real integration, we would now invoke the Jupiter program (passed in remaining_accounts)
    // using the remaining `swap_amount`.
    // The `authority` here is the USER (Signer), so the user will sign the Jupiter transaction directly
    // after our program takes its cut.
    // NOTE: This requires the frontend to construct the transaction such that:
    // Ix1: PyroSwap::swap (Does logic above)
    // Ix2: Jupiter::swap (Does the actual swap)
    // OR we do a CPI call here if we want atomic enforcement (more complex due to account size).
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Referral fee cannot exceed 10%")]
    dbr,
    #[msg("Not enough funds to cover fees")]
    NotEnoughFunds,
}
