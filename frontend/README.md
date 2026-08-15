# Practice Time frontend

React and Vite client for the Practice Time API.

## Local development

1. Copy `.env.example` to `.env.local` and adjust `VITE_API_BASE_URL` if the API
   does not run on port 3000.
2. Install dependencies with `npm install`.
3. Start the client with `npm run dev`.

Run the NestJS API from the repository root in another terminal with
`npm run start:dev`. Vite serves the client at `http://localhost:5173`.

## Checks

- `npm run lint`
- `npm test`
- `npm run build`
- `npm run format`
