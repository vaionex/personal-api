# Personal API

> Your AI gatekeeper. It qualifies people before they get your time.

Personal API is an open-source AI agent that sits between you and the world. People don't get your calendar — they get your AI. If they have something worth meeting about, the AI grants access to book. Everyone else gets answered or redirected.

**No more "let's find 30 minutes" with people who haven't earned it.**

## How it works

```
Someone wants your time
        │
        ▼
  "Tell me what you need"
        │
        ▼
┌──────────────────────┐
│   AI evaluates if    │
│   this person has a  │
│   real reason to     │
│   meet you           │
└──────────┬───────────┘
           │
     ┌─────┴─────┐
     ▼           ▼
 QUALIFIED    NOT QUALIFIED
 Calendar     Gets answered
 unlocks      or redirected
```

### Qualification criteria (configurable):

**Qualifies:** Specific proposal, relevant to your work, clear agenda, mutual value  
**Doesn't qualify:** "Let's chat sometime", recruiting, generic sales, no clear purpose

## Features

- **AI gatekeeper** — evaluates and qualifies before granting calendar access
- **Calendly-style scheduling** — date picker, time slots, timezone detection
- **Google Calendar sync** — real-time availability, auto-creates events
- **Knowledge base** — teach the AI about you, your work, your boundaries
- **Multi-channel** — REST API, Telegram bot, embeddable widget
- **Contact awareness** — known contacts auto-qualify, VIPs auto-escalate
- **Conversation memory** — multi-turn context, qualification persists
- **Owner notifications** — Telegram + webhook for drafts, escalations, and new qualifications
- **Admin dashboard** — manage everything from `/admin`

## Quick Start

```bash
git clone https://github.com/vaionex/personal-api.git
cd personal-api
npm install
cp .env.example .env
# Fill in your values (Supabase, Anthropic/OpenAI, Telegram)
# Run supabase/schema.sql + supabase/seed.sql
npm run dev
```

## The Flow

### 1. Someone visits your page
They see a chat interface: *"Tell me what you need — if it's worth a meeting, I'll give you access to the calendar."*

### 2. They talk to your AI
Your surrogate knows everything in your knowledge base. It answers factual questions freely.

### 3. They ask for a meeting
The AI doesn't just hand out a booking link. It asks: *"What specifically would you like to discuss?"*

### 4. They qualify (or don't)
If they give a specific, relevant reason → the "Book a meeting" button appears and the AI shares booking links.  
If they're vague or irrelevant → politely redirected to async channels.

### 5. They book
Standard Calendly-style flow: pick a meeting type → select a date → choose a time → confirm.

## Scheduling

### Google Calendar Integration (optional)

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

Get your refresh token: visit `/api/admin/google-auth` to start the OAuth flow.

With Google Calendar connected:
- Availability computed from real calendar (freebusy API)
- Bookings create calendar events with attendee invites
- Cancellations sync to Google Calendar

Without Google Calendar: works standalone using Supabase bookings table.

### Meeting Types

Configure in admin or seed data:

| Type | Duration | Use case |
|---|---|---|
| Quick Chat | 15 min | Intros, quick questions |
| Consultation | 30 min | Project discussions |
| Deep Dive | 60 min | Complex technical topics |

### Availability Rules

Set per-day availability windows in admin:
- Monday–Thursday: 9:00–17:00
- Friday: 9:00–12:00
- Weekends: unavailable

## Channels

### Website Widget
```html
<script src="https://your-domain.com/widget.js" data-api="https://your-domain.com" data-name="Robin's AI"></script>
```

Widget attributes: `data-api`, `data-name`, `data-color`, `data-position` (left/right), `data-theme` (light/dark)

### Telegram Bot
Create a bot via [@BotFather](https://t.me/BotFather), set webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook&secret_token=YOUR_SECRET"
```

### REST API
```bash
curl -X POST https://your-domain.com/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "I want to discuss integrating your API into our product", "name": "Jane", "conversation_id": "optional-uuid"}'
```

Response includes `qualified: true/false` and `conversation_id` for multi-turn.

## Admin

- `/admin` — Knowledge base, templates, interaction log
- `/admin/bookings` — Upcoming bookings, meeting types, availability rules
- `/admin/contacts` — Manage known contacts, set auto-qualify/escalate
- `/admin/settings` — Configuration overview

## Deploy

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/build ./build
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "build"]
```

Works on Coolify, Railway, Fly.io, any Docker host.

## Stack

- SvelteKit + adapter-node
- Supabase (PostgreSQL)
- Anthropic Claude or OpenAI (configurable via `LLM_PROVIDER`)
- Google Calendar API (optional)
- Telegram Bot API (optional)

## Contributing

Contributions welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT — do whatever you want with it.
