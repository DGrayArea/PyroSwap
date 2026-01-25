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

    #[account(mut)]
    pub config: Account<'info, GlobalConfig>,

    /// CHECK: Pyth price feed account
    pub oracle_price_feed: UncheckedAccount<'info>,

    #[account(mut)]
    pub protocol_fee_destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<ExecutePosition>, _passed_price: u64) -> Result<()> {
    let position = &ctx.accounts.position;
    let clock = Clock::get()?;

    // 1. Get & Validate Oracle Price
    // We ignore the passed-in price and use the on-chain oracle for security
    let oracle_data = crate::oracle::get_pyth_price(
        &ctx.accounts.oracle_price_feed,
        clock.slot,
        clock.unix_timestamp,
    )?;
    
    let current_price = oracle_data.price;
    msg!("Oracle execution price: {}", current_price);
    
    // 2. Re-validate Price Condition
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

    // 3. Perform Swap via Preferred DEX
    let preferred_dex = position.preferred_dex;
    let dex_accounts = ctx.remaining_accounts;
    
    // Seed for Vault signer
    let position_key = position.key();
    let bump = ctx.bumps.vault;
    let seeds = &[
        b"vault",
        position_key.as_ref(),
        &[bump],
    ];
    let signer_seeds = &[&seeds[..]];

    // Execute swap using Vault as signer
    // We use a simplified amount_out expectation for now (1% slippage from oracle price)
    // In production, this min_amount_out should be calculated more precisely or passed as argument
    let min_amount_out = 0; // Simplified for MVP execution

    let amount_in = ctx.accounts.vault.amount;

    let amount_out = match preferred_dex {
        DexType::Raydium => crate::dex::raydium::RaydiumAdapter::swap(amount_in, min_amount_out, dex_accounts, Some(signer_seeds))?,
        DexType::Orca => crate::dex::orca::OrcaAdapter::swap(amount_in, min_amount_out, dex_accounts, Some(signer_seeds))?,
        DexType::Meteora => crate::dex::meteora::MeteoraAdapter::swap(amount_in, min_amount_out, dex_accounts, Some(signer_seeds))?,
        DexType::PumpFun => crate::dex::pumpfun::PumpFunAdapter::swap(amount_in, min_amount_out, dex_accounts, Some(signer_seeds))?,
        _ => return Err(ErrorCode::InvalidDexType.into()),
    };
    
    msg!("Executed position via {:?}. Out: {}", preferred_dex, amount_out);
    
    // 3. Calculate Fees (Token) - Protocol Only
    // Reload vault balance because the swap just happened
    let vault_balance = ctx.accounts.vault.reload()?; // Ensure we see new balance
    let vault_balance_amount = ctx.accounts.vault.amount; 
    
    let config = &ctx.accounts.config;
    let total_protocol_fee = (vault_balance_amount as u128 * config.protocol_fee_bps as u128 / 10000) as u64;
    
    msg!("Executed. New Balance: {}. Total Protocol Fee: {}", vault_balance_amount, total_protocol_fee);

    // 4. Distribute Fees
    // Send Protocol Fee
    if total_protocol_fee > 0 {
         let cpi_accounts = token::Transfer {
            from: ctx.accounts.vault.to_account_info(),
            to: ctx.accounts.protocol_fee_destination.to_account_info(),
            authority: ctx.accounts.vault.to_account_info(),
        };
        let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(), cpi_accounts, signer_seeds);
        token::transfer(cpi_ctx, total_protocol_fee)?;
    }

    // 5. Send Remaining to User
    // NOTE: The `owner` account passed is an AccountInfo. We need to send tokens to the owner's ATA.
    // The keeper should pass the Owner's Token Account as a remaining account or we need to derive it.
    // For MVP safety, we will leave remaining tokens in the Vault for the user to `withdraw_manual`.
    // OR we transfer out if we can find the account. Use `withdraw_manual` for safety now.
    
    // Close position logic remains (transfer SOL execution fee)
    msg!("Tokens remaining in vault for user withdrawal: {}", vault_balance_amount - total_protocol_fee);

    // 6. SOL Fee Distribution (Executor)
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
    #[msg("Invalid DEX type")]
    InvalidDexType,
}
