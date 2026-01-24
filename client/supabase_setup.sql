drop table if exists public.auctions;
-- Create the table if it doesn't exist
create table if not exists public.auctions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  description text,
  image_url text,
  opening_bid numeric,
  duration integer,
  minimum_increment numeric,
  highest_bid numeric default 0,
  creator_wallet text,
  item_id numeric
);

-- For existing tables, run this:
-- alter table public.auctions add column if not exists highest_bid numeric default 0;

-- Enable Row Level Security
alter table public.auctions enable row level security;

-- Create a policy to allow anyone to insert data (since we are checking wallet on client side)
-- WARNING: For production, you might want stricter auth checks, but for this dApp demo, allowing anon inserts with a wallet address is common if you aren't using Supabase Auth.
create policy "Enable insert for everyone" on public.auctions
  for insert
  with check (true);

-- Create a policy to allow everyone to read auctions
create policy "Enable read for everyone" on public.auctions
  for select
  using (true);

-- Create a policy to allow everyone to update auctions (everyone can bid)
create policy "Enable update for everyone" on public.auctions
  for update
  using (true)
  with check (true);
