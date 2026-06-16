FROM node:20-alpine AS builder
WORKDIR /app

<<<<<<< HEAD
# Copy only package files for a clean install
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Copy the whole repo (including workspace) and build the web app
=======
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
>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
COPY . .
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
<<<<<<< HEAD
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.js ./
COPY --from=builder /app/apps/web/package*.json ./
# Install production deps (only what the web app needs)
RUN npm ci --omit=dev
EXPOSE 5000
=======

# Copy built app artifacts
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder /app/apps/web/package.json ./package.json

# Copy workspace structure so @wonderspace/ide-engine resolves at runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

>>>>>>> 72119c4dfe138606f92bafa58b8eca713140e786
CMD ["npm", "run", "start"]
