use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};
use crate::state::*;
use crate::dex::DexAdapter;

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
    preferred_dex: u8 // 0=Raydium, 1=Orca, 2=Meteora, 3=PumpFun
) -> Result<()> {
    // 1. Validation
    require!(amount > 0, ErrorCode::InvalidAmount);

    let config = &ctx.accounts.config;
    
    // 2. Calculate Fees
    // Protocol Fee (Base)
    let protocol_fee = (amount as u128 * config.protocol_fee_bps as u128 / 10000) as u64;
    
    // Referral Fee (Variable)
    let referral_fee = if ctx.accounts.referrer_fee_account.is_some() {
        (amount as u128 * config.referral_fee_share_bps as u128 / 10000) as u64
    } else {
        0
    };

    let total_fee = protocol_fee + referral_fee;
    let swap_amount = amount.checked_sub(total_fee).ok_or(ErrorCode::NotEnoughFunds)?;

    msg!("Swapping: {}. Protocol Fee: {}. Referral Fee: {}", swap_amount, protocol_fee, referral_fee);

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

    // 5. Execute Swap on preferred DEX
    // The DEX accounts are passed as remaining_accounts
    let dex_accounts = ctx.remaining_accounts;
    
    let amount_out = match preferred_dex {
        0 => crate::dex::raydium::RaydiumAdapter::swap(swap_amount, min_amount_out, dex_accounts, None)?,
        1 => crate::dex::orca::OrcaAdapter::swap(swap_amount, min_amount_out, dex_accounts, None)?,
        2 => crate::dex::meteora::MeteoraAdapter::swap(swap_amount, min_amount_out, dex_accounts, None)?,
        3 => crate::dex::pumpfun::PumpFunAdapter::swap(swap_amount, min_amount_out, dex_accounts, None)?,
        _ => return Err(ErrorCode::InvalidDexType.into()),
    };

    msg!("Swap executed via DEX {}. Amount out: {}", preferred_dex, amount_out);
    
    Ok(())
}

#[error_code]
pub enum ErrorCode {
    #[msg("Referral fee cannot exceed 10%")]
    dbr,
    #[msg("Not enough funds to cover fees")]
    NotEnoughFunds,
    #[msg("Invalid DEX type")]
    InvalidDexType,
    #[msg("Invalid amount")]
    InvalidAmount,
}
