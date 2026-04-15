# Free Mint Scanner 🔍

A real-time Next.js app that polls OpenSea's API for newly minted NFTs and filters for **free mints** (price = 0 / mint-from-zero events). Falls back to demo data when no API key is configured.

## Features

- ⚡ Auto-polls OpenSea every 60 seconds
- 🔍 Filters to free/zero-price mints only
- 🌐 Multi-chain display (Ethereum, Base, Polygon, Solana, Arbitrum)
- 🔎 Search by name or collection
- ⛓ Filter by chain
- 🎨 Grid and list view modes
- 📦 Demo mode — works without an API key
- 🔒 Security headers, rate limiting, input sanitisation

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.local.example .env.local
# Edit .env.local and add your OPENSEA_API_KEY

# 3. Run
npm run dev
# Open http://localhost:3000
```

## Get an OpenSea API Key

1. Go to https://docs.opensea.io/reference/api-overview
2. Sign up / log in at https://opensea.io
3. Request an API key from your account dashboard
4. Paste it into `.env.local` as `OPENSEA_API_KEY`

## Deploy to Vercel

```bash
# Push to GitHub first, then:
npx vercel --prod

# Or connect the GitHub repo in the Vercel dashboard.
# Add OPENSEA_API_KEY in: Project → Settings → Environment Variables
```

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `OPENSEA_API_KEY` | No* | — | OpenSea v2 API key (*demo mode without it) |
| `NEXT_PUBLIC_POLL_INTERVAL` | No | `60000` | Poll interval in ms |
| `NEXT_PUBLIC_MAX_RESULTS` | No | `20` | Max NFTs per fetch (max 50) |

## Security Notes

- API key is server-side only, never sent to the browser
- Rate limiting: 30 requests/min per IP
- All query params are sanitised
- Security headers applied globally via `vercel.json` and `next.config.js`
- NEVER commit `.env.local`

## License

MIT
