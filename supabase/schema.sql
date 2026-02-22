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
