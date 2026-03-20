# Service Marketplace Website

A full-stack marketplace web application for posting listings, browsing categories, chatting with sellers in real time, and moderating platform activity through an admin dashboard.

This project was built as an MVP with a practical product-first approach, focusing on real user flows such as authentication, listing management, image uploads, direct messaging, moderation, localization, and responsive behavior across desktop and mobile devices.

## Features

- Email and password authentication
- Arabic and English interface with RTL/LTR support
- Public marketplace browsing with categories and search
- Listing creation, editing, deletion, and ownership controls
- Multiple image upload support for listings with cover image selection
- Public user profiles
- Real-time one-to-one chat with Socket.IO
- Admin dashboard for moderating users and listings
- Responsive UI for desktop and mobile
- JWT-protected routes and role-based access
- PostgreSQL persistence with Prisma ORM

## Tech Stack

### Frontend

- React
- Vite
- React Router

### Backend

- Node.js
- Express
- Socket.IO

### Database

- PostgreSQL
- Prisma ORM

### Authentication

- JWT

## Project Structure

```text
client/
  src/
    app/
    components/
    features/
      admin/
      auth/
      chat/
      i18n/
      posts/
      profile/
      theme/
    lib/
    styles/

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

## Main Functional Areas

### Authentication

Users can register, log in, and manage their account information.

### Marketplace

Users can create listings with title, description, category, price, country, city, and multiple uploaded images.

### Images

Listings support multiple local image uploads, image preview, and cover-image selection.

### Profiles

Each user has a public profile page that displays their published listings.

### Chat

Users can start direct one-to-one conversations and exchange messages in real time.

### Admin Dashboard

Admins can review platform statistics, moderate users, and manage public listing visibility.

### Localization

The interface supports both Arabic and English, including RTL layout behavior for Arabic.

## Local Development

### Prerequisites

- Node.js 24+
- npm 11+
- PostgreSQL 17+ for local development
- PowerShell if using the Windows helper scripts

### Environment Files

Create local environment files from the provided examples:

```powershell
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

### Install Dependencies

```powershell
npm install
```

### Database Setup

Generate Prisma client:

```powershell
npm run db:generate
```

Apply migrations:

```powershell
npm run db:migrate
```

Seed the database:

```powershell
npm run db:seed
```

### Run the App

```powershell
npm run dev
```

Or run frontend and backend separately:

```powershell
npm run dev:client
npm run dev:server
```

### Local URLs

- Frontend: `http://localhost:5173`
- API: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

### Default Local Admin

If you keep the example seed values:

- Email: `admin@example.com`
- Password: `Admin12345!`

## API Overview

### General

- `GET /api`
- `GET /api/health`

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Categories

- `GET /api/categories`

### Users

- `GET /api/users/:userId`
- `PATCH /api/users/me`

### Posts

- `GET /api/posts`
- `GET /api/posts/mine`
- `GET /api/posts/:identifier`
- `POST /api/posts`
- `PATCH /api/posts/:identifier`
- `DELETE /api/posts/:identifier`

### Conversations

- `GET /api/conversations`
- `POST /api/conversations`
- `GET /api/conversations/:conversationId`
- `GET /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/messages`
- `POST /api/conversations/:conversationId/read`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:userId`
- `GET /api/admin/posts`
- `PATCH /api/admin/posts/:postId`
