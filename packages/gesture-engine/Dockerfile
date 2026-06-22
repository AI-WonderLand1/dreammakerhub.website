FROM node:18-alpine
RUN apk add --no-cache ts-node typescript
WORKDIR /app
COPY package.json tsconfig.json ./ 
RUN npm ci --type=module
COPY src ./src
RUN npm run build
VOLUME /mock-data
CMD ["node", "./dist/index.js"]