# Contributing to Personal API

Thanks for your interest in contributing.

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/personal-api.git`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env` and fill in your values
5. Run: `npm run dev`

## Development

- **Framework**: SvelteKit with adapter-node
- **Database**: Supabase (PostgreSQL)
- **AI**: Anthropic Claude (swappable)
- **Style**: Tailwind CSS v4

### Project structure

- `src/lib/server/` — Server-side logic (engine, DB, Telegram)
- `src/routes/api/` — API endpoints
- `src/routes/admin/` — Admin dashboard
- `static/widget.js` — Embeddable widget
- `supabase/` — Database schema and seeds

## Pull Requests

1. Open an issue first for non-trivial changes
2. One feature per PR
3. Make sure `npm run build` passes
4. Keep the code simple — this project values clarity over cleverness

## Areas to Contribute

- **New channels** — Email, Discord, Slack, WhatsApp
- **LLM providers** — OpenAI, Ollama, local models
- **Better admin UI** — Charts, analytics, bulk operations
- **Multi-turn conversations** — Thread support
- **Documentation** — Guides, examples, use cases
- **Translations** — i18n support

## Code Style

- No TypeScript (vanilla JS + JSDoc where helpful)
- Minimal dependencies
- Server logic in `src/lib/server/`
- Svelte 5 runes (`$state`, `$derived`, `$effect`)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
