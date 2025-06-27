# --- Stage 1: Build client assets ---
FROM node:20-bullseye AS client-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
WORKDIR /app/client
RUN npm ci && npm run build

# --- Stage 2: Final production image ---
FROM node:20-bullseye

WORKDIR /app
ENV NODE_ENV=production

COPY --from=client-builder /app /app

RUN npm ci --omit=dev

EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
