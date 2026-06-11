-- Artists table
create table if not exists artists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  genre text,
  base_fee integer default 0, -- in euros
  min_fee integer default 0,
  bio text,
  technical_rider text,
  hospitality_rider text,
  created_at timestamptz default now()
);

-- Booking requests table
create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid references artists(id) on delete cascade,

  -- Promotor info
  promotor_name text not null,
  promotor_email text not null,
  promotor_phone text,
  venue_name text not null,
  venue_city text not null,
  venue_capacity integer,

  -- Event details
  event_date date not null,
  event_name text,
  set_duration integer, -- in minutes
  offered_fee integer, -- in euros
  additional_info text,

  -- Agent processing
  status text default 'pending' check (status in ('pending', 'reviewing', 'negotiating', 'confirmed', 'declined', 'cancelled')),
  agent_assessment jsonb, -- AI agent's analysis
  agent_response text,    -- Draft response to promotor
  agent_notes text,       -- Internal notes

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Agent conversation log
create table if not exists agent_logs (
  id uuid primary key default gen_random_uuid(),
  booking_request_id uuid references booking_requests(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'tool')),
  content text not null,
  tool_name text,
  created_at timestamptz default now()
);

-- RLS policies
alter table artists enable row level security;
alter table booking_requests enable row level security;
alter table agent_logs enable row level security;

create policy "Users can manage their own artist profile"
  on artists for all using (auth.uid() = user_id);

create policy "Users can view booking requests for their artists"
  on booking_requests for all using (
    artist_id in (select id from artists where user_id = auth.uid())
  );

create policy "Anyone can create a booking request"
  on booking_requests for insert with check (true);

create policy "Users can view agent logs for their bookings"
  on agent_logs for all using (
    booking_request_id in (
      select br.id from booking_requests br
      join artists a on br.artist_id = a.id
      where a.user_id = auth.uid()
    )
  );
