# Omoola Supermarket Stores

A full-stack e-commerce storefront for Omoola Supermarket Stores, built with **React + Vite** (frontend) and **Express** (backend API), deployed on **Vercel** as a serverless function, with **Firebase** for auth/database and **Paystack** for payments.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v7, TailwindCSS, shadcn/ui |
| Backend | Express 5 (Vercel Serverless Function) |
| Auth | Firebase Auth (email + Google) |
| Database | Firestore (Firebase Admin SDK) |
| Payments | Paystack |
| Email | Brevo |
| Images | Cloudinary |

---

## Local Development

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
Copy `.env.example` to `.env` and fill in all values:
```bash
cp .env.example .env
```

Local development uses one shared root `.env` file for both the Vite frontend and the backend API. The backend server explicitly loads the root `.env`, including when it is started from the `functions/` directory.

See the [Environment Variables](#environment-variables) section below for details on each variable.

### 3. Run the app
This starts both the Firebase Functions API server and the Vite dev server concurrently:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- API: proxied through the Vite dev server at `http://localhost:3000/api/*`

> The Vite dev server proxies all `/api/*` requests to `:3001` automatically.

### Other Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start both frontend and backend in watch mode |
| `npm run dev:web` | Start only the Vite frontend |
| `npm run dev:api` | Start only the Express API server |
| `npm run build` | Build the frontend for production |
| `npm run lint` | TypeScript type check |
| `npm run seed` | Seed sample products into Firestore |
| `npm run make-admin` | Promote a Firebase user to admin role |
| `npm run doctor` | Check environment variable configuration |

---

## Environment Variables

All variables must be added to your local root `.env` file for development. For production, add the same values to the platform that runs that part of the app:

- Frontend values: Vercel project environment variables
- Backend/API secrets: Firebase Functions secrets and any deployment-specific environment configuration

### Firebase (Frontend)
These are embedded into the client bundle by Vite and are safe to expose.

| Variable | Description |
|---|---|
| `VITE_FIREBASE_API_KEY` | Firebase project API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |

### Firebase Admin SDK (Backend — Keep Secret)
| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Same as project ID above |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key. In Vercel, paste the raw key with **real newlines** (not `\n`). |

### App Configuration
| Variable | Description |
|---|---|
| `CORS_ORIGINS` | Comma-separated list of allowed origins, e.g. `https://yourapp.vercel.app` |
| `APP_URL` | Canonical public URL of the app, e.g. `https://yourapp.vercel.app` |

### Paystack
| Variable | Description |
|---|---|
| `PAYSTACK_PUBLIC_KEY` | Paystack public key (used on frontend if needed) |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (**backend only — never expose to frontend**) |
| `PAYSTACK_WEBHOOK_SECRET` | Optional explicit webhook secret. If omitted, the backend falls back to `PAYSTACK_SECRET_KEY`. |

### Email
| Variable | Description |
|---|---|
| `BREVO_API_KEY` | Brevo API key for transactional emails |
| `EMAIL_FROM` | Sender address e.g. `Store Name <orders@yourdomain.com>` |
| `EMAIL_FROM_NAME` | Optional fallback display name for transactional emails |

### Cloudinary
| Variable | Description |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## Deployment (Vercel)

This project is configured as a **Vite SPA frontend** with a **Firebase Functions backend API**.

### How it works
- `vercel.json` rewrites `/api/*` requests to the deployed Firebase Function
- All other routes serve `index.html` (SPA client-side routing)

### Steps
1. Push to GitHub
2. Import the repo in Vercel
3. Add frontend `VITE_*` variables to Vercel
4. Add backend secrets to Firebase Functions
5. Deploy

> **Important:** `FIREBASE_PRIVATE_KEY` must be pasted with **real newlines** in the Vercel dashboard, not the `\n` escape sequence. Copy the raw key text from your service account JSON file.

---

## Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── admin/        # Admin dashboard components
│   │   ├── layout/       # Header, footer
│   │   ├── providers/    # React context providers (auth, cart)
│   │   ├── store/        # Product card, cart drawer, page clients
│   │   └── ui/           # shadcn/ui base components
│   ├── hooks/            # Custom React hooks
│   ├── lib/
│   │   ├── firebase/     # Admin SDK + client SDK setup
│   │   ├── constants.ts  # Business constants (name, phone, etc.)
│   │   ├── email.ts      # Brevo email sender
│   │   ├── schemas/      # Zod validation schemas
│   │   └── utils.ts      # Utility helpers
│   ├── spa/
│   │   ├── App.tsx       # Root router
│   │   └── pages/        # Page-level components
│   └── types/            # TypeScript type definitions
├── functions/
│   └── src/api/          # Express API served via Firebase Functions
├── firebase/
│   └── firestore.rules   # Firestore security rules
├── scripts/              # CLI scripts (seed, make-admin, doctor)
├── .env.example          # Environment variable template
└── vercel.json           # Vercel routing configuration
```

---

## Making a User Admin

```bash
npm run make-admin -- user@example.com
```

This sets the `role: "admin"` field on the user's Firestore document, giving them access to `/admin/*` routes.

---

## License

Private. All rights reserved — Omoola Supermarket Stores.
