# Solana Bidding DApp

Bidding dApp is a decentralized application built on the Solana blockchain that allows users to list items for auction and accept bids within a fixed time duration. Participants can place bids until the auction ends, after which the highest bidder receives ownership authority of the item. The winning bid amount is securely transferred to the previous owner through an escrow account, ensuring trust-less and transparent fund handling.

## Features
- Connect Wallet Button: It is used to connect, switch or disconnect solana wallets
- Profile Icon: Here all the items owned by the connected wallet account will be displayed
- +OpenBid Button: This button is going to list a new item on the store.
- Participants can bid until the time ran out.
- When Auction ends the item will be transferred to the highest bidder and highest bid will be transferred to the previous owner of the item using an escrow account.

## Tech Stack
- Frontend: Next.js, TypeScript, Tailwind CSS
- Backend: Anchor
- Database: Supabase, PostgreSQL
- Testing: Anchor test framework

## Project Structure
```
bidding-dapp/
├── client/
│ ├── app/
│ | ├── components/ # React components
| | ├── idl/
| | ├── globals.css # Tailwind CSS
| | ├── layout.tsx
| | └── page.tsx
│ └── public/
│ 
├── programs/bidding/
│ ├── src/
│ │ ├── lib.rs
│ │ ├── contexts.rs
| | ├── blueprints.rs
│ │ └── errors.rs
│ └── Anchor.toml
├── tests/
├── README.md
└── package.json
```

## Installation
```
git clone git@github.com:namansharma05/bidding-dapp.git
cd bidding-dapp/
cd bidding/
anchor keys sync
anchor build
solana-test-validator

# on different terminal in same directory
anchor deploy

# on different terminal in client directory
npm run dev
```
