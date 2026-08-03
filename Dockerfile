# syntax=docker/dockerfile:1
# ============================================================================
# SAMRUX — production image
#
#   docker build -t samrux .
#   docker run -p 3000:3000 --env-file .env.production samrux
#
# Three stages: deps (cacheable install), build (standalone output), runtime
# (distroless-thin node:alpine with only the traced files). The final image is
# ~200 MB and runs as a non-root user.
# ============================================================================

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --ignore-scripts && npx prisma generate

FROM node:22-alpine AS build
WORKDIR /app
ENV DOCKER_BUILD=1 NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0

RUN addgroup -S samrux && adduser -S samrux -G samrux
USER samrux

COPY --from=build --chown=samrux:samrux /app/.next/standalone ./
COPY --from=build --chown=samrux:samrux /app/.next/static ./.next/static
COPY --from=build --chown=samrux:samrux /app/public ./public

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
