# Stage 1: Builder — dépendances de production uniquement, versions figées par le lockfile
FROM node:20-alpine AS builder

WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

# Stage 2: Runtime
FROM node:20-alpine

# curl : healthcheck Docker Compose ; docker-cli : fonction "auto-deploy"
# (utilisée uniquement en Docker Compose, où le socket Docker est monté)
# apk upgrade : correctifs de sécurité Alpine publiés après l'image de base.
# npm, npx, corepack et yarn sont retirés : inutiles à l'exécution (CMD node)
# et porteurs de vulnérabilités (tar, minimatch, cross-spawn...).
RUN apk upgrade --no-cache && \
    apk add --no-cache curl docker-cli && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

WORKDIR /app

COPY --from=builder --chown=1000:1000 /build /app

# Exécution sans privilèges : utilisateur "node" (uid 1000) fourni par l'image.
# UID numérique pour que Kubernetes puisse vérifier runAsNonRoot.
USER 1000

ENV NODE_ENV=production

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {if (r.statusCode !== 200) process.exit(1)}).on('error', () => process.exit(1))"

# node directement (pas npm) : signaux SIGTERM transmis, aucune écriture disque au démarrage
CMD ["node", "server.js"]
