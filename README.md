# Personal API

> Your AI surrogate. It talks to people so you don't have to.

Personal API is an open-source AI gateway that sits between you and the world. People interact with your surrogate — it answers what it can, drafts responses for your approval, and only escalates what truly needs your attention.

**Self-hosted. Private. Yours.**

## Why

You're busy. People want your time. Most questions have known answers. Most requests follow patterns. Most cold outreach isn't worth reading.

Personal API handles the 80% automatically and gives you a clean queue for the 20% that matters.

## How it works

```
Incoming message (any channel)
        │
        ▼
┌─────────────────┐
│  Classification  │ ← Knowledge base + LLM
│     Engine       │
└────────┬────────┘
         │
    ┌────┴────┬──────────┐
    ▼         ▼          ▼
  AUTO      DRAFT     ESCALATE
 Answer    Queue for   Notify
instantly  approval    immediately
```

## Features

- **Knowledge base** — teach your surrogate who you are, what you do, how you work
- **3-tier classification** — auto-respond, draft for review, or escalate
- **Multi-channel** — REST API, Telegram bot, embeddable widget
- **Admin dashboard** — manage knowledge, review drafts, track interactions
- **Contact awareness** — recognize known people, auto-escalate VIPs
- **Templates** — pattern-matched auto-responses for common scenarios
- **Full audit log** — every interaction tracked

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/vaionex/personal-api.git
cd personal-api
npm install
```

### 2. Set up Supabase

Create a [Supabase](https://supabase.com) project (free tier works), then run the schema:

```bash
# In Supabase SQL editor, run:
# supabase/schema.sql    — creates tables
# supabase/seed.sql      — optional: example data you can customize
```

### 3. Configure

```bash
cp .env.example .env
```

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=sk-ant-...

# Telegram (optional)
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
OWNER_TELEGRAM_ID=your-telegram-id

# App
PUBLIC_APP_NAME=Personal API
PUBLIC_OWNER_NAME=Your Name
```

### 4. Run

```bash
npm run dev     # Development
npm run build   # Production build
node build      # Run production
```

### 5. Deploy

Works anywhere Node.js runs. Docker, Coolify, Railway, Fly.io, VPS — pick your poison.

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "build"]
```

## Channels

### REST API

```bash
curl -X POST https://your-domain.com/api/ask \
  -H "Content-Type: application/json" \
  -d '{"query": "What does this person work on?", "name": "Jane"}'
```

### Embeddable Widget

Drop on any website:
```html
<script src="https://your-domain.com/widget.js" data-api="https://your-domain.com"></script>
```

### Telegram Bot

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Set `TELEGRAM_BOT_TOKEN` and `OWNER_TELEGRAM_ID`
3. Register webhook:
```bash
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

People message your bot → surrogate responds or notifies you with approve/reject buttons.

## Knowledge Base

Your surrogate is only as good as what you teach it. Categories:

| Category | What it stores | Example |
|---|---|---|
| `bio` | Who you are | Name, role, background |
| `project` | What you build | Active projects, tech stacks |
| `preference` | How you work | Communication style, timezone, tools |
| `stance` | Your opinions | Tech choices, industry takes |
| `boundary` | What you don't do | No free consulting, no crypto |
| `faq` | Pre-answered questions | Availability, collaboration process |

Manage via the admin dashboard at `/admin` or directly in Supabase.

## Architecture

```
personal-api/
├── src/
│   ├── lib/
│   │   └── server/
│   │       ├── engine.js      # Core: classify + generate
│   │       ├── supabase.js    # Database client
│   │       └── telegram.js    # Telegram bot helpers
│   ├── routes/
│   │   ├── +page.svelte       # Public chat interface
│   │   ├── admin/             # Knowledge + interaction management
│   │   └── api/
│   │       ├── ask/           # Main query endpoint
│   │       └── telegram/      # Webhook handler
│   └── hooks.server.js        # CORS
├── static/
│   └── widget.js              # Embeddable chat widget
├── supabase/
│   ├── schema.sql             # Database schema
│   └── seed.sql               # Example seed data
└── docker-compose.yml
```

## Configuration

### LLM Provider

Default: Anthropic Claude. The engine uses a single function call — swap the provider in `src/lib/server/engine.js` if you prefer OpenAI, local models, etc.

### Customizing Classification

Edit the system prompt in `engine.js` to change how your surrogate behaves:
- What it auto-responds to
- When it drafts vs. escalates
- Tone and personality
- What it refuses to answer

## Roadmap

- [ ] Email channel (IMAP watch + SMTP send)
- [ ] Webhook notifications (Discord, Slack, etc.)
- [ ] Conversation threads (multi-turn)
- [ ] Analytics dashboard
- [ ] Rate limiting per sender
- [ ] Multiple user support
- [ ] Plugin system for custom channels
- [ ] OpenAI / Ollama provider support

## Contributing

Contributions welcome. Open an issue first for anything non-trivial.

```bash
git clone https://github.com/vaionex/personal-api.git
cd personal-api
npm install
cp .env.example .env  # Fill in your values
npm run dev
```

## License

MIT — do whatever you want with it.
