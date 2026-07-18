#!/bin/bash
set -e

echo "Starting Spatial Platform development environment..."

# Check dependencies
command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required. Install: npm install -g pnpm"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required for infrastructure services"; exit 1; }

# Install dependencies
pnpm install

# Start infrastructure (PostgreSQL, Redis, MinIO)
echo "Starting infrastructure services..."
docker compose up -d postgres redis minio

# Wait for services
echo "Waiting for services to be ready..."
sleep 3

# Run database migrations
echo "Running database migrations..."
# (add migration command here when migration files exist)

# Start development servers
echo "Starting API and Web development servers..."
pnpm dev
