# ─── Build stage ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

ARG NUXT_PUBLIC_API_BASE=http://localhost:3001
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE

ARG NUXT_PUBLIC_UMAMI_ID=""
ENV NUXT_PUBLIC_UMAMI_ID=$NUXT_PUBLIC_UMAMI_ID

ARG NUXT_PUBLIC_UMAMI_URL=""
ENV NUXT_PUBLIC_UMAMI_URL=$NUXT_PUBLIC_UMAMI_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ─── Runtime stage ────────────────────────────────────────────────────────────
FROM node:22-alpine

WORKDIR /app

COPY --from=builder /app/.output ./.output

EXPOSE 3000

ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
