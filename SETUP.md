# Setup — GitHub to live site

Do these in order. Step 1 is not optional.

## 1. Roll your Stripe secret key

Your old key was published in plaintext on your live domain. Stripe Dashboard →
Developers → API keys → roll the secret key. Use the new one everywhere below.

## 2. Put the code on GitHub

```bash
cd pcc-mastery
git init
git add .
git commit -m "Rebuild: real routing, Vite build, SEO, analytics"
```

Create an empty repo at github.com/new (name it `pcc-mastery`, **private**, no README).
Then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/pcc-mastery.git
git branch -M main
git push -u origin main
```

`.gitignore` already excludes `node_modules`, `dist`, and `.env` files. Confirm with
`git status` before your first commit that no `.env` file is listed.

## 3. Connect Netlify to the repo

Netlify → your existing pccmastery site → Site configuration → Build & deploy →
**Link to a Git repository**. Pick the repo you just pushed.

Settings should read:
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

If the UI has an old value in Functions directory, clear it so `netlify.toml` wins.

## 4. Environment variables

Site configuration → Environment variables. Add all of these:

| Key | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | from Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | `pccmastery.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `pccmastery` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `pccmastery.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | from Firebase console |
| `VITE_FIREBASE_APP_ID` | from Firebase console |
| `VITE_STRIPE_PUBLISHABLE_KEY` | your `pk_live_...` |
| `VITE_GA_ID` | `AW-17793251865` |
| `STRIPE_SECRET_KEY` | your **new** `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | from step 5 |
| `FIREBASE_SERVICE_ACCOUNT` | full service-account JSON, one line |
| `SITE_URL` | `https://pccmastery.com` |

Firebase service account: Firebase Console → Project settings → Service accounts →
Generate new private key. Paste the entire file contents as the value.

## 5. Stripe webhook

Stripe → Developers → Webhooks → Add endpoint:
- URL: `https://pccmastery.com/.netlify/functions/stripe-webhook`
- Event: `checkout.session.completed`

Copy the signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`, then redeploy.

## 6. Firestore security rules

Firebase Console → Firestore → Rules. Users should read their own record but never
write it — only your webhook (via Admin SDK) grants access:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
  }
}
```

Without this, a user could grant themselves premium from the browser console.

## 7. Verify

- `https://pccmastery.com/pricing` loads directly on a hard refresh (not just via clicking)
- `https://pccmastery.com/nonsense` shows the 404 page
- `https://pccmastery.com/.netlify/functions/create-checkout` returns JSON `405`, not HTML
- Buy a plan with a real card; `/success` flips to unlocked within a few seconds
- Stripe → Webhooks shows a `200` response for the event
