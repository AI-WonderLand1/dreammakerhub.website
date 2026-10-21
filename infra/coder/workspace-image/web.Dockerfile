# Full-stack websites and apps, not a privileged Docker-in-Docker environment.
ARG BASE_IMAGE=ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest
FROM ${BASE_IMAGE}
USER root
RUN npm install --global vite@6 tsx@4 eslint@9 \
    && npm cache clean --force
# Keep the inherited unprivileged Coder entrypoint and persistent /home/coder.
