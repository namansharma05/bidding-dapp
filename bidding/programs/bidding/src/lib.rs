use anchor_lang::prelude::*;
mod blueprints;
mod contexts;
mod errors;

use contexts::*;
use errors::*;

declare_id!("D7rhKbV2vR28tjtKEf7w1dk3TdyFmDKq2GouMHcSJSGs");

#[program]
pub mod bidding {
    use super::*;

    use crate::blueprints::Escrow;

    pub fn initialize_counter(ctx: Context<InitializeCounter>) -> Result<()> {
        let item_counter_account = &mut ctx.accounts.item_counter_account;
        item_counter_account.item_count = 1;
        item_counter_account.authority = ctx.accounts.authority.key();
        Ok(())
    }

    pub fn initialize_item(
        ctx: Context<InitializeItem>,
        name: String,
        description: String,
        image_url: String,
        opening_price: u64,
        minimum_bid: u64,
    ) -> Result<()> {
        let escrow_account = &mut ctx.accounts.escrow_account;
        escrow_account.authority = ctx.accounts.authority.key();

        let item_counter = &mut ctx.accounts.item_counter_account;
        let current_count = item_counter.item_count;
        item_counter.item_count += 1;

        let item_account = &mut ctx.accounts.item_account;
        item_account.item_id = current_count;
        item_account.authority = ctx.accounts.authority.key();
        item_account.name = name.clone();
        item_account.description = description.clone();
        item_account.image_url = image_url.clone();
        item_account.opening_price = opening_price;
        item_account.minimum_bid = minimum_bid;
        item_account.highest_bid = 0;
        item_account.highest_bidder = anchor_lang::system_program::ID;
        Ok(())
    }

    pub fn bid(ctx: Context<Bid>, _item_id: u16) -> Result<()> {
        let item_account = &mut ctx.accounts.item_account;

        // Calculate the new bid amount
        let bid_amount;
        if item_account.highest_bid == 0 {
            bid_amount = item_account.opening_price;
        } else {
            bid_amount = item_account.highest_bid + item_account.minimum_bid;
        }

        // New Bidder → Escrow
        let new_bid_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.authority.to_account_info(),
                to: ctx.accounts.escrow_account.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(new_bid_ctx, bid_amount)?;

        // Refund the previous bidder if there was one
        if item_account.highest_bid > 0
            && item_account.highest_bidder != anchor_lang::system_program::ID
        {
            if !ctx.accounts.previous_bidder.is_writable {
                return err!(BiddingError::PreviousBidderNotWritable);
            }
            let refund_amount = item_account.highest_bid;

            // Escrow -> Previous Bidder (using manual lamport transfer)
            let rent = Rent::get()?;
            let escrow_lamports = **ctx
                .accounts
                .escrow_account
                .to_account_info()
                .lamports
                .borrow();
            let min_rent = rent.minimum_balance(Escrow::INIT_SPACE + 8);

            msg!(
                "Escrow Balance: {}, Refund Amount: {}, Min Rent: {}",
                escrow_lamports,
                refund_amount,
                min_rent
            );
            if escrow_lamports.checked_sub(refund_amount).unwrap() < min_rent {
                return err!(BiddingError::EscrowNotRentExempt);
            }

            // We use manual transfer because the Escrow account has data, so System Program CPI fails.
            **ctx
                .accounts
                .escrow_account
                .to_account_info()
                .try_borrow_mut_lamports()? -= refund_amount;
            **ctx
                .accounts
                .previous_bidder
                .to_account_info()
                .try_borrow_mut_lamports()? += refund_amount;
        }

        // Update highest bid and bidder
        item_account.highest_bid = bid_amount;
        item_account.highest_bidder = ctx.accounts.authority.key();

        Ok(())
    }

    pub fn transfer_item_to_winner(
        ctx: Context<TransferItemToWinner>,
        _item_id: u16,
        new_authority: Pubkey,
    ) -> Result<()> {
        let item_account = &mut ctx.accounts.item_account;

        if new_authority == anchor_lang::system_program::ID {
            return err!(BiddingError::InvalidNewAuthority);
        }

        // we use manual transfer becasue the escrow has data so system_program fails to transfer lamports
        let escrow_lamports = **ctx
            .accounts
            .escrow_account
            .to_account_info()
            .try_borrow_lamports()?;
        **ctx
            .accounts
            .escrow_account
            .to_account_info()
            .try_borrow_mut_lamports()? -= escrow_lamports;
        **ctx
            .accounts
            .authority
            .to_account_info()
            .try_borrow_mut_lamports()? += escrow_lamports;

        item_account.authority = new_authority;
        Ok(())
    }
}
