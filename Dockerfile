FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY client/package*.json ./client/
RUN cd client && npm install

COPY . .
RUN npm run build

# ── Production image ──
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

COPY server/ ./server/
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 8080
ENV NODE_ENV=production

CMD ["node", "server/index.js"]
