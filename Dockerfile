# syntax=docker/dockerfile:1

# ---------- Stage 1: frontend build ----------
FROM node:24-bookworm-slim AS frontend-build
WORKDIR /app

COPY package.json package-lock.json ./
ENV HUSKY=0
RUN npm ci

COPY . .
# Same value in dev and prod, see docs/ARCHITECTURE.md — nginx/Express both
# serve everything from one origin, so this is never environment-specific.
ENV VITE_API_URL=/api
RUN npm run build
# -> /app/dist


# ---------- Stage 2: backend build ----------
FROM node:24-bookworm-slim AS backend-build
WORKDIR /app/server

# Prisma's query engine binary is dynamically linked against libssl, which
# Debian "slim" images strip out by default — needed for `prisma generate`
# to pick the right engine and for the engine to load at all.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY server/package.json server/package-lock.json ./
RUN npm ci

COPY server/ .
RUN npx prisma generate
RUN npm run build
# -> /app/server/dist, /app/server/node_modules, /app/server/prisma


# ---------- Stage 3: runtime ----------
FROM node:24-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

COPY --from=frontend-build /app/dist ./dist

# server/package.json is required at runtime: server/ is ESM ("type":
# "module" + tsconfig "NodeNext"), and Node looks for the nearest
# package.json to know how to parse dist/index.js — without it the
# container crashes on startup.
COPY --from=backend-build /app/server/package.json ./server/package.json
COPY --from=backend-build /app/server/node_modules ./server/node_modules
COPY --from=backend-build /app/server/dist ./server/dist
COPY --from=backend-build /app/server/prisma ./server/prisma

WORKDIR /app/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
