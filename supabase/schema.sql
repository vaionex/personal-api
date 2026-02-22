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

-- Trust scores: accumulated reputation per sender
create table trust_scores (
  id uuid primary key default gen_random_uuid(),
  sender_id text,
  sender_email text,
  sender_name text,
  score int default 0,
  tier text default 'new', -- 'new' (0-10), 'known' (11-30), 'trusted' (31-60), 'vip' (61+)
  total_interactions int default 0,
  qualified_count int default 0,
  meetings_booked int default 0,
  meetings_completed int default 0,
  no_shows int default 0,
  referred_by uuid references contacts(id),
  last_interaction_at timestamptz default now(),
  created_at timestamptz default now()
);
create index idx_trust_sender on trust_scores(sender_id);
create index idx_trust_email on trust_scores(sender_email);

-- Referral tokens: generated by known contacts to vouch for someone
create table referrals (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  referrer_contact_id uuid references contacts(id),
  referrer_name text not null,
  note text, -- "Introducing Jane, she's working on X"
  max_uses int default 1,
  uses int default 0,
  used_by jsonb default '[]', -- [{name, email, used_at}]
  expires_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);
create index idx_referrals_token on referrals(token);

-- Video pitches: recorded async video messages
create table video_pitches (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id),
  sender_name text,
  sender_email text,
  video_url text, -- Supabase Storage URL
  duration_seconds int,
  transcript text, -- AI-generated transcript
  ai_evaluation text, -- AI assessment of the pitch
  ai_score int, -- 1-10 rating
  status text default 'pending', -- 'pending', 'reviewed', 'approved', 'rejected'
  trust_score_id uuid references trust_scores(id),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
create index idx_pitches_status on video_pitches(status);
create index idx_pitches_conversation on video_pitches(conversation_id);

-- Storage: create a 'pitches' bucket in Supabase Dashboard (public: false)

-- Topic routing: route conversations based on detected topics
create table topic_routes (
  id uuid primary key default gen_random_uuid(),
  topic text not null,              -- 'investment', 'technical', 'partnership', 'hiring', 'media'
  description text,                 -- 'Investment and funding discussions'
  event_type_slug text,             -- routes to this event type
  auto_qualify boolean default false, -- some topics auto-qualify (e.g., investment)
  priority int default 0,
  keywords jsonb default '[]',      -- trigger keywords: ["invest", "funding", "raise"]
  response_hint text,               -- hint for the AI on how to handle this topic
  active boolean default true,
  created_at timestamptz default now()
);
create index idx_topic_routes_active on topic_routes(active);

-- Proof events: anonymized feed of recent activity for social proof
create table proof_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,         -- 'qualified', 'booked', 'completed', 'referred'
  display_text text not null,       -- 'Someone from a tech startup qualified for a consultation'
  company text,                     -- anonymized: 'a tech startup' / 'a Fortune 500' (optional)
  topic text,                       -- 'technical', 'partnership', etc.
  meeting_type text,                -- 'Quick Chat', 'Deep Dive'
  created_at timestamptz default now()
);
create index idx_proof_events_created on proof_events(created_at desc);

-- Dossiers: AI-generated meeting prep briefs
create table dossiers (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  guest_name text not null,
  guest_email text not null,
  conversation_summary text,        -- AI-generated summary of the conversation
  guest_background text,            -- what we know about them (from conversation + public info)
  their_ask text,                   -- what they specifically want
  talking_points jsonb default '[]', -- suggested talking points for the owner
  potential_outcomes jsonb default '[]', -- possible outcomes/next steps
  risks text,                       -- potential concerns
  related_projects text,            -- which of owner's projects are relevant
  owner_notes text,                 -- owner can add notes before the meeting
  status text default 'generated',  -- 'generated', 'reviewed', 'archived'
  meeting_at timestamptz,
  created_at timestamptz default now()
);
create index idx_dossiers_booking on dossiers(booking_id);
create index idx_dossiers_meeting on dossiers(meeting_at);

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
alter table trust_scores enable row level security;
alter table referrals enable row level security;
alter table video_pitches enable row level security;

create policy "Event types public read" on event_types for select to anon using (active = true);
create policy "Service role full access event_types" on event_types for all to service_role using (true) with check (true);
create policy "Service role full access scheduling_rules" on scheduling_rules for all to service_role using (true) with check (true);
create policy "Bookings read by cancel token" on bookings for select to anon using (true);
create policy "Service role full access bookings" on bookings for all to service_role using (true) with check (true);
create policy "Service role full access trust_scores" on trust_scores for all to service_role using (true) with check (true);
create policy "Service role full access referrals" on referrals for all to service_role using (true) with check (true);
create policy "Service role full access video_pitches" on video_pitches for all to service_role using (true) with check (true);

alter table topic_routes enable row level security;
alter table proof_events enable row level security; 
alter table dossiers enable row level security;

create policy "Service role full access topic_routes" on topic_routes for all to service_role using (true) with check (true);
create policy "Proof events public read" on proof_events for select to anon using (true);
create policy "Service role full access proof_events" on proof_events for all to service_role using (true) with check (true);
create policy "Service role full access dossiers" on dossiers for all to service_role using (true) with check (true);
