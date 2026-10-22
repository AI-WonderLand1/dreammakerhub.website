# PlayCanvas/WebGL asset editing toolchain; browser-based rendering stays client-side.
ARG BASE_IMAGE=ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest
FROM ${BASE_IMAGE}
USER root
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global vite@6 \
    && npm cache clean --force
# Unreal/Windows builds and GPU 3D inference require separate, qualified workers.
