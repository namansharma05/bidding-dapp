use anchor_lang::prelude::*;
#[error_code]
pub enum BiddingError {
    #[msg("The provided previous bidder does not match the stored highest bidder.")]
    InvalidPreviousBidder,
    #[msg("The previous bidder account must be writable to receive the refund.")]
    PreviousBidderNotWritable,
    #[msg("The escrow account would not remain rent exempt after the refund.")]
    EscrowNotRentExempt,
    #[msg("The winner is not valid")]
    InvalidNewAuthority,
    #[msg("The auction creator is not valid")]
    InvalidAuctionCreator,
}
