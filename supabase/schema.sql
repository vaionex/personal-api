-- Personal API Schema

-- Knowledge base: facts, preferences, opinions
create table knowledge (
  id uuid primary key default gen_random_uuid(),
  category text not null, -- 'project', 'preference', 'stance', 'faq', 'boundary', 'bio'
  key text not null,
  value text not null,
  context text, -- additional context for the LLM
  priority int default 0, -- higher = more important
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index idx_knowledge_category on knowledge(category);

-- Interaction log
create table interactions (
  id uuid primary key default gen_random_uuid(),
  channel text not null, -- 'widget', 'telegram', 'linkedin', 'email', 'api'
  sender_name text,
  sender_id text,
  query text not null,
  classification text not null, -- 'auto', 'draft', 'escalate'
  response text,
  status text default 'pending', -- 'pending', 'sent', 'approved', 'rejected', 'escalated'
  override_response text, -- if owner edited the draft
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index idx_interactions_status on interactions(status);
create index idx_interactions_channel on interactions(channel);

-- Response templates for common patterns
create table templates (
  id uuid primary key default gen_random_uuid(),
  trigger_pattern text not null, -- 'recruiter_outreach', 'meeting_request', 'collab_pitch'
  response_template text not null,
  auto_send boolean default false,
  created_at timestamptz default now()
);

-- Contacts: people the agent knows about
create table contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  linkedin_url text,
  company text,
  relationship text, -- 'close', 'professional', 'acquaintance', 'unknown'
  notes text,
  always_escalate boolean default false,
  created_at timestamptz default now()
);

-- Conversations: multi-turn conversation tracking
create table conversations (
  id uuid primary key default gen_random_uuid(),
  sender_id text,
  sender_name text,
  channel text not null,
  messages jsonb default '[]',
  last_message_at timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_conversations_sender_channel on conversations(sender_id, channel);
create index idx_conversations_last_message on conversations(last_message_at);

-- Scheduling: event types (like Calendly meeting types)
create table event_types (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,           -- 'quick-chat', 'consulting', 'intro-call'
  name text not null,                  -- 'Quick Chat'
  description text,
  duration_minutes int not null,       -- 15, 30, 60
  buffer_minutes int default 0,        -- buffer after meeting
  color text default '#2563eb',
  active boolean default true,
  max_per_day int,                     -- optional: limit bookings per day
  requires_approval boolean default false,
  created_at timestamptz default now()
);
create index idx_event_types_slug on event_types(slug);

-- Scheduling rules: when you're available (per day of week)
create table scheduling_rules (
  id uuid primary key default gen_random_uuid(),
  day_of_week int not null,            -- 0=Sun, 1=Mon, ..., 6=Sat
  start_time text not null,            -- '09:00'
  end_time text not null,              -- '17:00'
  available boolean default true,
  timezone text default 'UTC',
  created_at timestamptz default now()
);
create index idx_scheduling_rules_day on scheduling_rules(day_of_week);

-- Bookings
create table bookings (
  id uuid primary key default gen_random_uuid(),
  event_type_id uuid references event_types(id),
  start_time timestamptz not null,
  end_time timestamptz not null,
  guest_name text not null,
  guest_email text not null,
  guest_notes text,
  guest_timezone text default 'UTC',
  google_event_id text,                -- synced Google Calendar event
  status text default 'confirmed',     -- 'confirmed', 'cancelled', 'completed', 'pending'
  cancel_token text default encode(gen_random_bytes(16), 'hex'),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index idx_bookings_start on bookings(start_time);
create index idx_bookings_status on bookings(status);
create index idx_bookings_cancel_token on bookings(cancel_token);

-- RLS Policies
-- Note: This app uses service_role key which bypasses RLS.
-- These policies are for potential future anon key usage.
alter table knowledge enable row level security;
alter table interactions enable row level security;
alter table templates enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;

-- Service role has full access to all tables (bypasses RLS)
-- Adding read-only policies for anon key on knowledge (for potential future public API)
create policy "Knowledge read-only for anon" on knowledge for select to anon using (true);
create policy "Service role full access knowledge" on knowledge for all to service_role using (true) with check (true);

create policy "Service role full access interactions" on interactions for all to service_role using (true) with check (true);
create policy "Service role full access templates" on templates for all to service_role using (true) with check (true);
create policy "Service role full access contacts" on contacts for all to service_role using (true) with check (true);
create policy "Service role full access conversations" on conversations for all to service_role using (true) with check (true);

alter table event_types enable row level security;
alter table scheduling_rules enable row level security;
alter table bookings enable row level security;
create policy "Event types public read" on event_types for select to anon using (active = true);
create policy "Service role full access event_types" on event_types for all to service_role using (true) with check (true);
create policy "Service role full access scheduling_rules" on scheduling_rules for all to service_role using (true) with check (true);
create policy "Bookings read by cancel token" on bookings for select to anon using (true);
create policy "Service role full access bookings" on bookings for all to service_role using (true) with check (true);
