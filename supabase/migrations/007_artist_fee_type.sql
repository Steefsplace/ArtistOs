alter table artists
  add column if not exists fee_type text default 'negotiable' check (fee_type in ('fixed', 'negotiable'));
