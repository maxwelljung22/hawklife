# PrepLife — St. Joseph's Preparatory School

Student activity platform built with Next.js 14, Prisma, NextAuth v5, and Tailwind CSS.

## Quick Start

```bash
# 1. Install
npm install

# 2. Copy env file and fill in values
cp .env.example .env

# 2.5 Validate that you replaced every placeholder
npm run check:env

# 3. Push database schema
npm run db:migrate

# 4. Seed with starter clubs
npm run db:seed

# 5. Run dev server
npm run dev
```

Visit https://preplife-v3.vercel.app

## Deployment

See the deployment guide in the conversation for step-by-step Vercel setup.

**Required env vars:**
- `DATABASE_URL` — Supabase pooled connection string (with `?pgbouncer=true`)
- `DIRECT_URL` — Supabase direct connection string
- `NEXTAUTH_SECRET` — run `openssl rand -base64 32`
- `NEXTAUTH_URL` — `https://preplife-v3.vercel.app`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
- `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE` — NHS integration

Next.js also reads `.env.local`, but Prisma CLI reads `.env` by default. Put shared local secrets in `.env` so both the app and database commands use the same values.

If `npm run check:env` fails, you still have example placeholder values in `.env`.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: NextAuth v5 beta + Google OAuth
- **Database**: PostgreSQL + Prisma ORM
- **Styling**: Tailwind CSS + Framer Motion
- **Fonts**: Fraunces (display) + DM Sans (body) + DM Mono
- **External**: Airtable (NHS hours sync)

## Domain → Role Mapping

| Email Domain | Role |
|---|---|
| `@sjprep.org` | Faculty |
| `@sjprephawks.org` | Student |
