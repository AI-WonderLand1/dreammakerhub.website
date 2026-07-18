FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
COPY packages/engine-core/package.json packages/engine-core/
COPY packages/plugin-sdk/package.json packages/plugin-sdk/
COPY packages/ai-npc/package.json packages/ai-npc/
COPY packages/marketplace/package.json packages/marketplace/
COPY packages/multiplayer/package.json packages/multiplayer/
COPY packages/video-streaming/package.json packages/video-streaming/
RUN pnpm install --frozen-lockfile

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/*/node_modules ./packages/
COPY . .
RUN pnpm --filter @spatial/core build
RUN pnpm --filter @spatial/engine-core build
RUN pnpm --filter @spatial/plugin-sdk build
RUN pnpm --filter @spatial/ai-npc build
RUN pnpm --filter @spatial/marketplace build
RUN pnpm --filter @spatial/multiplayer build
RUN pnpm --filter @spatial/video-streaming build
RUN pnpm --filter @spatial/web build

FROM base AS runner
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node_modules/.bin/next", "start"]
