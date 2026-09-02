# =====================================================================
# NXC-NICO Multi-Stage Production Containerfile
# =====================================================================

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build essentials for native bindings if required
RUN apk add --no-cache python3 make g++ git

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install Docker CLI and Git so NICO can orchestrate local or DinD environments
RUN apk add --no-cache \
    docker-cli \
    git \
    openssh-client \
    curl \
    ca-certificates

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

# Create unprivileged runtime user (Docker socket permissions mounted via group or DinD tcp)
RUN addgroup -g 1001 -S nico && \
    adduser -u 1001 -S nico -G nico && \
    mkdir -p /app/sandboxes && \
    chown -R nico:nico /app

USER nico

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["node", "dist/index.js"]
