# Medical Union Subscription Form
### اتحاد نقابات المهن الطبية — مشروع علاج الأعضاء وأسرهم

A React web application for managing medical union subscription forms for Egyptian medical syndicates. Members fill out a subscription form, upload a payment receipt, and track their application status through a dashboard.

---

## Features

- **Authentication** — Google OAuth and email/password sign-in with Firebase Auth
- **Smart OCR** — Automatic data extraction from Egyptian National ID cards (front & back) and Syndicate ID cards using Gemini 2.5 Flash Lite via Firebase AI Logic
- **Subscription Form** — Multi-section A4-printable form covering member details, beneficiaries, and declaration
- **Fee Calculator** — Real-time fee summary based on member data
- **Receipt Upload** — Camera or file upload for payment receipt with AI-assisted validation
- **Application Tracking** — Waiting page and dashboard for monitoring submission status
- **Fully RTL** — Arabic-first UI with Cairo font

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS 4 |
| Routing | React Router v7 |
| Backend / Auth | Firebase 12 (Auth, Firestore, Storage) |
| AI / OCR | Firebase AI Logic — Gemini 2.5 Flash Lite |
| OCR fallback | Tesseract.js 7 |

## App Flow

```
/ (Landing + Auth)
    └── /form        — Subscription form (protected)
    └── /receipt     — Payment receipt upload (protected)
    └── /waiting     — Processing status (protected)
    └── /dashboard   — Submission dashboard (protected)
```

Unauthenticated users are redirected to `/` from any protected route.

## Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with **Authentication**, **Firestore**, **Storage**, and **AI Logic** enabled

### Setup

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root with your Firebase config:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

3. In the Firebase Console, enable **AI Logic** under Build → AI Logic to activate Gemini-powered OCR.

4. Start the development server:

```bash
npm run dev
```

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
├── auth/               # Auth page (Google + email sign-in)
├── components/
│   ├── form/           # MemberSection, BeneficiaryTable, DeclarationSection, FeeSummaryPanel
│   └── shared/         # Reusable inputs, modals, progress stepper
├── context/            # AuthContext, FormContext
├── hooks/              # useSubmissionStatus
├── pages/              # LandingPage, FormPage, ReceiptPage, WaitingPage, DashboardPage
├── services/           # OcrService (Gemini), CalculationService
└── utils/              # validateForm, validateReceiptImage
```

## OCR Document Support

The `OcrService` extracts structured data from three document types:

| Document | Extracted Fields |
|---|---|
| National ID — Front | Name, National ID number, birth year, governorate, address |
| National ID — Back | Gender, religion, marital status |
| Syndicate ID | Registration number, sub-syndicate, registration year, syndicate type |
| Beneficiary document | Name (first 3 words), National ID, birth year |
