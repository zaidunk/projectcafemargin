---
title: CafeMargin Backend
emoji: ☕
colorFrom: brown
colorTo: amber
sdk: docker
app_port: 7860
pinned: false
short_description: CafeMargin Analytics API - PT Xolvon Kehidupan Cerdas Abadi
---

# CafeMargin Analytics API

FastAPI backend for CafeMargin — Strategic Data Analytics Platform for Cafes.

**Required environment variables (set in HF Space settings):**
- `DATABASE_URL` — PostgreSQL connection string from Supabase
- `SECRET_KEY` — Strong random string for JWT signing
- `ALLOWED_ORIGINS` — `https://cafe-margin.web.app,https://cafe-margin.firebaseapp.com`
- `SUPABASE_URL` — Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `SUPABASE_BUCKET_UPLOADS` — `cafemargin-uploads`
- `SUPABASE_BUCKET_REPORTS` — `cafemargin-reports`
