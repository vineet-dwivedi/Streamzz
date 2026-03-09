# Streamzz

Streamzz is a full-stack cinematic movie platform built with React, Redux Toolkit, Node.js, Express, MongoDB, TMDB, Three.js, and GSAP. It combines public movie discovery with a custom backend for authentication, favorites, watch history, and admin controls.

## Live Projects

- Frontend: `https://streamzz-nine.vercel.app/`
- Backend: `https://streamzz.onrender.com`
- Health Check: `https://streamzz.onrender.com/api/health`

## What It Does

- Cinematic intro screen on `/` using `Three.js` and `GSAP`
- JWT-based signup, login, logout, and current-user session restore
- TMDB-powered movie browsing with polished UI and trailer previews
- Favorites saved in MongoDB
- Recent watch history saved in MongoDB
- Admin studio panel for movie CRUD and user moderation
- Root-first experience: on page reload, the app routes back through the intro screen
- Premium SCSS architecture split into app, base, shared, motion, and responsive layers

## Core Features

### User Side

- Browse movie and TV content from TMDB
- Open a movie detail modal without leaving the current screen
- Watch trailers in-place
- Save and remove favorites
- Track recent watch history
- Responsive cinematic UI for desktop and mobile

### Admin Side

- Add movies to the internal catalog
- Edit movie details
- Delete movies
- View users
- Ban and unban users
- Delete users

## Tech Stack

### Frontend

- React 19
- Redux Toolkit
- React Router
- Axios
- SCSS
- GSAP
- Three.js
- Lenis
- Vite

### Backend

- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcryptjs
- CORS

### Deployment

- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Project Structure

```text
STREAMZZ/
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |-- features/
|   |   |-- pages/
|   |   `-- shared/
|   |-- .env.example
|   `-- vercel.json
|-- backend/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- routes/
|   |   `-- utils/
|   `-- .env.example
`-- README.md
```

## Frontend Routes

- `/` - Cinematic intro
- `/auth` - Login and registration
- `/favorites` - Main browse experience
- `/history` - Watch history
- `/admin` - Admin dashboard

## Backend API

Base URL:

```text
https://streamzz.onrender.com/api
```

### Health

- `GET /health`

### Auth

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Favorites

- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites/:contentKey`

### History

- `GET /history`
- `POST /history`
- `DELETE /history/:contentKey`

### Admin

- `GET /admin/movies`
- `POST /admin/movies`
- `PATCH /admin/movies/:id`
- `DELETE /admin/movies/:id`
- `GET /admin/users`
- `PATCH /admin/users/:id/ban`
- `DELETE /admin/users/:id`

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vineet-dwivedi/Streamzz.git
cd STREAMZZ
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on:

```text
http://localhost:5000
```

### 3. Setup Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Environment Variables

### Frontend `.env`

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
VITE_TMDB_BACKDROP_BASE_URL=https://image.tmdb.org/t/p/original
VITE_TMDB_ACCESS_TOKEN=your_tmdb_v4_read_access_token
```

### Backend `.env`

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
```

## Deployment Notes

### Frontend

- Hosted on Vercel
- Uses `frontend/vercel.json` for SPA routing

### Backend

- Hosted on Render
- Uses `PORT` from Render automatically
- Health check path: `/api/health`

### Important

- Render free tier can cold start. The first backend request may take a few seconds.
- CORS is configured for localhost, configured client URLs, and Vercel preview domains.

## Admin Access

Admin role is restricted in backend logic.

- Only `vineetdwi17@gmail.com` is treated as `admin`
- All newly registered users are created as normal users unless they match that email

## Notable UX Decisions

- Reloading from protected pages takes the app back to the intro screen first
- Movie detail and trailer views open as centered overlays, so the user does not need to scroll down to view content
- Search, browsing, history, and admin surfaces share the same cinematic design language

## Scripts

### Frontend

```bash
npm run dev
npm run build
npm run preview
```

### Backend

```bash
npm run dev
npm start
```

## Author

Vineet Dwivedi
