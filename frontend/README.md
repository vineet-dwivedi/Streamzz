# Streamzz Frontend (Architecture Skeleton)

This is a scalable React architecture dummy for fast feature delivery.

## Layers

- `app/`: root app setup (router + store wiring)
- `pages/`: route-level screens
- `features/`: domain modules (auth, movies, favorites, history, admin)
- `shared/`: reusable APIs, constants, UI, and helpers
- `styles/`: global styles

## Flow

1. Router resolves route-level pages.
2. Feature modules own their own Redux slice/state.
3. Shared API client adds JWT token automatically.
4. Route guards protect user/admin screens.

## Run

```bash
npm install
npm run dev
```
