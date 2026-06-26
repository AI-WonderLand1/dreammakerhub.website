FROM node:20.20-alpine AS builder
WORKDIR /app

# Copy all workspace package files for proper npm ci resolution
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ide-engine/package*.json ./packages/ide-engine/
COPY packages/optimizer/package*.json ./packages/optimizer/
COPY packages/perf-assets/package*.json ./packages/perf-assets/
COPY packages/wonder-runtime/package*.json ./packages/wonder-runtime/

# Copy monorepo source directories BEFORE npm install
# This ensures path aliases can resolve during build
COPY engine ./engine
COPY infra ./infra
COPY runners ./runners
COPY ui ./ui
COPY types ./types
COPY apps/web/ai-modules ./apps/web/ai-modules
COPY apps/web/data ./apps/web/data
COPY apps/web/styles ./apps/web/styles
COPY apps/web/components ./apps/web/components

# Copy prisma schema for postinstall (prisma generate)
COPY prisma ./prisma
COPY prisma.config.ts ./

# Copy tsconfig and config files needed for build
COPY tsconfig.base.json ./
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.mjs ./apps/web/

RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm install --legacy-peer-deps

# Copy the rest of the app source
COPY apps/web ./apps/web

# Build Next.js app
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app

# Copy built app artifacts
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder /app/apps/web/package.json ./package.json

# Copy workspace structure so @wonderspace/ide-engine resolves at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/templates ./templates

# Copy engine, infra, runners, ui, types for monorepo imports at runtime
COPY --from=builder /app/engine ./engine
COPY --from=builder /app/infra ./infra
COPY --from=builder /app/runners ./runners
COPY --from=builder /app/ui ./ui
COPY --from=builder /app/types ./types
COPY --from=builder /app/apps/web/ai-modules ./apps/web/ai-modules
COPY --from=builder /app/apps/web/data ./apps/web/data
COPY --from=builder /app/apps/web/styles ./apps/web/styles
COPY --from=builder /app/apps/web/components ./apps/web/components

EXPOSE 5000
ENV PATH="/app/node_modules/.bin:$PATH"
RUN apk add --no-cache curl
HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=3 CMD curl -f http://localhost:5000/health || exit 1
CMD ["sh", "-c", "next start -p ${PORT:-5000} -H 0.0.0.0"]
