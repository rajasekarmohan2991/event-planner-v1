# Use Node.js 20 Debian Slim for Prisma engine (glibc) compatibility
FROM node:20-bullseye-slim AS base

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       openssl \
       ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# First copy only package files
COPY package.json package-lock.json ./
COPY prisma ./prisma

# Install application dependencies and generate Prisma client
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
RUN npm install --legacy-peer-deps --no-audit --no-fund \
    && npx prisma generate

# Copy rest of the files
COPY . .

# Clean any existing build artifacts
RUN rm -rf .next

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production stage
FROM node:20-bullseye-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV INTERNAL_API_BASE_URL=http://api:8080
ENV NEXTAUTH_URL=http://localhost:3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=base --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=base --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=base --chown=nextjs:nodejs /app/public ./public
COPY --from=base --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=base --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=base --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Ensure the animations directory exists and has the correct permissions
RUN mkdir -p /app/public/animations \
    && chown -R nextjs:nodejs /app/public/animations

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
