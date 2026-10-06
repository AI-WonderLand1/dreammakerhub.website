FROM codercom/enterprise-base:ubuntu

USER root

ENV DEBIAN_FRONTEND=noninteractive

# Common development toolchain baked into every AI WONDERLAND IDE workspace.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      bash \
      build-essential \
      ca-certificates \
      curl \
      git \
      gnupg \
      jq \
      less \
      make \
      nano \
      openssh-client \
      pkg-config \
      python3 \
      python3-pip \
      python3-venv \
      ripgrep \
      rsync \
      sqlite3 \
      tmux \
      unzip \
      vim \
      wget \
      zip \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && npm install --global pnpm@10 typescript \
    && npm cache clean --force \
    && rm -rf /var/lib/apt/lists/*

# Persistent-home defaults. /home/coder is mounted from a Docker volume at runtime.
RUN mkdir -p \
      /home/coder/projects \
      /home/coder/.filebrowser \
      /home/coder/.local/bin \
      /home/coder/.local/lib \
      /home/coder/.cache/pip \
      /home/coder/.npm-global \
      /home/coder/.npm-cache \
      /home/coder/.local/share/pnpm \
      /home/coder/.cache/pnpm \
      /home/coder/.cache/yarn \
      /home/coder/.cache/bun \
    && chown -R coder:coder /home/coder

COPY entrypoint.sh /coder-entrypoint.sh
RUN chmod 0755 /coder-entrypoint.sh

# The entrypoint repairs persistent-volume ownership as root, then launches
# the Coder init script as the unprivileged coder user.
ENTRYPOINT ["/coder-entrypoint.sh"]
