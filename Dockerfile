FROM node:20-alpine AS base
RUN npm install -g pnpm@9
WORKDIR /app

# ── Stage 1: install dependencies ───────────────────────────────────────────
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/employee-tracker/package.json ./artifacts/employee-tracker/
RUN pnpm install --frozen-lockfile

# ── Stage 2: copy source & build ────────────────────────────────────────────
FROM deps AS builder
COPY . .

# Build the React frontend (BASE_PATH=/ so routes work from root)
RUN BASE_PATH=/ PORT=3000 pnpm --filter @workspace/employee-tracker run build

# Build the Express API server bundle
RUN pnpm --filter @workspace/api-server run build

# ── Stage 3: lean production image ───────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

# The compiled API server
COPY --from=builder /app/artifacts/api-server/dist ./dist

# The built frontend assets (served as static files by Express)
COPY --from=builder /app/artifacts/employee-tracker/dist/public ./dist/public

# pg is required at runtime (not bundled by esbuild)
RUN npm install pg

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "dist/index.cjs"]
