FROM node:20-slim

WORKDIR /app

COPY packages/wonder-runtime/package*.json ./packages/wonder-runtime/
WORKDIR /app/packages/wonder-runtime
RUN npm install --omit=dev --ignore-scripts

WORKDIR /app

COPY apps/web/public/webglstudio /app/public/webglstudio
COPY apps/web/public/playcanvas /app/public/playcanvas

WORKDIR /app/packages/wonder-runtime

EXPOSE 3090

CMD ["node", "src/server.js"]