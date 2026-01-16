use anchor_lang::prelude::*;

declare_id!("D7rhKbV2vR28tjtKEf7w1dk3TdyFmDKq2GouMHcSJSGs");

#[program]
pub mod bidding {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
