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
    && rm -rf /var/lib/apt/lists/*

RUN curl -L https://coder.com/install.sh | sh

COPY Docker-image/workspace-image.tar /opt/workspace-image.tar
COPY Docker-image/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

COPY Docker-image/templates/ /opt/templates/
COPY coder.env /etc/coder.env.tpl

RUN mkdir -p /var/lib/postgresql/data /var/run/postgresql \
    && chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql

EXPOSE 7080

VOLUME ["/var/lib/postgresql/data"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]