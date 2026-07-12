FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ui/package.json ./packages/ui/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
COPY apps/web/ ./apps/web/
COPY packages/ui/ ./packages/ui/
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter web build

# ── runner: nginx serving static files ───────────────────────────────────────
FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
