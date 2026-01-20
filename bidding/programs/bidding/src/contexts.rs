use crate::blueprints::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeCounter<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + ItemCounter::INIT_SPACE,
        seeds = [b"item_counter"],
        bump,
    )]
    pub item_counter_account: Account<'info, ItemCounter>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeItem<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"item_counter"],
        bump,
    )]
    pub item_counter_account: Account<'info, ItemCounter>,

    #[account(
        init,
        payer = authority,
        space = 8 + Item::INIT_SPACE,
        seeds = [
            b"item",
            item_counter_account.item_count.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub item_account: Account<'info, Item>,

    pub system_program: Program<'info, System>,
}
