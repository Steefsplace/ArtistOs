-- Messages/conversations table
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  booking_request_id uuid references booking_requests(id) on delete set null,

  -- Contact info
  from_name text not null,
  from_email text not null,
  subject text,
  body text not null,

  -- Agent processing
  direction text not null check (direction in ('inbound', 'outbound')),
  status text default 'unread' check (status in ('unread', 'read', 'draft', 'sent', 'archived')),
  agent_draft text,       -- AI-generated response draft
  agent_notes text,       -- Internal notes from agent

  parent_id uuid references messages(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table messages enable row level security;

create policy "Users can manage messages for their artists"
  on messages for all using (
    artist_id in (select id from artists where user_id = auth.uid())
  );

create policy "Anyone can create an inbound message"
  on messages for insert
  to anon, authenticated
  with check (direction = 'inbound');
