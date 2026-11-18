# Stage 1: Build
FROM node:20-alpine AS builder

# Numéro de build injecté par Jenkins — affiché dans le footer de l'app
ARG VITE_BUILD_NUMBER=dev
ENV VITE_BUILD_NUMBER=$VITE_BUILD_NUMBER

WORKDIR /build

# Versions figées par le lockfile (constructions reproductibles)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Runtime with nginx (non-root)
FROM nginx:alpine

# Utilisateur non-root avec UID numérique fixe (vérifiable par runAsNonRoot)
RUN addgroup -S -g 10001 nginxgroup && adduser -S -u 10001 -G nginxgroup nginxuser

COPY nginx.conf /etc/nginx/nginx.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=builder /build/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf && \
    chown -R nginxuser:nginxgroup /usr/share/nginx/html && \
    chown -R nginxuser:nginxgroup /var/cache/nginx && \
    chown -R nginxuser:nginxgroup /var/log/nginx

# PID et fichiers temporaires dans /tmp : compatible readOnlyRootFilesystem
USER 10001

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
