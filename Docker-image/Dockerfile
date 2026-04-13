FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    ca-certificates \
    gnupg \
    lsb-release \
    software-properties-common \
    postgresql-14 \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://coder.com/install.sh | sh

RUN curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update \
    && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*


COPY Docker-image/workspace-image.tar /opt/workspace-image.tar
COPY Docker-image/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY Docker-image/templates/ /opt/templates/
COPY Docker-image/config/Caddyfile /etc/caddy/Caddyfile
COPY coder.env /etc/coder.env.tpl

RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql \
    && chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

RUN mkdir -p /root/.local/share/caddy

EXPOSE 7080 443 80 8888

VOLUME ["/var/lib/postgresql/data", "/root/.local/share/caddy"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]