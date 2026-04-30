# WonderSpace Runtime - Merged PlayCanvas + WebGL Studio + glTF Optimizer
FROM node:20-slim

LABEL maintainer="WonderSpace"
LABEL description="Unified 3D editor runtime combining WebGL Studio, PlayCanvas, and glTF optimization"

WORKDIR /app

# Install system dependencies for sharp image processing + WebGL software rendering
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libgl1-mesa-glx \
    libgl1-mesa-dri \
    mesa-utils \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY packages/wonder-runtime/package*.json ./packages/wonder-runtime/
COPY packages/optimizer/package*.json ./packages/optimizer/

# Install runtime dependencies
WORKDIR /app/packages/wonder-runtime
RUN npm install --omit=dev --ignore-scripts

# Install optimizer dependencies
WORKDIR /app/packages/optimizer
RUN npm install --omit=dev --ignore-scripts

# Copy all source code
WORKDIR /app
COPY packages/wonder-runtime/src/ ./packages/wonder-runtime/src/
COPY packages/optimizer/src/ ./packages/optimizer/src/

# Copy WebGL Studio editor assets
COPY apps/web/public/webglstudio ./public/webglstudio

# Copy PlayCanvas integration (Theatre.js bridge)
COPY apps/web/public/playcanvas ./public/playcanvas

# Create directories for user project files
RUN mkdir -p /app/user-project /app/logs

# Expose runtime port
EXPOSE 3090

# Environment defaults
ENV NODE_ENV=production
ENV PROJECT_ID=default
ENV USER_FILES_PATH=/app/user-project
ENV EDITOR_PATH=/app/public/webglstudio
ENV PLAYCANVAS_PATH=/app/public/playcanvas

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3090/health || exit 1

# Set display for Xvfb (virtual framebuffer for WebGL)
ENV DISPLAY=:99

# Start Xvfb and runtime server
CMD ["sh", "-c", "Xvfb :99 -screen 0 1024x768x24 & sleep 1 && node packages/wonder-runtime/src/server.js"]