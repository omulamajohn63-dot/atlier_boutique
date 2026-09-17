# ATELIER Boutique — Commerce Storefront

Full-stack fashion boutique: **Django** REST API + admin (deployed to **Render**)
backed by **Postgres**, and a **React/Vite** storefront (deployed to **Vercel** as a
static SPA). Supabase provides membership/auth + database for your external IDs.

```
Browser ──▶ Vercel (Vite SPA, /assets)
              │  VITE_API_BASE_URL ──▶ Render (Django /api/*)
              │  VITE_SUPABASE_URL ──▶ Supabase (auth, account data)
              └  MPesa callback ─────▶ Render /api/payments/mpesa/callback
```

## Local development

**Backend (Django, port 8000)**
```bash
cd backend
python -m venv ../.venv
# activate venv, then:
pip install -r requirements.txt
cp .env.example .env          # fill in Supabase / payment keys
python manage.py migrate
python manage.py runserver    # http://127.0.0.1:8000
```

**Frontend (Vite + Express dev server, port 3000)**
```bash
cd frontend
npm install
cp .env.example .env.local    # VITE_API_BASE_URL=http://127.0.0.1:8000, VITE_ADMIN_URL=...
npm run dev                   # http://localhost:3000
npm run lint && npm run build # typecheck + production build
npm run test:api              # bundled API integration tests
```

## Deploy the backend to Render

1. Push this repo to GitHub.
2. In Render: **New → Blueprint**, select the repo (or *New → Web Service → Docker*,
   root directory `backend`). A `render.yaml` blueprint is included and deploys the
   `backend/Dockerfile` automatically.
3. Set environment variables in the dashboard (see `.env.example`):
   - `DJANGO_SECRET_KEY`, `DATABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_JWT_ISSUER`,
     `PAYMENT_WEBHOOK_SECRET`, `MPESA_CALLBACK_SECRET`, MPesa Daraja creds, `MPESA_CALLBACK_URL`.
   - `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=<app.onrender.com>`,
     `DJANGO_SECURE_SSL_REDIRECT=True`, `FRONTEND_ORIGIN=<vercel-url>`.
   - Add a managed **Postgres** database and paste its connection string into `DATABASE_URL`.
4. Migrations run on first request if needed (`python manage.py migrate`) — or add it as a
   Render pre-deploy command / run it via `manage.py` once:
   ```bash
   DATABASE_URL="postgres://..." python manage.py migrate
   ```
5. Health check `GET /api/health/` should answer 200. Static admin assets are served by
   WhiteNoise (already `collectstatic`'d in the image).

> First Django admin user: `python manage.py createsuperuser` inside a one-off shell.

## Deploy the frontend to Vercel

1. In Vercel: **Import Project →** repo, framework preset **Vite**, root `frontend`.
2. `vercel.json` (already present) forces `vite build`, output `dist`, and rewrites
   client-side routes to `index.html`.
3. Set project environment variables (`VITE_*` are baked into the bundle at build time):
   - `VITE_API_BASE_URL=https://<backend>.onrender.com`
   - `VITE_ADMIN_URL=https://<backend>.onrender.com/admin/dashboard/`
   - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (public keys only).
4. Add the Vercel URL to the backend's `FRONTEND_ORIGIN` (CORS) and `DJANGO_ALLOWED_HOSTS`.

## Post-deploy checklist

- [ ] `GET https://<backend>/api/health/` returns 200.
- [ ] `https://<frontend>/#/` serves the SPA and deep links (e.g. `/product/…`) refresh correctly.
- [ ] Guest adds to cart → signs in → checkout prefill shows account data.
- [ ] M-Pesa callbacks can reach `https://<backend>/api/payments/mpesa/callback`
      (sandbox first via `MPESA_ENV=sandbox`).
- [ ] CORS: frontend origin is in `FRONTEND_ORIGIN`; cookie-flags work over HTTPS.