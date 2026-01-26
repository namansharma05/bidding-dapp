use crate::blueprints::*;
use crate::errors::*;
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

    #[account(
        init,
        payer = authority,
        space = 8 + Escrow::INIT_SPACE,
        seeds = [b"escrow", authority.key().as_ref(), item_counter_account.item_count.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(item_id: u16)]
pub struct Bid<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"item",
            item_id.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub item_account: Account<'info, Item>,

    #[account(
        mut,
        seeds = [b"escrow", item_account.authority.key().as_ref(), item_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, Escrow>,

    /// CHECK: This account is the previous highest bidder who will receive a refund.
    /// We verify this matches the address stored in the item_account.
    #[account(
        mut,
        constraint = previous_bidder.key() == item_account.highest_bidder @ BiddingError::InvalidPreviousBidder
    )]
    pub previous_bidder: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(item_id: u16)]
pub struct TransferItemToWinner<'info> {
    #[account(
        mut,
        seeds = [
            b"item",
            item_id.to_le_bytes().as_ref(),
        ],
        bump,
    )]
    pub item_account: Account<'info, Item>,

    #[account(
        mut,
        seeds = [b"escrow", item_account.authority.key().as_ref(), item_id.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow_account: Account<'info, Escrow>,

    pub system_program: Program<'info, System>,
}
