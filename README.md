<p align="center">
  <img src="./public/hawklife-hawk.png" alt="HawkLife logo" width="112" />
</p>

<h1 align="center">HawkLife</h1>

<p align="center">
  Digital student life platform for St. Joseph's Preparatory School
</p>

<p align="center">
  HawkLife is built solely for the use of St. Joseph's Preparatory School.
</p>

## Overview

HawkLife is the internal platform for student life, clubs, flex attendance, announcements, school activities, and organization across St. Joseph's Preparatory School.

It is designed to give students, faculty, and administrators one polished place to manage the day-to-day rhythm of school life:

- club discovery and membership
- announcements and school updates
- flex attendance and QR workflows
- student leadership tools
- school calendars, applications, and voting

This codebase is not intended to be a generic public SaaS product. It is a school-specific platform tailored to the workflows, identity, and operational needs of St. Joseph's Prep.

## Core Product Areas

- `Club Directory`: discover clubs, view club pages, and manage membership.
- `Announcements`: share updates across the school and club ecosystem.
- `Flex Attendance`: support check-in and attendance workflows.
- `Applications`: manage student club applications and charter flows.
- `Calendar + Events`: centralize school and club scheduling.
- `Admin + Faculty Tools`: give staff the controls they need without cluttering the student experience.

## Tech Stack

- `Framework`: Next.js App Router
- `Language`: TypeScript
- `Database`: PostgreSQL with Prisma ORM
- `Auth`: NextAuth v5 with Google OAuth
- `Styling`: Tailwind CSS
- `Animation`: Framer Motion
- `External Integrations`: Airtable for NHS hours workflows

## Quick Start

```bash
# Install dependencies
npm install

# Validate environment configuration
npm run check:env

# Push the current Prisma schema
npm run db:push

# Seed starter data if needed
npm run db:seed

# Start the app
npm run dev
```

Open [https://hawklife.vercel.app](https://hawklife.vercel.app) for production or `http://localhost:3000` for local development.

## Environment Variables

Required variables:

- `DATABASE_URL`: Supabase pooled connection string for the app
- `DIRECT_URL`: Supabase direct connection string for schema changes
- `NEXTAUTH_SECRET`: secret used for authentication sessions
- `NEXTAUTH_URL`: deployment URL, typically `https://hawklife.vercel.app`
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `AIRTABLE_API_KEY`: Airtable API token for NHS sync
- `AIRTABLE_BASE_ID`: Airtable base ID
- `AIRTABLE_TABLE`: Airtable table name

Notes:

- Next.js reads `.env.local`, while Prisma CLI reads `.env` by default.
- Put shared local database values in `.env` so Prisma and the app are aligned.
- Run `npm run check:env` before launching if anything seems off.

## Database Commands

```bash
# Push schema changes
npm run db:push

# Create and apply a local development migration
npm run db:migrate

# Apply a checked-in SQL migration directly
npm run db:apply-sql -- prisma/migrations/<migration-folder>/migration.sql

# Open Prisma Studio
npm run db:studio
```

## Deployment

HawkLife is deployed on Vercel and uses Supabase Postgres in production.

Recommended deployment flow:

1. Update code.
2. Apply required Prisma schema changes to the correct production database.
3. Redeploy on Vercel.
4. Verify auth, flex attendance, clubs, and admin workflows.

## Domain Role Mapping

| Email domain | Default role |
| --- | --- |
| `@sjprep.org` | Faculty |
| `@sjprephawks.org` | Student |

## Product Positioning

HawkLife aims to feel modern, fast, and school-native rather than like a generic student portal. The goal is to give St. Joseph's Prep a unified digital layer for student life with cleaner UX, stronger organization, and better day-to-day operational flow.

## Ownership

This repository, brand, and platform experience are intended exclusively for St. Joseph's Preparatory School.
