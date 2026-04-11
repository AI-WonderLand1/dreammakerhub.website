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
    && npm install -g npm@latest

# Install global tools
RUN npm install -g typescript ts-node nodemon

# Install Docker CLI (for docker-in-docker)
RUN curl -fsSL https://get.docker.com -o /tmp/get-docker.sh \
    && sh /tmp/get-docker.sh \
    && rm /tmp/get-docker.sh

# Create non-root user (if not exists)
RUN (id coder &>/dev/null || useradd -m -s /bin/bash coder) \
    && usermod -aG docker coder || true

# Switch to coder user
USER coder

# Set up workspace directory
WORKDIR /home/coder/project

# Copy post-start script
COPY --chown=coder:coder ../post-start.sh /home/coder/project/post-start.sh

# Configure git
RUN git config --global init.defaultBranch main \
    && git config --global pull.rebase false

USER root

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

USER coder

CMD ["sh", "/home/coder/project/post-start.sh"]