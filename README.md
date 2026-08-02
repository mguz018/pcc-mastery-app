# PCC Mastery

Vite + React + React Router. Deployed on Netlify with serverless functions for Stripe.

## Routes

| URL | Page |
|---|---|
| `/` | Landing |
| `/pricing` | Plans + checkout |
| `/practice` | Mixed practice |
| `/practice/:competency` | Single competency (e.g. `/practice/ethical-practice`) |
| `/results` | Session score breakdown |
| `/dashboard` | Signed-in home |
| `/login` | Sign in / register / password reset |
| `/prep-guide` | Exam format guide (indexed for SEO) |
| `/about` | About & mentoring |
| `/success` | Post-payment activation |
| anything else | 404 |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in the VITE_ values
npm run dev                  # http://localhost:5173
```

To test Stripe functions locally you need the Netlify CLI:

```bash
npm install -g netlify-cli
netlify dev                  # http://localhost:8888 — functions work here
```

## Environment variables

**Client (safe to expose, set in Netlify UI + `.env.local`):**
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`, `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_GA_ID`

**Server only — Netlify UI, never committed:**
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `FIREBASE_SERVICE_ACCOUNT`, `SITE_URL`

## Deploying

Push to GitHub; Netlify builds on every push. Build command `npm run build`, publish directory `dist`.

## Adding questions

Edit `src/data/questions.json`. Each entry:

```json
{
  "id": 216,
  "competency": 1,
  "isPremium": true,
  "scenario": "...",
  "question": "Which action is MOST and LEAST aligned with PCC-level coaching?",
  "options": ["...", "...", "...", "..."],
  "best": 1,
  "worst": 2,
  "explanation": { "best": "...", "worst": "..." },
  "deeperInsight": "..."
}
```

`best` and `worst` are zero-based indexes into `options`. Commit and push — that's the whole deploy.

## Changing prices

Price IDs live in **two** places and must match:
- `src/pages/Pricing.jsx` → `PLANS`
- `netlify/functions/create-checkout.js` → `PRICE_DAYS`

The server map governs actual access length. The client value is display only.
