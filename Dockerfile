# Use the latest Bun image
FROM oven/bun:1-alpine AS base

# Install only essential dependencies
RUN apk add --no-cache \
    libc6-compat \
    ca-certificates \
    && rm -rf /var/cache/apk/*

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
FROM base AS deps
RUN bun install --frozen-lockfile

# Build stage
FROM deps AS builder
COPY . .

# Set environment for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN bun run build

# Production stage
FROM base AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "server.js"]