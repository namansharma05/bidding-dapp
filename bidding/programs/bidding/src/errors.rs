use anchor_lang::prelude::*;
#[error_code]
pub enum BiddingError {
    #[msg("The provided previous bidder does not match the stored highest bidder.")]
    InvalidPreviousBidder,
}
