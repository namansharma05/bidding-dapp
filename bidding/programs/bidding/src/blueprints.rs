use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Item {
    pub authority: Pubkey,
    #[max_len(200)]
    pub name: String,
    #[max_len(600)]
    pub description: String,
    #[max_len(500)]
    pub image_url: String,
    pub price: u64,
    pub item_id: u16,
}

#[account]
#[derive(InitSpace)]
pub struct ItemCounter {
    pub authority: Pubkey,
    pub item_count: u16,
}
