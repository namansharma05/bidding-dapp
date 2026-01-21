use anchor_lang::prelude::*;
mod blueprints;
mod contexts;

use contexts::*;

declare_id!("D7rhKbV2vR28tjtKEf7w1dk3TdyFmDKq2GouMHcSJSGs");

#[program]
pub mod bidding {
    use super::*;

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
        price: u64,
    ) -> Result<()> {
        let item_counter = &mut ctx.accounts.item_counter_account;
        item_counter.item_count += 1;

        let item_account = &mut ctx.accounts.item_account;
        item_account.item_id = item_counter.item_count;
        item_account.authority = ctx.accounts.authority.key();
        item_account.name = name.clone();
        item_account.description = description.clone();
        item_account.image_url = image_url.clone();
        item_account.price = price;
        Ok(())
    }
}
