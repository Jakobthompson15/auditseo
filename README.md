# Marketing Visibility Audit

A full-stack Next.js app that runs a combined **SEO + AI visibility report** for any domain, powered by the [DataForSEO MCP server](https://dataforseo.com/mcp) and [Anthropic Claude](https://www.anthropic.com).

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_USERNAME%2Fauditseo&env=ANTHROPIC_API_KEY,DATAFORSEO_MCP_URL,DATAFORSEO_API_TOKEN&envDescription=API%20keys%20for%20Anthropic%20and%20DataForSEO&project-name=auditseo)

---

## What it does

1. User enters a domain — `example.com`
2. The app runs **6 sequential audit steps** via a server-side API route:
   - Domain rank overview (organic keywords, traffic value, position distribution)
   - Backlink profile (total backlinks, referring domains, domain rank)
   - Top 8 ranked keywords by search volume
   - AI/LLM mention metrics on ChatGPT
   - Top 6 AI mention queries
   - Expert 3-sentence analysis from Claude
3. Results stream into the UI as each step completes

**No API keys are ever sent to the browser.** All Anthropic and DataForSEO calls happen in `/app/api/audit/route.ts` using server-only environment variables.

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/auditseo
cd auditseo
npm install
```

### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
ANTHROPIC_API_KEY=sk-ant-api03-...
DATAFORSEO_MCP_URL=https://mcp.dataforseo.com/mcp
# Optional: Bearer or Basic auth token for DataForSEO MCP
DATAFORSEO_API_TOKEN=
```

### 3. Get your DataForSEO MCP URL

1. Sign up at [dataforseo.com](https://dataforseo.com)
2. Go to **API Access** → **MCP Server**
3. Copy your personal MCP server URL (it may include embedded credentials, e.g. `https://login:password@mcp.dataforseo.com/mcp`)
4. If you have a separate API token, set it as `DATAFORSEO_API_TOKEN`

> **Basic Auth note:** DataForSEO uses HTTP Basic Auth. If your MCP URL doesn't embed credentials, encode `login:password` as Base64 and set:
> `DATAFORSEO_API_TOKEN=Basic <base64_string>`

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### One-click (recommended)

Click the **Deploy with Vercel** button above and fill in the environment variables when prompted.

### Manual

```bash
npm install -g vercel
vercel
```

### Set environment variables in Vercel dashboard

1. Go to your project → **Settings** → **Environment Variables**
2. Add:
   - `ANTHROPIC_API_KEY` — your Anthropic API key
   - `DATAFORSEO_MCP_URL` — your DataForSEO MCP server URL
   - `DATAFORSEO_API_TOKEN` — (optional) auth token

The `vercel.json` in this repo sets the `/api/audit` function timeout to **60 seconds** to accommodate DataForSEO response times.

---

## Architecture

```
Browser
  └─ fetch POST /api/audit  (one call per step)
        └─ app/api/audit/route.ts   ← keys live here only
              └─ Anthropic API
                    └─ DataForSEO MCP (remote server)
```

- **Rate limit:** 10 requests per IP per hour (in-memory)
- **CORS:** same-origin only
- **No external UI libraries** — pure Tailwind + CSS custom properties

---

## Scores

| Score | Formula |
|-------|---------|
| **SEO Score** (0–100) | Domain rank (20) + organic keyword count (20) + traffic value (20) + top-3 positions (20) + referring domains (20) |
| **AI Score** (0–100) | Total mentions (40) + AI search volume (30) + answer/question ratio (30) |
