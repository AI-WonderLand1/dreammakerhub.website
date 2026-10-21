# Python/AI integration IDE. Heavy GPU training runs on an external GPU worker.
ARG BASE_IMAGE=ghcr.io/ai-wonderland1/ai-wonderland-coder-workspace:latest
FROM ${BASE_IMAGE}
USER root
RUN python3 -m venv /opt/wonderland-python \
    && /opt/wonderland-python/bin/python -m pip install --no-cache-dir \
      'fastapi>=0.115,<1' 'uvicorn>=0.30,<1' 'httpx>=0.27,<1' 'pydantic>=2,<3'
ENV PATH="/opt/wonderland-python/bin:${PATH}"
# No Docker socket, cloud secrets or GPU device access is added.
