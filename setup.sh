#!/bin/bash
echo "PrepLife Setup"
echo "=============="
echo ""

if [ ! -f ".env" ]; then
  cp .env.example .env
  echo "✓ Created .env from .env.example"
  echo ""
  echo "⚠️  Before continuing, open .env and fill in:"
  echo "   DATABASE_URL  — Supabase pooled connection string"
  echo "   DIRECT_URL    — Supabase direct connection string"
  echo "   NEXTAUTH_SECRET — run: openssl rand -base64 32"
  echo "   NEXTAUTH_URL  — http://preplife-v3.vercel.app"
  echo "   GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET"
  echo "   AIRTABLE_API_KEY"
  echo ""
  echo "Then run: npm install && npm run db:migrate && npm run db:seed && npm run dev"
else
  echo "✓ .env already exists"
  npm install
  echo ""
  echo "Running database migration..."
  npm run db:migrate
  echo ""
  echo "Seeding clubs and changelog..."
  npm run db:seed
  echo ""
  echo "✅ Done! Run: npm run dev"
fi
