# Practice Time API — Developer Guide

This guide contains the local setup and day-to-day development workflow for the
Practice Time NestJS API. Keep the repository root `README.md` focused on the
product, architecture, live demo, and portfolio case study.

## Stack

- Node.js and npm
- NestJS 11 with TypeScript
- PostgreSQL
- TypeORM with versioned migrations
- Jest and Supertest

## Prerequisites

Install Node.js, npm, and PostgreSQL. The project does not currently pin a Node
version, so use a maintained Node.js LTS release that is compatible with the
locked dependencies.

## Initial setup

Install the locked dependencies:

```bash
npm install
```

Create a local PostgreSQL database, then create `.env.development` or `.env` in
the repository root:

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=practice_time
DB_USERNAME=postgres
DB_PASSWORD=your-local-password
```

`PORT` defaults to `3000` and `DB_PORT` defaults to `5432`. The remaining
database values are required. Environment files are loaded in this order:

1. `.env.<NODE_ENV>`
2. `.env`

The application currently validates `DB_NAME`. The existing `.env.example`
uses `DB_DATABASE`; use `DB_NAME` until that example is corrected.

Apply the database migrations:

```bash
npm run migration:run
```

Start the API with file watching:

```bash
npm run start:dev
```

The API is available at `http://localhost:3000` unless `PORT` is changed.

## Common commands

```bash
# Start with file watching
npm run start:dev

# Compile TypeScript
npm run build

# Run compiled output
npm run start:prod

# Run unit tests
npm test

# Run unit tests in watch mode
npm run test:watch

# Run end-to-end tests
npm run test:e2e

# Generate a coverage report
npm run test:cov

# Lint and automatically fix supported issues
npm run lint

# Format source and test files
npm run format
```

Because `lint` and `format` modify files, review their changes before committing.

## Database migrations

TypeORM migrations own the database schema. `synchronize` is disabled and must
not be enabled as a shortcut.

After changing an entity, generate a migration by passing only a descriptive
name:

```bash
npm run migration:generate -- AddAssignmentItems
```

Create an empty migration for hand-written schema or data changes:

```bash
npm run migration:create -- BackfillAssignmentItems
```

Inspect and manage migrations:

```bash
# Show applied and pending migrations
npm run migration:show

# Apply pending migrations
npm run migration:run

# Revert the most recently applied migration
npm run migration:revert
```

Always inspect generated SQL before applying it. Commit migrations with the
entity changes they implement, and test migrations against a disposable local
database when a change is destructive or transforms existing data.

If a local database was previously created with `synchronize: true`, recreate
it when the data is disposable. Only baseline an existing matching schema with
`npm run migration:run -- --fake`; never fake migrations on an empty database.

## Project organization

Application code lives in `src/`. Keep each feature grouped by domain, following
the structure used by `src/student-assignments/`:

```text
src/<feature>/
├── dto/
├── entities/
├── <feature>.controller.ts
├── <feature>.module.ts
├── <feature>.service.ts
└── *.spec.ts
```

Shared HTTP behavior belongs in `src/common/api/`. Configuration belongs in
`src/app-config/`, database wiring and migrations in `src/database/`, and HTTP
end-to-end tests in `test/`. Never edit generated files in `dist/`.

## API and validation conventions

- Use explicit request and response DTOs rather than returning entities.
- Global validation transforms supported values, removes no unknown input
  silently, and rejects non-whitelisted properties.
- Use the shared response and logging interceptors under `src/common/api/`.
- Keep controllers focused on HTTP concerns and business rules in services.
- Validate new environment variables in `src/app-config/config.schema.ts`.

## Testing expectations

Colocate unit tests with their subjects as `*.spec.ts`. Put HTTP end-to-end tests
in `test/` as `*.e2e-spec.ts`.

For a feature change, cover the relevant service behavior, controller contract,
validation failures, authorization boundaries, and database behavior. Before
opening a pull request, run:

```bash
npm run build
npm run lint
npm test
npm run test:e2e
```

## Coding conventions

- Use two-space indentation, single quotes, semicolons, and trailing commas.
- Name files in kebab case and Nest classes in PascalCase.
- Use camelCase for methods and variables.
- Keep modules focused on one domain.
- Resolve unsafe TypeScript arguments and floating promises where practical.
- Do not commit credentials or local environment files.

## Git workflow

Use focused Conventional Commits with an imperative summary:

```text
feat(assignments): add ordered practice items
fix(database): validate assignment item position
test(assignments): cover unauthorized student access
```

Pull requests should explain what changed and why, link relevant issues, list
verification commands, and call out API, database, or configuration changes.
