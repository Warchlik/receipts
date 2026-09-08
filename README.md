# Receipts

A backend for splitting shared bills — receipts, groceries, dinners — across a group of people, including people who don't have an account.

> 🇵🇱 Polish version: [README.pl.md](./README.pl.md)

## The problem

Splitting a bill with friends sounds trivial until you actually try to build it:

- Not everyone in the group wants to sign up for an app just to settle a 20 PLN pizza debt.
- "Split equally" isn't enough — sometimes one person orders no alcohol, sometimes someone wants to manually adjust their share, sometimes the fair split is "whoever ordered this item pays for it."
- Someone has to front the money, and the group needs a simple, unambiguous view of who still owes what.
- People join a group after it already exists — a guest added by name today needs to become a real, authenticated account tomorrow, without losing their history.

This project is an API that models that problem properly, instead of assuming every participant is a registered user from day one.

## Core features

- **Guest members** — add a person to a receipt by name only, no account required. Their share, payment status and history are tracked from the moment they're added.
- **Invite links** — the receipt creator generates a token-based invite (7-day expiry, single use) that lets a real person claim an existing guest identity, or join the receipt directly. A public, unauthenticated preview endpoint lets the invite link show _who/what_ before the recipient logs in.
- **Three split modes**, selectable per receipt:
  - **Equal** — the total is divided evenly across members, with the rounding remainder deterministically assigned so the totals always add up exactly.
  - **Manual** — the creator sets each member's amount directly.
  - **Itemized** — each expense line item is assigned to a subset of members and split equally between just them; a member's total is the sum of the items they're in.
- **Manual overrides** — in equal/itemized mode, any member's share can still be manually corrected; once overridden, the split engine excludes that member from automatic recalculation until it's explicitly reset.
- **Settlement summary** — a single endpoint answering "who has paid, who hasn't, and how much is still outstanding," correctly excluding the creator's own share (they're assumed to have fronted the bill, not to owe money to themselves).

## Tech stack

| Layer              | Choice                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------- |
| Runtime / language | Node.js, TypeScript                                                                      |
| HTTP framework     | Express 5                                                                                |
| Database           | PostgreSQL, [Drizzle ORM](https://orm.drizzle.team/) (schema, migrations, query builder) |
| Auth               | [better-auth](https://www.better-auth.com/) (email/password, bearer tokens)              |
| Validation         | Zod v4, request-level middleware                                                         |
| Testing            | Vitest + Supertest — integration tests against a real running app instance and database  |
| Docs               | OpenAPI 3 (swagger-jsdoc), served at `/api/docs`                                         |
| Tooling            | pnpm workspaces + Turborepo monorepo, ESLint, Prettier                                   |

## Architecture

The API is organized as small, self-contained modules under `apps/api/src/modules/`, each following the same layered convention:

```
<module>.routes.ts       Express router + OpenAPI annotations
<module>.controller.ts   HTTP-level glue: parses req, calls service, shapes response
<module>.service.ts      Business rules and authorization checks
<module>.repository.ts   Drizzle queries — the only place that touches the DB directly
<module>.schema.ts       Zod request schemas
```

Current modules: `receipts` (receipts, members, settlement, split engine), `invites`, `expenses`, `profiles`, `auth`.

Cross-module calls only happen through a service's public methods (e.g. the `invites` module calls into `ReceiptsService` to claim a member or add an authenticated user) — no module reaches into another module's repository directly.

## Data model (simplified)

```
receipts               one bill, with an amount, currency and a split_type (equal | manual | itemized)
receipt_members         a person splitting a receipt — either a registered user_id OR a guest_name, never both
receipt_invites          a single-use, expiring token that lets a real user claim a receipt_member row
expenses                a line item belonging to a receipt (used by itemized mode)
expense_splits           which receipt_members an expense is split across
```

A `receipt_member` row is deliberately the join point between "a name on a bill" and "an actual account" — a guest can be claimed by a real user later without ever losing their `amount_owed`, `paid_at` or history.

## API overview

All routes are mounted under `/api` and require a bearer token unless noted otherwise.

```
POST   /api/auth/sign-up/email          Register
POST   /api/auth/sign-in/email          Log in
GET    /api/auth/session                 Current session

GET    /api/receipts                     List receipts you're part of
POST   /api/receipts                     Create a receipt
GET    /api/receipts/:id                 Get a receipt
PATCH  /api/receipts/:id                 Update a receipt (creator only)
DELETE /api/receipts/:id                 Delete a receipt (creator only)
GET    /api/receipts/:id/settlement      Who owes what, who's paid

GET    /api/receipts/:id/members         List members
POST   /api/receipts/:id/members         Add a member (guest or registered user)
PATCH  /api/receipts/:id/members/:memberId          Update amount owed / paid status
DELETE /api/receipts/:id/members/:memberId          Remove a member
PATCH  /api/receipts/:id/members/:memberId/claim     Claim a guest identity as yourself

GET    /api/receipts/:id/expenses                   List expense line items
POST   /api/receipts/:id/expenses                   Add an item
PATCH  /api/receipts/:id/expenses/:expenseId         Update an item
DELETE /api/receipts/:id/expenses/:expenseId         Delete an item
PUT    /api/receipts/:id/expenses/:expenseId/splits  Set which members share this item

POST   /api/receipts/:id/invites          Generate an invite link (creator only)
GET    /api/invites/:token                Public preview of an invite (no auth)
POST   /api/invites/:token/accept         Accept an invite

GET    /api/profiles/me                   Get your profile
PATCH  /api/profiles/me                   Update your profile
```

Full interactive documentation (request/response schemas) is served at `/api/docs` when the server is running.

## Testing

Integration tests run against a real Express app instance and a real Postgres database — no mocking of the database layer. They cover, among other things:

- The split engine's rounding and override logic (equal / itemized modes).
- Authorization boundaries (a member can't hijack creator privileges; a receipt's data isn't leaked to non-members).
- Edge cases found through deliberate adversarial review: SQL `LIKE` wildcard characters in guest names, race conditions between two people accepting the same invite, duplicate invite token minting.

```bash
pnpm --filter api test
```

## Running locally

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then point DATABASE_URL at a running Postgres
pnpm --filter api db:migrate
pnpm dev
```

Or use `docker-compose.yml` to bring up Postgres alongside the API.

## Project status & roadmap

This repository currently covers the **backend only**. Two clients are planned but not started:

- A mobile app (React Native + Expo) — the primary client.
- A landing page (Next.js).

Once the mobile client exists, the next planned backend feature is **OCR receipt scanning** — extracting line items directly from a photo of a paper receipt instead of entering them manually.
