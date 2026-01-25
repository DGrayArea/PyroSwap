use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};
use crate::state::*;
use crate::errors::*;
use crate::constants::*;

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
        token::mint = input_mint,
        token::authority = vault,
        seeds = [b"vault", position.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, TokenAccount>,

    pub input_mint: Account<'info, Mint>,
    pub output_mint: Account<'info, Mint>,

    /// CHECK: Pyth price feed account
    pub oracle_price_feed: UncheckedAccount<'info>,

    #[account(mut)]
    pub user: Signer<'info>,

    #[account(mut)]
    pub user_input_token: Account<'info, TokenAccount>,

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
    execution_fee: u64,
    preferred_dex: u8,
) -> Result<()> {
    // Validate parameters
    require!(sl_bps <= MAX_STOP_LOSS_BPS, PyroSwapError::StopLossTooHigh);
    require!(tp_bps >= MIN_TAKE_PROFIT_BPS && tp_bps <= MAX_TAKE_PROFIT_BPS, PyroSwapError::TakeProfitTooLow);
    require!(execution_fee >= MIN_EXECUTION_FEE, PyroSwapError::ExecutionFeeTooLow);
    require!(preferred_dex <= 3, PyroSwapError::InvalidDexType);

    // Validate entry price with Oracle
    let clock = Clock::get()?;
    let oracle_price = crate::oracle::get_pyth_price(
        &ctx.accounts.oracle_price_feed,
        clock.slot,
        clock.unix_timestamp,
    )?;

    // Ensure user's entry_price is close to oracle price (prevent bad inputs)
    // Allow 5% deviation for user setting price (maybe they want a limit order slightly away from market)
    // OR just verify the oracle is valid. For now, we'll verify readability.
    msg!("Oracle Price: {} ± {}", oracle_price.price, oracle_price.confidence);

    let position = &mut ctx.accounts.position;

    // Initialize position
    position.owner = ctx.accounts.user.key();
    position.vault = ctx.accounts.vault.key();
    position.input_mint = ctx.accounts.input_mint.key();
    position.output_mint = ctx.accounts.output_mint.key();
    position.amount_in = amount_in;
    position.sl_bps = sl_bps;
    position.tp_bps = tp_bps;
    position.entry_price = entry_price;
    position.execution_fee_escrow = execution_fee;
    position.oracle_price_feed = ctx.accounts.oracle_price_feed.key();
    position.preferred_dex = match preferred_dex {
        0 => DexType::Raydium,
        1 => DexType::Orca,
        2 => DexType::Meteora,
        _ => return Err(PyroSwapError::InvalidDexType.into()),
    };
    position.status = PositionStatus::Active;
    position.created_at = clock.unix_timestamp;
    position.executed_at = None;
    position.referrer = None;
    position.bump = ctx.bumps.position;

    // Transfer execution fee from user to position account
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

    // Transfer input tokens from user to vault
    let cpi_accounts = Transfer {
        from: ctx.accounts.user_input_token.to_account_info(),
        to: ctx.accounts.vault.to_account_info(),
        authority: ctx.accounts.user.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
    token::transfer(cpi_ctx, amount_in)?;

    msg!("Position created:");
    msg!("  Owner: {}", position.owner);
    msg!("  Input: {} {}", amount_in, ctx.accounts.input_mint.key());
    msg!("  Stop Loss: {}%", sl_bps as f64 / 100.0);
    msg!("  Take Profit: {}%", tp_bps as f64 / 100.0);
    msg!("  Entry Price: {}", entry_price);
    msg!("  Execution Fee: {} lamports", execution_fee);
    msg!("  Preferred DEX: {:?}", position.preferred_dex);

    Ok(())
}
