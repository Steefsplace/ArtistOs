-- Internal agent-to-agent messaging
create table if not exists agent_messages (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,
  booking_id uuid references booking_requests(id) on delete set null,

  from_agent text not null check (from_agent in ('marie', 'fleur', 'luuk', 'william')),
  to_agent   text not null check (to_agent   in ('marie', 'fleur', 'luuk', 'william')),

  subject    text not null,
  body       text not null,
  priority   text default 'normal' check (priority in ('low', 'normal', 'urgent')),

  read_at    timestamptz,
  created_at timestamptz default now()
);

-- RLS
alter table agent_messages enable row level security;

create policy "Users can view agent messages for their artists"
  on agent_messages for all using (
    artist_id in (select id from artists where user_id = auth.uid())
  );
