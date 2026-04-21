# Database Configuration

## Structure
- `init.sql` - Initial schema and data
- `migrations/` - Database migrations
- `backups/` - Backup scripts
- `README.md` - This file

## Database Setup

### PostgreSQL Configuration
- User: `postgres`
- Password: `changeme` (set in .env)
- Database: `appdb`
- Port: 5432

### Initial Schema
Tables to create in Phase 2:
- `users` - User data
- `logs` - Application logs
- `backups` - Backup metadata

### Connection String
```
postgresql://postgres:changeme@postgres:5432/appdb
```

## Phase 2 Tasks
- [ ] Create init.sql with schema
- [ ] Create users table
- [ ] Create indexes
- [ ] Test connection from backend

## Backup Strategy
- Daily backups at 2:00 AM
- Retention: 30 days
- Storage: Kubernetes PVC or S3

### Backup Command
```bash
pg_dump -h postgres -U postgres -d appdb > backup.sql
```

### Restore Command
```bash
psql -h postgres -U postgres -d appdb < backup.sql
```
