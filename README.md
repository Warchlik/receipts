# receipts

pnpm/Turborepo monorepo.

## Packages

- `apps/api` — Express + Drizzle + better-auth backend (receipts, members, invites, expense splitting).
- `packages/shared` — Zod schemas/types shared between the API and its clients.

The web landing page (Next.js) and the mobile app (React Native + Expo) will live here once work on them starts.

## Development

```bash
pnpm install
pnpm dev
```

See `apps/api/README.md` and `docker-compose.yml` for running the API against Postgres.
