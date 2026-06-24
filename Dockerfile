# =============================================
# Build Stage: Install deps & compile assets
# =============================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build React frontend + Express backend
RUN npm run build

# =============================================
# Production Stage: Minimal runtime image
# =============================================
FROM node:20-alpine AS runner
WORKDIR /app

# Copy production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/firebase-applet-config.json ./firebase-applet-config.json

# Environment
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/server.cjs"]
