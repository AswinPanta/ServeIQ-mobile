# StayEasy — Architecture

## Backend
- **FastAPI (Python)** deployed on Render at `https://stayeasy-1-35ba.onrender.com`
- Swagger docs at `https://stayeasy-1-35ba.onrender.com/docs`
- OpenAPI spec at `https://stayeasy-1-35ba.onrender.com/api/v1/openapi.json`

## Mobile App
- **Expo SDK 56** with React Native
- All API calls go directly to the FastAPI backend via `fetch()`
- Auth endpoints in `lib/context/auth-context.tsx` use `API_BASE_URL` + `API_ENDPOINTS` from `constants/api-config.ts`
- Override API URL via `EXPO_PUBLIC_API_URL` env var (default in `.env`)

## Removed
- Express/tRPC server (`server/`) — unused, switched to FastAPI
- tRPC client (`lib/trpc.ts`) — unused
- Drizzle ORM (`drizzle/`) — unused
- Server-only deps removed from `package.json`
