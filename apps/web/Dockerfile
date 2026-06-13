FROM node:20-alpine AS builder
WORKDIR /app

# Copy all workspace package files for proper npm ci resolution
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ide-engine/package*.json ./packages/ide-engine/
COPY packages/optimizer/package*.json ./packages/optimizer/
COPY packages/perf-assets/package*.json ./packages/perf-assets/
COPY packages/wonder-runtime/package*.json ./packages/wonder-runtime/

# Copy prisma schema for postinstall (prisma generate)
COPY prisma ./prisma

RUN DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm ci

# Copy the whole repo and build
COPY . .
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

CMD ["npm", "run", "start"]
