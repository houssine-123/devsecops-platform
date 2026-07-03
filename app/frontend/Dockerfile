# Stage 1: Build
FROM node:20-alpine AS builder

# Numéro de build injecté par Jenkins — affiché dans le footer de l'app
ARG VITE_BUILD_NUMBER=dev
ENV VITE_BUILD_NUMBER=$VITE_BUILD_NUMBER

WORKDIR /build

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime with nginx (non-root)
FROM nginx:alpine

# Create non-root user for nginx
RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /build/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf && \
    chown -R nginxuser:nginxgroup /usr/share/nginx/html && \
    chown -R nginxuser:nginxgroup /var/cache/nginx && \
    chown -R nginxuser:nginxgroup /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown nginxuser:nginxgroup /var/run/nginx.pid

USER nginxuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
