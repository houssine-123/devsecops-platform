# Backend API Application

## Structure
- `src/` - Source code
  - `routes/` - API endpoints
  - `controllers/` - Business logic
  - `models/` - Data models
  - `middleware/` - Custom middleware
  - `config/` - Configuration
  - `utils/` - Utility functions
- `tests/` - Unit tests
- `package.json` / `requirements.txt` / `pom.xml` - Dependencies
- `Dockerfile` - Container image
- `.env` - Environment variables

## Endpoints to Create
- `GET /api/health` - Health check (Kubernetes liveness)
- `GET /api/ready` - Readiness check
- `GET /metrics` - Prometheus metrics
- `POST /api/users` - Create user
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Phase 2 Tasks
- [ ] Initialize project (Node/Python/Java)
- [ ] Create basic API structure
- [ ] Create database models
- [ ] Implement CRUD endpoints
- [ ] Add Prometheus metrics exporter
- [ ] Create Dockerfile
- [ ] Test locally

## Expected Results
- npm start / python app.py / mvn spring-boot:run works
- Accessible at http://localhost:5000
- Health check works: GET /api/health
