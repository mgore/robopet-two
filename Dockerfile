# syntax=docker/dockerfile:1

# ---- build: Vite client + bundled Express server ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Optional build-time Firebase override (Vite inlines VITE_* at build time)
ARG VITE_FIREBASE_API_KEY=""
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
RUN npm run build

# ---- runtime: production deps only (server is bundled with --packages=external) ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public
COPY --from=build /app/firebase-applet-config.json ./firebase-applet-config.json
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/ >/dev/null || exit 1
CMD ["node", "dist/server.cjs"]
