# Practice Time API — Developer Guide

This guide contains the local setup and day-to-day development workflow for the
Practice Time NestJS API. Keep the repository root `README.md` focused on the
product, architecture, live demo, and portfolio case study.

## Stack

- Node.js and npm
- NestJS 11 with TypeScript
- PostgreSQL and private S3-compatible object storage
- TypeORM with versioned migrations
- Jest and Supertest

## Prerequisites

Install Node.js, npm, and Docker with Docker Compose. The project does not
currently pin a Node version, so use a maintained Node.js LTS release that is
compatible with the locked dependencies.

## Initial setup

Install the locked dependencies:

```bash
npm install
```

Copy the committed development defaults:

```bash
cp .env.example .env
```

The example is ready for the local Docker database:

```dotenv
NODE_ENV=development
PORT=3000
API_PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=practice_time
DB_USERNAME=practice_time
DB_PASSWORD=practice_time
```

`PORT` defaults to `3000` and `DB_PORT` defaults to `5432`. The remaining
database values are required. Environment files are loaded in this order:

1. `.env.<NODE_ENV>`
2. `.env`

Start PostgreSQL and LocalStack and wait for their health checks to pass:

```bash
docker compose up -d --wait postgres localstack
```

LocalStack initializes a private `practice-time-resources` S3 bucket. Uploaded
PDF, MP3, JPEG, PNG, GIF, and WebP files are stored there; PostgreSQL stores
only validated metadata and ownership-scoped references.

Apply the database migrations:

```bash
npm run migration:run
```

Start the API with file watching:

```bash
npm run start:dev
```

The API is available at `http://localhost:3000` unless `PORT` is changed.

## Daily development workflow

Use Docker only for PostgreSQL and run NestJS directly on the host for fast
watch-mode recompilation and straightforward debugging.

At the start of a development session:

```bash
# Start PostgreSQL and wait until it is ready
docker compose up -d --wait postgres localstack

# Apply migrations added since the last local run
npm run migration:run

# Start NestJS with file watching
npm run start:dev
```

Keep `npm run start:dev` running while editing files under `src/`. Nest recompiles
and restarts the API when source files change. Stop it with `Ctrl+C`.

PostgreSQL can remain running between sessions. To stop it without deleting its
data:

```bash
docker compose stop postgres
```

When dependencies change, stop the API and run `npm install` before restarting
watch mode. When entities change, generate and inspect a migration, apply it,
then restart the API if necessary.

## Dockerized API and PostgreSQL

Build and run the production NestJS image together with PostgreSQL:

```bash
docker compose up --build -d api
```

Compose waits for PostgreSQL to become healthy before starting the API. The API
uses `postgres` as its database hostname inside the Compose network and listens
on port `3000` in its container. It is available from the host at
`http://localhost:3001` by default; set `API_PORT` to change the host port.

The API image does not run migrations automatically. Apply pending migrations
before first use or after pulling schema changes:

```bash
npm run migration:run
```

Useful container commands:

```bash
# Show API and database status
docker compose ps

# Follow API logs
docker compose logs -f api

# Rebuild the API after source or dependency changes
docker compose up --build -d api

# Stop both services while preserving database data
docker compose down
```

## Local PostgreSQL container

The `postgres` Compose service uses PostgreSQL 17, publishes the configured
`DB_PORT`, and persists data in the `postgres-data` Docker volume. It reads the
same database variables as the NestJS application, so `.env` is the only local
configuration file needed.

```bash
# Start PostgreSQL and wait until it is healthy
docker compose up -d --wait postgres

# Show service state
docker compose ps

# Follow PostgreSQL logs
docker compose logs -f postgres

# Stop the container without deleting database data
docker compose down
```

To rebuild a disposable local database from the migrations, remove the Compose
volume and start the service again:

```bash
docker compose down --volumes
docker compose up -d --wait postgres
npm run migration:run
```

`docker compose down --volumes` permanently deletes the local database stored
in this Compose project. Do not use it when the data must be preserved.

## Assignment resource storage

For host-based development, use the LocalStack defaults from `.env.example`:

```dotenv
S3_REGION=us-east-1
S3_BUCKET=practice-time-resources
S3_ENDPOINT=http://localhost:4566
S3_PUBLIC_ENDPOINT=http://localhost:4566
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
S3_FORCE_PATH_STYLE=true
S3_SIGNED_URL_TTL_SECONDS=300
RESOURCE_MAX_UPLOAD_BYTES=15728640
```

Start and inspect local object storage with:

```bash
docker compose up -d --wait localstack
docker compose exec localstack awslocal s3api head-bucket \
  --bucket practice-time-resources
```

Production should use a private S3 bucket, HTTPS, short-lived signed URLs, and
an IAM role restricted to that bucket. Set `S3_ENDPOINT` to the production
S3-compatible endpoint or omit it for AWS S3, set `S3_FORCE_PATH_STYLE=false`,
and provide credentials through the deployment platform or workload identity.
`S3_PUBLIC_ENDPOINT` controls the host embedded in signed URLs and can be
omitted when it is the same as `S3_ENDPOINT`. Never put production access keys
in an environment file or repository.

Resource endpoints are ownership-scoped:

- `POST /student-assignment-items/:itemId/resources/upload` uses multipart
  fields `file`, `displayName`, and `position`.
- `POST /student-assignment-items/:itemId/resources/links` creates an HTTPS
  external or YouTube resource.
- `GET /student-assignment-items/:itemId/resources` lists safe metadata.
- `GET /assignment-resources/:resourceId/access-url` issues a short-lived URL.
- `DELETE /assignment-resources/:resourceId` removes a reference and deletes
  the object only after its final reference is removed.

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

# Check lint without modifying files (the command used in CI)
npm run lint:check

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
