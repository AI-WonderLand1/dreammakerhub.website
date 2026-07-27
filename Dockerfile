FROM node:20.20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ide-engine/package*.json ./packages/ide-engine/
COPY packages/optimizer/package*.json ./packages/optimizer/
COPY packages/perf-assets/package*.json ./packages/perf-assets/
COPY packages/wonder-runtime/package*.json ./packages/wonder-runtime/

COPY prisma ./prisma
COPY prisma.config.ts ./

COPY packages/ide-engine/src ./packages/ide-engine/src/

RUN rm -f package-lock.json && DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy npm install --legacy-peer-deps

COPY engine ./engine
COPY infra ./infra
COPY runners ./runners
COPY ui ./ui
COPY types ./types
COPY apps/web/ai-modules ./apps/web/ai-modules
COPY apps/web/data ./apps/web/data
COPY apps/web/styles ./apps/web/styles
COPY apps/web/components ./apps/web/components
COPY tsconfig.base.json ./
COPY apps/web/tsconfig.json ./apps/web/
COPY apps/web/next.config.mjs ./apps/web/
COPY apps/web ./apps/web

WORKDIR /app/apps/web
ENV NEXT_TURBOPACK=disable
ENV ALICE_API_KEY=dummy
ENV SIMPLE_RICK_API_KEY=dummy
ENV SPIRIT_GUIDE_API_KEY=dummy
ENV MONGODB_URI=dummy
ENV DATABASE_URL=postgresql://dummy:dummy@localhost:5432/dummy
RUN npm run build

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.mjs ./next.config.mjs
COPY --from=builder /app/apps/web/package.json ./package.json

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps ./apps

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
RUN apk add --no-cache curl openssh-client
HEALTHCHECK --interval=10s --timeout=10s --start-period=30s --retries=3 CMD curl -f http://localhost:${PORT:-5000}/health || exit 1
CMD ["sh", "-c", "next start -p ${PORT:-5000} -H 0.0.0.0"]