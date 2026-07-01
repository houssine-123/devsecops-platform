# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json ./
RUN npm install

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

RUN apk add --no-cache curl docker-cli

WORKDIR /app

COPY --from=builder /build/node_modules ./node_modules
COPY --from=builder /build .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

CMD ["npm", "start"]
