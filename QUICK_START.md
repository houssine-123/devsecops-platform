# 🎬 Phase 2 - QUICK START GUIDE

## ⏱️ 5 Minutes to Running Application

### Step 1: Navigate to Project (30 seconds)

```powershell
cd c:\Users\User\Desktop\pfe
```

### Step 2: Run Startup Script (1 minute)

**Windows (PowerShell):**
```powershell
.\start-phase2.ps1
```

**Linux/Mac:**
```bash
bash start-phase2.sh
```

**Manual:**
```powershell
docker-compose up -d
```

### Step 3: Wait for Services (1-2 minutes)

```powershell
# Watch logs
docker-compose logs -f

# Or check status
docker-compose ps

# Wait until all show "healthy" or "running"
```

### Step 4: Open Application (30 seconds)

Open your browser:

```
http://localhost:3000  ← Frontend
```

You should see:
- ✅ Backend Status: "Connected"
- ✅ User List (with 2 sample users)
- ✅ Create User Form

### Step 5: Test CRUD Operations (1 minute)

**Create User:**
1. Enter Name: "John Smith"
2. Enter Email: "john@example.com"
3. Click "Ajouter" (Add)
4. ✅ New user appears in the table

**Delete User:**
1. Click "🗑️ Supprimer" (Delete) on any user
2. Confirm deletion
3. ✅ User disappears

---

## 🔍 What You Created

### Backend (Node.js Express)
```
app/backend/
├── package.json          ← Dépendances (Express, PostgreSQL, CORS)
├── server.js             ← 🎯 Serveur API (8 endpoints)
├── .env                  ← Configuration
└── Dockerfile            ← Image Docker
```

**8 Endpoints créés:**
```
✓ GET  /api/health          → Check server status
✓ GET  /api/ready           → Kubernetes probe
✓ GET  /api/metrics         → For Prometheus
✓ POST /api/users           → Create user
✓ GET  /api/users           → List users
✓ GET  /api/users/:id       → Get specific user
✓ PUT  /api/users/:id       → Update user
✓ DELETE /api/users/:id     → Delete user
```

### Frontend (React + Vite)
```
app/frontend/
├── package.json          ← Dependencies (React, Vite, Axios)
├── src/
│   ├── main.jsx          ← Entry point
│   ├── App.jsx           ← 🎯 Main component (CRUD UI)
│   ├── App.css           ← Responsive styles
│   └── api.js            ← HTTP client
├── index.html            ← Base HTML
├── Dockerfile            ← Build + Nginx
└── nginx.conf            ← Web server config
```

**Features:**
- ✅ User management table
- ✅ Create/Read/Update/Delete operations
- ✅ Backend connection status indicator
- ✅ Responsive design (mobile-friendly)
- ✅ Error handling
- ✅ Loading states

### Infrastructure
```
docker-compose.yml (UPDATED)
├── postgres (5432)       ← Database
├── backend  (5000)       ← Node.js API
├── frontend (3000)       ← React + Nginx
├── adminer  (8080)       ← DB UI
├── prometheus (9090)     ← Metrics
├── grafana (4000)        ← Dashboards
├── alertmanager (9093)   ← Alerts
└── node-exporter (9100)  ← System metrics
```

---

## 🧪 Testing Phase 2

### Test 1: Backend Health

```powershell
# Check if backend responds
curl http://localhost:5000/api/health

# Expected response:
# {"status":"up","timestamp":"2026-05-09T...","uptime":123}
```

### Test 2: Frontend Connection

```powershell
# Open in browser
http://localhost:3000

# You should see:
# ✓ "Backend: ✓ Connected" (green)
# ✓ 2 sample users listed
# ✓ Create form available
```

### Test 3: Create User (Full CRUD)

```powershell
# Option 1: Via Frontend UI
# 1. Go to http://localhost:3000
# 2. Fill form: Name="Alice", Email="alice@test.com"
# 3. Click "Ajouter"
# 4. ✓ Alice appears in the table

# Option 2: Via Backend API
curl -X POST http://localhost:5000/api/users `
  -H "Content-Type: application/json" `
  -d '{"name":"Bob","email":"bob@test.com"}'

# Verify it works
curl http://localhost:5000/api/users
```

### Test 4: Monitoring

```powershell
# Prometheus metrics from backend
curl http://localhost:5000/api/metrics

# Should show:
# app_uptime_seconds 45
# app_requests_total 123
# app_errors_total 0
# app_users_total 4
```

---

## 📊 Ports Allocated

| Port | Service | URL |
|------|---------|-----|
| 3000 | Frontend (React) | http://localhost:3000 |
| 4000 | Grafana Dashboard | http://localhost:4000 |
| 5000 | Backend API | http://localhost:5000 |
| 5432 | PostgreSQL | localhost:5432 |
| 8080 | Adminer (DB UI) | http://localhost:8080 |
| 9090 | Prometheus | http://localhost:9090 |
| 9093 | AlertManager | http://localhost:9093 |
| 9100 | NodeExporter | http://localhost:9100 |

---

## 🛑 Stop & Clean Up

### Stop Services (keep data):
```powershell
docker-compose stop
```

### Stop & Remove Containers (keep volumes):
```powershell
docker-compose down
```

### Remove Everything (delete all data):
```powershell
docker-compose down -v
```

---

## ⚡ Useful Commands

```powershell
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# Check status
docker-compose ps

# Restart a service
docker-compose restart backend

# Enter a container
docker exec -it devsecops-backend sh

# Check running services
docker ps

# View container stats
docker stats
```

---

## ✨ Phase 2 Highlights

✅ **Backend API** - 8 endpoints, health checks, metrics  
✅ **Frontend UI** - React app with CRUD operations  
✅ **Docker** - Multi-stage builds, optimized images  
✅ **Orchestration** - docker-compose with all services  
✅ **Monitoring** - Prometheus metrics & Grafana dashboards  
✅ **Scripts** - Automated startup (Windows & Linux)  
✅ **Documentation** - Complete guides & README  
✅ **No Dependencies Missing** - Production-ready code  

---

## 🚨 Common Issues & Solutions

### ❌ Port Already in Use

```powershell
# Error: port 3000 already in use
# Solution:
docker-compose down -v
docker-compose up -d
```

### ❌ Backend Connection Failed

```powershell
# Frontend shows: "Backend: ✗ Disconnected"
# Solution:
docker-compose logs backend
docker-compose restart backend
```

### ❌ Cannot Access Frontend

```powershell
# Error: Connection refused on localhost:3000
# Check if frontend is running:
docker-compose ps
docker logs devsecops-frontend
```

### ❌ Docker Not Running

```powershell
# Error: Cannot connect to Docker daemon
# Solution: Start Docker Desktop
# Wait 30 seconds and try again
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| PHASE_2_README.md | Complete Phase 2 guide |
| PHASE_2_SUMMARY.md | What's new summary |
| QUICK_START.md | This file |
| docs/ARCHITECTURE.md | System design |
| docs/CAHIER_DES_CHARGES.md | Requirements |

---

## 🎯 Next Steps

### Short Term (Next 30 minutes)
1. Run the application
2. Test CRUD operations
3. Check monitoring (Prometheus, Grafana)
4. Review the code in `app/backend/server.js` and `app/frontend/src/App.jsx`

### Medium Term (Phase 3)
1. Integrate real PostgreSQL database
2. Deploy to local Kubernetes
3. Add integration tests
4. Implement logging

### Long Term (Phase 4+)
1. Add authentication (JWT)
2. Implement CI/CD pipeline (Jenkins)
3. Add security scanning (Trivy, SonarQube)
4. Production deployment

---

## 💡 Tips & Tricks

**Tip 1: View Real-time Logs**
```powershell
docker-compose logs -f  # See everything happening
```

**Tip 2: Debug with Container Shell**
```powershell
docker exec -it devsecops-backend sh
# Now inside the container, run: npm list
```

**Tip 3: Test API with curl**
```powershell
# Get all users
curl http://localhost:5000/api/users | ConvertFrom-Json

# Delete user
curl -X DELETE http://localhost:5000/api/users/1
```

**Tip 4: Rebuild Images**
```powershell
# If you modified code
docker-compose build --no-cache
docker-compose up -d
```

---

## ✅ Phase 2 Verification Checklist

- [ ] Services start without errors
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend health check responds
- [ ] User list displays 2 sample users
- [ ] Can create a new user via UI
- [ ] Can delete a user
- [ ] Prometheus can scrape metrics
- [ ] Grafana dashboard accessible at http://localhost:4000
- [ ] No errors in `docker-compose logs`
- [ ] Code is committed to Git

---

**Phase 2 Status**: ✅ READY TO USE  
**Start Time**: < 5 minutes  
**Next Phase**: Phase 3 - Kubernetes Deployment  

Bon courage! 🚀
