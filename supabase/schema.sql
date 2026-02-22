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

-- RLS
alter table knowledge enable row level security;
alter table interactions enable row level security;
alter table templates enable row level security;
alter table contacts enable row level security;
