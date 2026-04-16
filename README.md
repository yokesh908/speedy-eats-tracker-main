# Speedy Eats Tracker

This project is a **Vite + React** app with a **Vercel API backend** in `api/` and **Upstash Redis** storage for orders.

## Features

- **Frontend**: React + TypeScript + Vite + Tailwind + shadcn/ui
- **Backend**: Vercel serverless functions in `api/`
- **Database**: Upstash Redis via `@upstash/redis`

## Project Structure

```
speedy-eats-tracker-main/
├── api/                     # Vercel API routes
│   ├── orders.js            # /api/orders
│   ├── orders/[token].js    # /api/orders/:token
│   └── _lib/db.js           # Upstash Redis helpers
├── src/                     # React frontend
├── public/
├── vercel.json
└── package.json
```

## Environment Variables

Create `.env.local` (copy `env.example`) and set:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `VITE_ADMIN_PIN` (optional)

## Local Development

Install deps:

- `npm install`

Run full app (frontend + `api/` routes) locally:

- `npm run dev:full`

If Vercel CLI asks you to authenticate:

- `npx vercel login`

Then test:

- `http://localhost:3000/api/orders`

## Deployment (Vercel)

1. Import the GitHub repo into Vercel.
2. Add env vars in Vercel Project Settings:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
3. Deploy, then verify:
   - `<your-vercel-url>/api/orders`
