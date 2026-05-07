# goldbullsfx

Telegram signal → Web app feed for XAUUSD trading signals.

## Flow
1. Public channel posts signal
2. You forward it to your bot (1 tap)
3. Bot parses and saves to Supabase
4. App feed updates instantly

## Setup
See each folder's instructions below.

### Backend
```bash
cd backend
npm install
cp ../.env.example .env   # fill in your keys
node server.js
```

### Frontend
Open `frontend/index.html` in browser, or deploy to Netlify (drag & drop the frontend folder).

## Deploy
- Backend → Railway.app (free)
- Frontend → Netlify.com (free, drag & drop)
