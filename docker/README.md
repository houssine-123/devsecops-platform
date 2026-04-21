# Docker Configuration

## Structure
- `Dockerfile.frontend` - Frontend image
- `Dockerfile.backend` - Backend image
- `Dockerfile.postgres` - Custom PostgreSQL (if needed)
- `.dockerignore` - Files to exclude from build

## Docker Best Practices

### Multi-stage Builds
```dockerfile
FROM node:18 AS builder
WORKDIR /build
COPY package*.json ./
RUN npm ci --legacy-peer-deps

FROM nginx:alpine
COPY --from=builder /build/dist /usr/share/nginx/html
```

### Security
- Use specific base image versions (not latest)
- Run as non-root user
- Minimize layers
- Remove unnecessary packages

### Optimization
- Order Dockerfile commands by frequency of change
- Use .dockerignore to exclude large files
- Leverage layer caching

## Phase 3 Tasks
- [ ] Create Dockerfile for frontend
- [ ] Create Dockerfile for backend
- [ ] Test: `docker build -t app:latest .`
- [ ] Test: `docker run -p 3000:3000 app:latest`
- [ ] Push to registry

## Registry
- Repository: `docker.io/yourusername`
- Images:
  - `yourusername/app-frontend:latest`
  - `yourusername/app-backend:latest`
  - `yourusername/app-postgres:latest`
