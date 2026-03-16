# Streamzz

Streamzz is a full-stack cinematic movie platform that combines TMDB discovery with a custom backend for authentication, favorites, watch history, and admin controls.

## Live

- Frontend: `https://streamzz-nine.vercel.app/`
- Backend: `https://streamzz.onrender.com`
- Health: `https://streamzz.onrender.com/api/health`

## Highlights

- Cinematic intro on `/` with `Three.js` + `GSAP`
- JWT auth: signup, login, logout, session restore (`/auth/me`)
- TMDB-powered browsing, search, and trailers
- Favorites and watch history stored in MongoDB
- Admin studio for movie CRUD and user moderation
- Reload flow returns to intro first, then routes forward
- Detail and trailer views open in a centered overlay (no scroll jump)

## Tech Stack

Frontend:
- React 19
- Redux Toolkit
- React Router
- Axios
- SCSS
- GSAP
- Three.js
- Lenis
- Vite

Backend:
- Node.js
- Express
- MongoDB + Mongoose
- JWT
- bcryptjs
- CORS

Deployment:
- Frontend: Vercel
- Backend: Render
- DB: MongoDB Atlas

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

- `/` - Intro
- `/auth` - Login and registration
- `/favorites` - Main browse experience
- `/history` - Watch history
- `/admin` - Admin dashboard

## Backend API

Base URL:

```text
https://streamzz.onrender.com/api
```

Health:
- `GET /health`

Auth:
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Favorites:
- `GET /favorites`
- `POST /favorites`
- `DELETE /favorites/:contentKey`

History:
- `GET /history`
- `POST /history`
- `DELETE /history/:contentKey`

Admin:
- `GET /admin/movies`
- `POST /admin/movies`
- `PATCH /admin/movies/:id`
- `DELETE /admin/movies/:id`
- `GET /admin/users`
- `PATCH /admin/users/:id/ban`
- `DELETE /admin/users/:id`

## Local Setup

1. Clone:

```bash
git clone https://github.com/vineet-dwivedi/Streamzz.git
cd STREAMZZ
```

2. Backend:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

3. Frontend:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Environment Variables

Frontend `.env`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_TMDB_BASE_URL=https://api.themoviedb.org/3
VITE_TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p/w500
VITE_TMDB_BACKDROP_BASE_URL=https://image.tmdb.org/t/p/original
VITE_TMDB_ACCESS_TOKEN=your_tmdb_v4_read_access_token
```

Backend `.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
CLIENT_URLS=http://localhost:5173
```

## Deployment Notes

Frontend:
- Vercel
- Uses `frontend/vercel.json` for SPA routing

Backend:
- Render
- Health check path: `/api/health`

Notes:
- Render free tier can cold start. First request may be slow.
- CORS allows localhost, configured client URLs, and Vercel preview domains.

## Admin Access

Admin role is restricted in backend logic:
- Only `vineetdwi17@gmail.com` is treated as `admin`.
- All other new users are normal users by default.

## Scripts

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

Backend:

```bash
npm run dev
npm start
```

## Author

Vineet Dwivedi
