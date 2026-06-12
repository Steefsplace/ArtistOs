-- Add extra profile fields to artists table
alter table artists
  add column if not exists genre text,
  add column if not exists bio text,
  add column if not exists base_fee numeric(10,2),
  add column if not exists minimum_fee numeric(10,2),
  add column if not exists city text,
  add column if not exists website text,
  add column if not exists updated_at timestamptz default now();
