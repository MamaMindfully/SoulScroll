# SoulScroll

**SoulScroll is an AI-powered journaling and reflection platform, built with Vite, React, Express, TypeScript, and OpenAI.**

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Requirements](#requirements)
- [Setup](#setup)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Build & Production](#build--production)
- [Testing](#testing)
- [Deployment](#deployment)
- [Security Best Practices](#security-best-practices)
- [Folder Structure](#folder-structure)
- [License](#license)

---

## Project Overview

SoulScroll helps users track thoughts, emotions, and insights, powered by AI and real-time feedback, for deep personal growth.

---

## Features

- AI-assisted journaling (OpenAI)
- Secure authentication and encryption
- Stripe-powered billing
- Real-time push notifications (VAPID/Service Worker)
- PWA: installable, offline support
- Modern analytics and admin dashboards
- Automated daily prompts and reminders
- Full TypeScript/React/Vite stack
- End-to-end tests (Cypress)

---

## Requirements

- **Node.js** v18.17.0 or higher
- **npm** v9.0.0 or higher
- **PostgreSQL** 13+
- **Redis** 6+
- Stripe, OpenAI, Sentry, and Discord (optional for prod monitoring)

---

## Setup

1. **Clone the repo:**
   ```sh
   git clone https://github.com/<YOUR_ORG>/soulscroll.git
   cd soulscroll
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Setup environment variables:**
   - Copy `.env.example` to `.env`:
     ```sh
     cp .env.example .env
     ```
   - Fill in all required secrets and keys in `.env`.

---

## Environment Variables

**You MUST provide every variable listed in `.env.example` for full functionality.**

**Key Variables:**
- `DATABASE_URL`
- `NODE_ENV`
- `PORT`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `REDIS_URL`
- ...and others.  
See `.env.example` for the full list and sample values.

**Validation:**  
The server will fail to boot if any critical env var is missing or malformed.

---

## Development

- **Run the frontend (Vite + React):**
  ```sh
  npm run dev:client
  ```
- **Run the backend (Express):**
  ```sh
  npm run dev:server
  ```
- Use [nodemon](https://nodemon.io/) or [ts-node-dev](https://www.npmjs.com/package/ts-node-dev) for hot reload if desired.

---

## Build & Production

- **Build frontend:**
  ```sh
  npm run build:client
  ```
- **Start production server:**
  ```sh
  npm start
  ```
- The server will serve static files from the built frontend (`/client/dist`).

---

## Testing

- **Client tests:**
  ```sh
  npm run test:client
  ```
- **Server tests:** *(add as needed)*

- **End-to-end tests (Cypress):**
  ```sh
  cd cypress
  npx cypress open
  ```

---

## Deployment

- **Containerized (Recommended):**
  - Use the provided `Dockerfile`.
  - See cloud docs (Railway, Fly.io, AWS, GCP, etc) for env var and port settings.

- **Manual:**
  1. Ensure all secrets are set in the environment.
  2. Run:
     ```sh
     npm run build
     npm start
     ```

---

## Security Best Practices

- Always use HTTPS in production.
- Never commit `.env` or real secrets to version control.
- Use [helmet](https://helmetjs.github.io/) and strict CORS (see server config).
- Run `npm audit` and `npm update` regularly.
- Only expose env vars to the frontend with the `VITE_` prefix.

---

## Folder Structure

```
soulscroll/
│
├── client/           # Frontend (React, Vite, PWA assets)
│   ├── public/       # Static assets, manifest, service worker
│   └── src/          # Frontend source code
├── server/           # Backend logic, API, integrations
├── shared/           # Shared types and code
├── database/         # ORM, migrations, seeds
├── cypress/          # E2E test suites
├── .env.example      # Environment variable template
├── .env              # (Local, never commit)
├── package.json
├── Dockerfile
├── README.md
└── ...
```

---

## License

MIT © <YOUR NAME/ORG>

---

# End
