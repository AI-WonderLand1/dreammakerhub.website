FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/core/package.json packages/core/
COPY packages/ai-npc/package.json packages/ai-npc/
COPY packages/marketplace/package.json packages/marketplace/
COPY packages/multiplayer/package.json packages/multiplayer/
COPY packages/video-streaming/package.json packages/video-streaming/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY . .
RUN pnpm --filter @spatial/core build
RUN pnpm --filter @spatial/ai-npc build
RUN pnpm --filter @spatial/marketplace build
RUN pnpm --filter @spatial/multiplayer build
RUN pnpm --filter @spatial/video-streaming build
RUN pnpm --filter @spatial/api build

FROM base AS runner
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/index.js"]
