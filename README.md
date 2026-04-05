# Musics — Music Discovery Hub

Production-ready music exploration app built with **React + Vite + Tailwind**, backed by **Supabase (PostgreSQL + Auth + Storage)**.

## Setup

1. Create a Supabase project
2. In Supabase SQL editor, run `supabase/schema.sql`
3. (Optional) Run `supabase/seed.sql`
4. Create `.env` from `.env.example` and set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SUPABASE_STORAGE_BUCKET` (optional, default `media`)

## Admin access

- Create a Supabase Auth user (email/password)
- Mark the user as admin:
  - `update public.profiles set is_admin = true where id = '<auth.uid>';`
- Visit `/admin/login`

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## If you see: “must be owner of table objects”

Some environments don’t allow altering `storage.objects` from your current SQL role.

- The app still works with image `source: "url"` (external URLs)
- For uploads (`source: "upload"`), configure:
  - Storage bucket `media` (public)
  - RLS policies on `storage.objects` matching the “Storage” block in `supabase/schema.sql`

# audiodb
