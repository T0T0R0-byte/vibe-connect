# VibeConnect

Workshop booking platform. Participants browse workshops, register and pay online. Vendors run their own listings, participants, refunds and reviews from a dashboard. Admins manage accounts.

Next.js 16 App Router, TypeScript, Firebase (Firestore + Auth), Stripe, Tailwind CSS 4.

![Next.js 16.1](https://img.shields.io/badge/Next.js-16.1-000000?logo=nextdotjs&logoColor=white)
![React 19.2](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript 5](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind 4](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![Firebase 12](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=black)
![Stripe 20](https://img.shields.io/badge/Stripe-20-635BFF?logo=stripe&logoColor=white)

## Features

**Participants**

- Workshop catalogue with detail pages and per-workshop registration
- Registration flow including a digital consent form
- Stripe payment sheet for paid workshops
- Profile page, FAQ, and custom workshop requests

**Vendors** (`/vendor`)

- Dashboard with eight views: overview, workshops, participants, custom requests, customization, refunds, reviews, reports
- Refund handling with configurable refund timing and post-refund review restrictions
- Reports view with charts (Recharts) and PDF export (jsPDF)

**Admins** (`/admin`)

- Admin sign-in and registration
- Vendor verification notices

## Routes

| Route | Page |
|---|---|
| `/` | Home, with featured workshops |
| `/workshops` | Workshop catalogue |
| `/register`, `/register/[id]` | Registration entry and per-workshop registration |
| `/vendor` | Vendor dashboard |
| `/admin`, `/admin/login`, `/admin/register` | Admin area |
| `/profile` | Participant profile |
| `/custom-request` | Custom workshop request |
| `/faq` | FAQ |
| `/seed` | Firestore seed helper |

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16.1 (App Router), React 19.2, TypeScript 5 |
| Styling | Tailwind CSS 4, tailwindcss-animate |
| Data and auth | Firebase 12: Firestore and Firebase Auth |
| Payments | Stripe 20 with @stripe/react-stripe-js |
| Motion | Framer Motion, Lenis smooth scroll |
| Charts and export | Recharts, jsPDF |
| Tests | Playwright, end to end |
| Package manager | pnpm workspace |

## Project layout

| Path | Purpose |
|---|---|
| `app/` | Routes and page components |
| `app/models/` | Domain models: `User`, `Workshop`, `Participant`, `Report` |
| `app/controllers/` | `WorkshopController`, `ParticipantController`, `RegistrationController` |
| `app/components/views/VendorDashboard/` | The eight dashboard views |
| `app/api/` | Route handlers: `create-payment-intent`, `refund` |
| `app/context/AuthContext.tsx` | Auth state and session handling |
| `firebase/` | Firebase config plus Firestore action modules (`workshopActions`, `refundActions`, `reportActions`) |
| `firestore.rules` | Security rules with signed-in and owner helpers |
| `firestore.indexes.json` | Composite indexes |
| `lib/` | Stripe client and shared utilities |
| `tests/` | Playwright suites |
| `FirebaseDB-Json files/` | Seed data exports, used with the `/seed` route |

## Getting started

```bash
pnpm install
```

Create `.env.local` in the project root and fill it in:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
STRIPE_TEST_CLIENT_SECRET=
```

The Firebase values come from your own Firebase project settings. The Stripe key is a test key, so payments run in test mode.

```bash
pnpm dev        # development server on http://localhost:3000
pnpm build      # production build
pnpm lint       # eslint
pnpm test:e2e   # Playwright
```

## Tests

Playwright covers five suites: `critical-path`, `integration`, `admin-integration`, `security` and `ui-visuals`. Upload fixtures live in `tests/assets/`.

## Notes

- `lint_log.txt` and `lint_output.txt` are committed lint dumps from an earlier session. Nothing in the build reads them.
- `components/CosmicBackground.tsx` duplicates `app/components/CosmicBackground.tsx`.
- No license file.

## Author

Faraj Farook
