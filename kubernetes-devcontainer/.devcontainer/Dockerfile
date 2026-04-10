FROM codercom/code-server:latest

USER root

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    unzip \
    python3 \
    python3-pip \
    build-essential \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js 20
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g pnpm

# Install global tools
RUN npm install -g typescript ts-node nodemon

# Install PlayCanvas CLI
RUN npm install -g @playcanvas/cli

# Install Docker CLI (for docker-in-docker)
RUN curl -fsSL https://get.docker.com -o /tmp/get-docker.sh \
    && sh /tmp/get-docker.sh \
    && rm /tmp/get-docker.sh

# Create non-root user
RUN useradd -m -s /bin/bash coder \
    && usermod -aG docker coder

# Switch to coder user
USER coder

# Set up workspace directory
WORKDIR /home/coder/project

# Copy entrypoint (if exists)
COPY --chown=coder:coder .devcontainer/post-create.sh /tmp/

# Configure git
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false

USER root

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

USER coder

CMD ["sh", "/home/coder/project/.devcontainer/post-start.sh"]