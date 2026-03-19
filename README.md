# Service Marketplace Website

Clean MVP marketplace/classifieds platform built with React, Vite, Express, Socket.IO, PostgreSQL, and Prisma.

## MVP scope

Implemented:

- Email/password register and login
- JWT-protected app routes
- Public marketplace feed and search
- Categories, post CRUD, slugged post URLs, and local post image uploads
- Public user profiles
- One-to-one real-time chat with PostgreSQL persistence
- Admin dashboard with moderation basics
- Local PostgreSQL helper scripts for Windows development

Intentionally deferred:

- Google OAuth completion
- Phone verification
- Payments and commissions
- Chat approval rules
- Notifications
- Advanced moderation workflows

## Tech stack

- Frontend: React, Vite, React Router
- Backend: Node.js, Express, Socket.IO
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT

## Project structure

```text
client/
  src/
    app/
    components/
    features/
      admin/
      auth/
      chat/
      posts/
      profile/
    lib/

server/
  prisma/
    migrations/
    schema.prisma
    seed.js
  src/
    config/
    db/
    middlewares/
    modules/
      admin/
      auth/
      categories/
      conversations/
      posts/
      users/
    routes/
    services/
    sockets/
    utils/

scripts/
  start-local-db.ps1
  stop-local-db.ps1
  reset-local-db.ps1
```

## Prerequisites

- Node.js 24+
- npm 11+
- PostgreSQL 17+ binaries available locally
- PowerShell for the bundled Windows DB scripts

## Environment files

`.env` files are local-only and should not be committed. The tracked config story is:

- [server/.env.example](C:/Users/OmarEE/Desktop/Projects/ServiceMarketPlaceWebSite/server/.env.example)
- [client/.env.example](C:/Users/OmarEE/Desktop/Projects/ServiceMarketPlaceWebSite/client/.env.example)

Create local files by copying the examples:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

### `server/.env`

```env
NODE_ENV=development
PORT=4000
SERVER_URL=http://localhost:4000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres@localhost:5433/service_marketplace?schema=public
JWT_SECRET=change-this-to-a-long-random-secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback
UPLOADS_DIR=server/uploads
UPLOADS_URL_PATH=/uploads
POST_IMAGE_MAX_SIZE_MB=5
SEED_ADMIN_NAME=Local Admin
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=Admin12345!
```

### `client/.env`

```env
VITE_API_URL=http://localhost:4000/api
```

## Install dependencies

From the project root:

```powershell
npm install
```

## Database and Prisma setup

### Option A: bundled local PostgreSQL helper

The PowerShell scripts are optional convenience helpers for Windows. The app itself only depends on `DATABASE_URL`.

Start the local project database:

```powershell
npm run db:start
```

Stop it:

```powershell
npm run db:stop
```

Reset it completely:

```powershell
npm run db:reset
```

If PostgreSQL is installed elsewhere, set:

```powershell
$env:POSTGRES_BIN = 'C:\Program Files\PostgreSQL\17\bin'
```

### Option B: your own PostgreSQL instance

Point `DATABASE_URL` at any PostgreSQL database and use the normal Prisma commands below.

### Prisma workflow

Generate the Prisma client:

```powershell
npm run db:generate
```

Apply migrations:

```powershell
npm run db:migrate
```

Seed categories and the local admin user:

```powershell
npm run db:seed
```

Open Prisma Studio:

```powershell
npm run db:studio
```

## Run locally

Start frontend and backend together:

```powershell
npm run dev
```

Or separately:

```powershell
npm run dev:server
npm run dev:client
```

Available URLs:

- Frontend: [http://localhost:5173](http://localhost:5173)
- API root: [http://localhost:4000/api](http://localhost:4000/api)
- Health check: [http://localhost:4000/api/health](http://localhost:4000/api/health)
- Admin dashboard: [http://localhost:5173/admin](http://localhost:5173/admin)

## Useful scripts

- `npm run dev`
- `npm run dev:server`
- `npm run dev:client`
- `npm run build`
- `npm run lint`
- `npm run db:start`
- `npm run db:stop`
- `npm run db:reset`
- `npm run db:generate`
- `npm run db:migrate`
- `npm run db:seed`
- `npm run db:studio`

## Default local admin

If you keep the example seed values and run `npm run db:seed`, you can log in with:

- Email: `admin@example.com`
- Password: `Admin12345!`

Change these in your local `server/.env` before using this outside a throwaway local setup.

## Route protection summary

Backend:

- `/api/auth/register` and `/api/auth/login` are public
- `/api/auth/me` requires a valid active user
- `/api/posts/mine`, create, update, and delete require a valid active user
- Post edits and deletes are owner-only unless the caller is admin
- `/api/users/me` profile update requires a valid active user
- `/api/conversations/*` requires auth and participant checks
- `/api/admin/*` requires both auth and admin role

Frontend:

- Protected routes use [RouteGuards.jsx](C:/Users/OmarEE/Desktop/Projects/ServiceMarketPlaceWebSite/client/src/app/router/RouteGuards.jsx)
- Admin pages only render for authenticated admin users
- Chat sockets require a valid authenticated user token and re-check account status during message actions

Moderation behavior:

- Blocked users cannot continue normal protected API use
- Blocked users cannot log in again
- Blocked users are hidden from public profile views
- Public posts are only shown when both the post and the seller are publicly visible
- Hidden and archived posts disappear from public feeds immediately

## Current API surface

General:

- `GET /api`
- `GET /api/health`

Auth:

- `GET /api/auth/config`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Categories:

- `GET /api/categories`

Users:

- `GET /api/users/:userId`
- `PATCH /api/users/me`

Posts:

- `GET /api/posts`
- `GET /api/posts/mine`
- `GET /api/posts/:identifier`
- `POST /api/posts` (`multipart/form-data` supported for image uploads)
- `PATCH /api/posts/:identifier` (`multipart/form-data` supported for image uploads)
- `DELETE /api/posts/:identifier`

Chat:

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:conversationId`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`

Admin:

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/posts`
- `PATCH /api/admin/posts/:postId`

## Local verification checklist

Run these before handoff:

```powershell
npm run lint
npm run build
```

Manual checks:

1. Register a normal user and create a post.
2. Confirm the post appears in `/browse` and on the home page.
3. Open the post details page and seller profile.
4. Open chat from a post or profile using a second user.
5. Confirm messages deliver live in both browser sessions.
6. Log in as the seeded admin and open `/admin`.
7. Hide a post and confirm it disappears publicly.
8. Block a user and confirm their protected access and public profile visibility are revoked.

## Production deployment notes

### Backend on a VPS/server

- Run the Express/Socket.IO app behind a reverse proxy such as Nginx.
- Use `npm install --omit=dev` on the server.
- Run Prisma migrations with:
  ```bash
  npm run db:generate --workspace server
  npm run db:deploy --workspace server
  ```
- Start the backend with a process manager such as `pm2` or `systemd`.
- Set `NODE_ENV=production`.
- Set strong production values for `JWT_SECRET`, `DATABASE_URL`, `SERVER_URL`, and `CLIENT_URL`.
- Keep this app on its own internal port with `PORT`, even if another app already exists on the same VPS.
- Keep `UPLOADS_DIR` on persistent disk storage, for example `/var/www/service-marketplace/uploads`.
- Keep `UPLOADS_URL_PATH` stable, for example `/uploads`, so Nginx can proxy or serve it consistently.

### Frontend with a domain

- Build the frontend with:
  ```bash
  npm run build
  ```
- Deploy the built `client/dist` output to a static host or web server.
- Set `VITE_API_URL` to your production backend API URL before building.
- Make sure the frontend domain matches the `CLIENT_URL` used by the backend.
- If another app already lives on the same Contabo VPS, point this frontend at this app’s own backend origin and keep the apps on separate internal ports.

### PostgreSQL production setup

- Use a dedicated production database, not the local helper scripts.
- Use a strong password and a least-privilege database user.
- Enable backups, connection limits, and standard monitoring.
- Run Prisma migrations with `prisma migrate deploy`, not `migrate dev`.
- Prefer managed PostgreSQL or a properly secured VPS database over a shared local install.

### Socket.IO deployment considerations

- WebSocket upgrade support must be enabled in the reverse proxy.
- Proxy `Upgrade` and `Connection` headers correctly if using Nginx.
- Keep backend and frontend CORS/origin values aligned with the real domains.
- If you scale to multiple backend instances later, add a shared Socket.IO adapter such as Redis so live events work across nodes.

### Contabo VPS coexistence notes

- This app should run on its own internal port, for example `PORT=4002`, while another app can keep a different port such as `3000` or `4000`.
- Nginx can route by domain or path to avoid conflicts. Example:
  - `market.example.com` -> this app on `127.0.0.1:4002`
  - `dashboard.example.com` -> the other app on its own internal port
- Uploaded images can either be proxied through the Node app at `UPLOADS_URL_PATH` or served directly by Nginx from `UPLOADS_DIR`.
- If you serve uploads directly from Nginx, keep the directory outside ephemeral deploy folders and make sure the Node process still writes into that same persistent path.
- Keep `SERVER_URL` aligned with the public backend origin that Nginx exposes, not just the internal port binding.

## Known MVP limitations

- Google OAuth is scaffolded in env/config only and not completed yet.
- Post images are stored on the local server filesystem for now; there is no cloud object storage or CDN yet.
- There are no notifications, read receipts, or typing indicators.
- Profile editing is basic and does not include image uploads.
- Admin moderation is intentionally simple and does not include audit logs.
- There is no automated test suite yet; verification is currently lint/build plus manual checks.
- The local PostgreSQL scripts are Windows-focused convenience helpers.

## Recommended next improvements

1. Complete Google OAuth login.
2. Add automated API and frontend tests for auth, posts, chat, and moderation.
3. Add file upload/storage support for avatars and post images.
4. Expand profile management beyond the current basic name/avatar/bio form.
5. Add admin audit logging for moderation actions.
6. Add pagination controls to public browsing and inbox views.
7. Add production-oriented rate limiting and request logging.
8. Add optional presence, unread counts, and better inbox UX for chat.
