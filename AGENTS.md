# Repository Guidelines

## Project Structure & Module Organization

This repository is a NestJS 11 API written in TypeScript. Application code lives in `src/`. Keep feature code grouped by domain, following the pattern in `src/student-assignments/` (`*.module.ts`, controller, service, DTOs, entities, and colocated unit tests). Shared HTTP behavior belongs in `src/common/api/`; configuration and database wiring live in `src/app-config/` and `src/database/`. End-to-end tests are in `test/`. Compiled output is generated in `dist/` and must not be edited directly.

## Build, Test, and Development Commands

- `npm install`: install the locked dependencies from `package-lock.json`.
- `npm run start:dev`: run the API with file watching for local development.
- `npm run build`: compile TypeScript into `dist/`.
- `npm run start:prod`: run the compiled application.
- `npm test`: run unit tests under `src/` with Jest.
- `npm run test:e2e`: run `test/*.e2e-spec.ts` using the e2e Jest config.
- `npm run test:cov`: generate coverage output in `coverage/`.
- `npm run lint`: lint and automatically fix TypeScript files.
- `npm run format`: format files in `src/` and `test/` with Prettier.

## Coding Style & Naming Conventions

Use two-space indentation, single quotes, semicolons, and trailing commas as produced by Prettier. ESLint uses type-aware TypeScript rules; resolve warnings about floating promises and unsafe arguments where practical. Name files in kebab case with Nest suffixes, for example `student-assignments.service.ts` and `create-student-assignment.dto.ts`. Use PascalCase for classes and DTOs, camelCase for methods and variables, and keep modules focused on one domain.

## Testing Guidelines

Jest and `ts-jest` run tests; Supertest is available for HTTP e2e coverage. Colocate unit tests as `*.spec.ts` beside their subjects and name e2e files `*.e2e-spec.ts` under `test/`. Update tests for changed controller, validation, and service behavior. No numeric coverage threshold is configured, but avoid reducing coverage of changed code.

## Configuration & Security

Configuration is read from `.env.<NODE_ENV>` and then `.env`. Define `DB_HOST`, `DB_NAME`, `DB_USERNAME`, and `DB_PASSWORD`; `PORT` and `DB_PORT` default to `3000` and `5432`. Never commit environment files or credentials. Validate new settings in `src/app-config/config.schema.ts`.

## Commit & Pull Request Guidelines

Use Conventional Commits with an imperative summary, such as `feat(assignments): add due-date validation`. Keep commits focused and mark breaking changes with a `BREAKING CHANGE:` footer.

PRs must explain what changed and why, link issues with `Closes #123`, and document verification. Run lint, unit tests, and relevant e2e tests before review. Call out breaking API, database, or configuration changes and include endpoint examples. Update documentation and ensure CI passes.
