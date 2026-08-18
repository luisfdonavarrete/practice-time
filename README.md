# Practice Time

NestJS API and React client for an assignment-first music-practice application.

## Local development

Install and run the API from the repository root:

```bash
npm install
npm run start:dev
```

Install and run the React client in another terminal:

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

The API runs at `http://localhost:3000` and the Vite client runs at
`http://localhost:5173`. See [frontend/README.md](frontend/README.md) for client
checks and configuration.

## Required quality checks

GitHub Actions runs the following checks for every pull request and every push
to `main`:

- backend lint, production build, and unit tests;
- frontend lint, production build, and unit tests;
- backend end-to-end tests against an isolated PostgreSQL 17 service after all
  migrations are applied.

Run the same checks locally before opening or merging a pull request:

```bash
# API checks
npm ci --legacy-peer-deps
npm run lint:check
npm run build
npm test -- --runInBand

# React checks
cd frontend
npm ci
npm run lint:check
npm run build
npm test
```

The end-to-end suite also requires the local PostgreSQL service and migrations:

```bash
docker compose up -d postgres
npm run migration:run
npm run test:e2e -- --runInBand
```

Pull requests must not be merged while any of the `Backend / lint, build, unit
tests`, `Frontend / lint, build, unit tests`, or `Backend / PostgreSQL end-to-end
tests` checks are failing. Configure these three checks as required status checks
in the repository's `main` branch protection rules.
