# Personal API

An AI-powered professional presence layer. It answers questions, handles requests, and drafts responses **as you** — so you only deal with what actually needs your attention.

## What it does

- **Auto-responds** to routine queries (FAQ, tech stack questions, availability)
- **Drafts replies** for nuanced requests (partnerships, opportunities) — you approve with one tap
- **Escalates** when it's something only you can handle (close contacts, urgent matters)
- **Learns** from your corrections over time

## Channels

| Channel | Status | How |
|---|---|---|
| **Web widget** | ✅ Ready | Drop `widget.js` on any site |
| **Telegram bot** | ✅ Ready | Public bot for async Q&A |
| **REST API** | ✅ Ready | `POST /api/ask` |
| **LinkedIn** | ✅ Ready | Chrome extension for message drafting |
| **Email** | 🔜 Planned | IMAP watcher + draft queue |

## Architecture

```
┌─────────────────────────────────────┐
│           Personal API              │
│         (SvelteKit + Node)          │
├──────────┬──────────┬───────────────┤
│ Knowledge│ LLM      │ Notification  │
│ Base     │ Engine   │ Layer         │
│ (Supa-   │ (Claude) │ (Telegram)    │
│ base)    │          │               │
└──────────┴──────────┴───────────────┘
```

## Quick Start

```bash
# Install
npm install

# Set up environment
cp .env.example .env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY, TELEGRAM_BOT_TOKEN, OWNER_TELEGRAM_ID

# Run Supabase migrations
# Execute supabase/schema.sql and supabase/seed.sql against your Supabase project

# Dev
npm run dev

# Set Telegram webhook
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
```

## Embed Widget

Add to any website:
```html
<script src="https://your-domain.com/widget.js" data-api="https://your-domain.com"></script>
```

## Chrome Extension (LinkedIn)

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked" → select the `extension/` folder
4. Go to extension options → set your API URL
5. Open LinkedIn messages → "Draft reply" buttons appear

## Admin Dashboard

Visit `/admin` to manage your knowledge base and review interactions.

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

Types: `auto` (answered immediately), `draft` (forwarded for review), `escalate` (urgent, forwarded immediately).

## Knowledge Base Categories

- **bio** — Name, role, background
- **project** — Active projects and their details
- **preference** — Tech stack, communication style, scheduling
- **stance** — Opinions on frameworks, approaches, industry topics
- **boundary** — Things you don't do (free consulting, crypto, etc.)
- **faq** — Common questions and answers

## Stack

- SvelteKit (adapter-node)
- Supabase (PostgreSQL)
- Anthropic Claude (classification + drafting)
- Telegram Bot API (notifications + public bot)
- Chrome Extension (LinkedIn integration)

## License

Private — Vaionex Corporation
