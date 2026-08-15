# Practice Time frontend

React and Vite client for the Practice Time API.

## Local development

1. Copy `.env.example` to `.env.local` and adjust `VITE_API_BASE_URL` if the API
   does not run on port 3000.
2. Install dependencies with `npm install`.
3. Start the client with `npm run dev`.

Run the NestJS API from the repository root in another terminal with
`npm run start:dev`. Vite serves the client at `http://localhost:5173`.

Authentication uses the API bearer token. The client stores it in local storage,
adds it to API requests, and validates it with `GET /auth/me` whenever the page
reloads. Signing out removes the token and clears the RTK Query cache.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run format`
