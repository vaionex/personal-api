# Personal API

Your AI surrogate. It talks to people first so you don't have to.

People reach you through **your API** — it answers what it can, filters out noise, and only passes through conversations that deserve your time.

## How it works

```
Someone asks a question
        ↓
   Your surrogate answers it (FAQ, project info, availability)
        or
   Drafts a response for your approval (partnerships, opportunities)
        or
   Escalates immediately (important people, urgent matters)
```

**You only see what matters.** Everything else is handled.

## Channels

| Channel | How |
|---|---|
| **Your website** | Embed `widget.js` — visitors talk to your surrogate |
| **Telegram bot** | Public bot link — anyone can message |
| **REST API** | `POST /api/ask` — integrate anywhere |
| **Admin** | `/admin` — manage knowledge base, review queue |

## The Knowledge Base

Your surrogate knows what you tell it:

- **Bio** — who you are, what you do
- **Projects** — what you're building, tech stacks
- **Preferences** — how you work, communication style
- **Stances** — opinions on tech, approaches
- **Boundaries** — what you don't do (free consulting, crypto pitches, etc.)
- **FAQ** — common questions pre-answered
- **Templates** — auto-responses for patterns (recruiters, vague collabs)

## Quick Start

```bash
npm install
cp .env.example .env
# Fill: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, OWNER_TELEGRAM_ID

# Run schema + seed against your Supabase project
npm run dev
```

### Set up Telegram webhook
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

### Embed on your website
```html
<script src="https://your-domain.com/widget.js" data-api="https://your-domain.com"></script>
```

## API

### `POST /api/ask`

```json
{
  "query": "What tech stack does Robin use?",
  "name": "Jane Smith",
  "channel": "widget"
}
```

Response:
```json
{
  "response": "Robin primarily uses SvelteKit + Supabase + Tailwind...",
  "type": "auto"
}
```

Types: `auto` (answered), `draft` (queued for review), `escalate` (forwarded immediately).

## Stack

SvelteKit + adapter-node, Supabase, Anthropic Claude, Telegram Bot API, Tailwind v4

## License

Private — Vaionex Corporation
