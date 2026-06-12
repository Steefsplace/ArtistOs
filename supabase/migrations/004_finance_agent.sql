-- Invoices table
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  booking_id uuid references booking_requests(id) on delete set null,

  invoice_number text not null unique,
  invoice_type text default 'full' check (invoice_type in ('deposit', 'final', 'full')),
  amount_ex_vat numeric(10, 2) not null,
  vat_rate numeric(5, 2) default 21,
  amount_incl_vat numeric(10, 2) not null,
  description text,
  invoice_text text,                  -- Full invoice in Markdown

  status text default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  due_date date,
  paid_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Finance logs table
create table if not exists finance_logs (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  booking_id uuid references booking_requests(id) on delete set null,
  action text not null,
  amount numeric(10, 2),
  notes text,
  created_at timestamptz default now()
);

-- RLS
alter table invoices enable row level security;

create policy "Users can manage invoices for their artists"
  on invoices for all using (
    artist_id in (select id from artists where user_id = auth.uid())
  );

alter table finance_logs enable row level security;

create policy "Users can manage finance logs for their artists"
  on finance_logs for all using (
    artist_id in (select id from artists where user_id = auth.uid())
  );
