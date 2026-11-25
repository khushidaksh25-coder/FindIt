# FindIt — Community Lost & Found

FindIt is a full-stack Lost & Found app for reporting lost belongings, posting found items, and searching community reports. It uses a black-and-yellow React interface, an Express API, MongoDB, and JWT authentication.

## Features

- Account signup and login with hashed passwords and expiring JWTs
- Session persistence across page refreshes and explicit logout
- Create Lost and Found reports; browse public community reports
- Search by item, description, category, or location
- Filter reports by status and category
- Dashboard counts for all, Lost, Found, and your own reports
- Owner-only edit and delete controls, enforced by the API as well as the UI
- Input validation, request-size limits, login/signup rate limiting, and Helmet security headers
- Contact emails are excluded from public item reads
- Responsive layout for mobile, tablet, and desktop

## Project layout

```text
backend/
  config/           MongoDB connection
  controllers/      Auth and item request handlers
  middleware/       JWT authentication
  models/           User and item schemas
  routes/           Express API routes
  tests/            Node test runner tests
  utils/            Request validation
frontend/
  src/components/   Login and signup screens
  src/services/     API, auth, and item requests
  src/              React app and black/yellow styling
```

## Requirements

- Node.js 20.19+ (Node.js 22 LTS recommended)
- npm
- MongoDB Atlas database (or a local MongoDB instance)

## Local setup

1. Copy `backend/.env.example` to `backend/.env`.
2. Set `MONGO_URI` to your MongoDB connection string. Set `JWT_SECRET` to a private random value of at least 32 characters. Do not commit `backend/.env`.
3. Configure the database user's permissions and Atlas Network Access for your development/deployment environment. Avoid allowing unrestricted database access.
4. Install and start the backend:

   ```bash
   cd backend
   npm ci
   npm run dev
   ```

5. In another terminal, copy `frontend/.env.example` to `frontend/.env.local`. Set `VITE_API_URL` to the backend API base URL, including `/api`.
6. Install and start the frontend:

   ```bash
   cd frontend
   npm ci
   npm run dev
   ```

The local frontend is served at `http://localhost:5173`; the API defaults to port `4000`. Backend CORS uses `CORS_ORIGINS` (comma-separated exact origins), defaulting to the Vite local origin. Restart Vite after changing frontend environment variables.

## Environment variables

### Backend

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. Keep it private. |
| `JWT_SECRET` | Yes | Private signing secret, at least 32 characters. Never put it in frontend variables. |
| `PORT` | No | API port; Render supplies this automatically. Defaults to `4000`. |
| `CORS_ORIGINS` | No | Comma-separated allowed browser origins. Local default is `http://localhost:5173`. |

### Frontend

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | No | API base URL including `/api`; defaults to `http://localhost:4000/api`. This value is public, so it must never contain a secret. |

## API overview

| Method | Path | Access |
| --- | --- | --- |
| `POST` | `/api/users/register` | Public, rate limited |
| `POST` | `/api/users/login` | Public, rate limited |
| `GET` | `/api/users/profile` | JWT required |
| `GET` | `/api/items` | Public; contact emails are omitted |
| `GET` | `/api/items/:id` | Public; validates the MongoDB ID |
| `GET` | `/api/items/:id/private` | JWT required; owner-only private details for editing |
| `POST` | `/api/items` | JWT required; owner set from the verified token |
| `PUT` | `/api/items/:id` | JWT required; owner scoped |
| `DELETE` | `/api/items/:id` | JWT required; owner scoped |
| `GET` | `/api/health` | Public health check |

Protected frontend requests send `Authorization: Bearer <token>`. The API does not trust a submitted owner ID; the server assigns ownership from the verified JWT and scopes modifications by both report ID and owner ID.

## Tests and checks

```bash
cd backend
npm test

cd ../frontend
npm run lint
npm run build
```

Backend tests cover report input validation, health and error responses, invalid IDs, malformed authentication payloads, and rejection of unauthenticated writes. They do not create or alter Atlas records. A full account-to-CRUD acceptance test should be run against a separate staging database before a public launch; never run destructive tests against production data.

## Deploy frontend to Vercel

1. Import the repository in Vercel and set the project **Root Directory** to `frontend`.
2. Add `VITE_API_URL` with the deployed Render API URL and `/api` suffix, for example `https://findit-api.onrender.com/api`.
3. Deploy. `frontend/vercel.json` configures the Vite build output and SPA fallback.
4. Add the exact Vercel origin (no path) to the Render service's `CORS_ORIGINS`, then redeploy the backend.

## Deploy backend to Render

1. Create a Render Web Service using the root `render.yaml` blueprint.
2. Set `MONGO_URI` to the production database connection string and set `CORS_ORIGINS` to the exact deployed Vercel origin(s).
3. Render generates `JWT_SECRET` from the blueprint. Keep it in Render's environment settings only.
4. Wait for `/api/health` to pass, then set the Vercel `VITE_API_URL` to the Render service's `/api` URL and redeploy the frontend.
5. Confirm the production MongoDB user is least-privileged and Atlas network access is restricted appropriately.

## Important data and security notes

- Frontend JWT storage currently uses `localStorage`; a successful XSS attack could expose that token. Keep dependencies updated, avoid unsafe HTML rendering, and consider moving to secure, HttpOnly, SameSite cookies if the authentication design is upgraded.
- Existing legacy reports without a `user` owner remain visible in community reports but cannot be edited or deleted by anyone through the owner-scoped API. Review and migrate these records manually in a backup/staging environment if ownership can be established; do not assign them to an arbitrary account.
- Dashboard counts are computed from the currently loaded community reports. For a very large database, add server-side pagination and aggregation before scaling.
- Before launch, run an end-to-end account and CRUD checklist against staging, verify Vercel/Render environment variables, and review `npm audit` output for dependency advisories.
