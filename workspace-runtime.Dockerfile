FROM node:20-bookworm-slim

ARG BUILD_DATE
ARG VCS_REF

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && apt-get install -y --no-install-recommends \
    git openssh-client ca-certificates tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /workspace

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/ ./packages/
RUN npm ci

COPY . .

RUN useradd -m -u 10001 wonder && chown -R wonder:wonder /workspace
USER wonder

EXPOSE 3000 3001 3002

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/healthz || exit 1

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["bash", "-lc", "./scripts/workspace-runtime/start-all.sh"]

LABEL org.opencontainers.image.title="WonderPlay Runtime" \
      org.opencontainers.image.description="Per-user isolated PlayCanvas + WebGL IDE workspace" \
      org.opencontainers.image.source="https://github.com/dreammakerhub/ai-wonderland" \
      org.opencontainers.image.created="$BUILD_DATE" \
      org.opencontainers.image.version="$VCS_REF"