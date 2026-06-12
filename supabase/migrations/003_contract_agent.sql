-- Contracts table
create table if not exists contracts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references booking_requests(id) on delete cascade,

  contract_text text not null,        -- Full contract in Markdown
  contract_summary text,              -- Short summary of key terms
  status text default 'draft' check (status in ('draft', 'sent', 'signed', 'cancelled')),

  sent_at timestamptz,
  signed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add contract_id reference to booking_requests
alter table booking_requests
  add column if not exists contract_id uuid references contracts(id) on delete set null;

-- RLS
alter table contracts enable row level security;

create policy "Users can manage contracts for their artists"
  on contracts for all using (
    booking_id in (
      select id from booking_requests
      where artist_id in (select id from artists where user_id = auth.uid())
    )
  );
