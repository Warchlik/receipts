FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate

FROM base AS deps

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

FROM deps AS builder

COPY apps/api/ ./apps/api/
COPY packages/shared/ ./packages/shared/
RUN pnpm --filter api build

RUN pnpm --filter api deploy --legacy /app/api

FROM node:24-alpine AS runner

WORKDIR /app
ENV COREPACK_HOME=/opt/corepack
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
RUN npm install -g pm2

COPY --from=builder /app/api ./api
COPY apps/api/ecosystem.config.cjs ./api/ecosystem.config.cjs

RUN addgroup -S appgroup \
  && adduser -S appuser -G appgroup \
  && mkdir -p /home/appuser/.pm2 \
  && chown -R appuser:appgroup /home/appuser /app \
  && chmod -R a+rX /opt/corepack

ENV HOME=/home/appuser
USER appuser
WORKDIR /app/api

EXPOSE 3000
