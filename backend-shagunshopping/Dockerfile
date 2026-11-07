# ================================
# Multi-stage Production Dockerfile: Backend API
# ================================
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# ================================
# Production Runner
# ================================
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5001

# Add curl for container healthchecks
RUN apk add --no-cache curl

# Security: Run as unprivileged node user
USER node

COPY --chown=node:node package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --chown=node:node --from=builder /app/src ./src

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:5001/api/health || exit 1

CMD ["node", "src/server.js"]

