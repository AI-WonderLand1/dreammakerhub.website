FROM node:20-alpine AS builder
WORKDIR /app

# Copy only package files for a clean install
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
RUN npm ci

# Copy the whole repo (including workspace) and build the web app
COPY . .
WORKDIR /app/apps/web
RUN npm run build

# Production image
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/next.config.js ./
COPY --from=builder /app/apps/web/package*.json ./
# Install production deps (only what the web app needs)
RUN npm ci --omit=dev
EXPOSE 5000
CMD ["npm", "run", "start"]
