-- DevSecOps PFE - Database Initialization
-- Schema mirrors what the backend's initDatabase() creates so both are idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS servers (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name             VARCHAR(255) NOT NULL UNIQUE,
    ip               VARCHAR(45)  NOT NULL,
    location         VARCHAR(100) NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'online'
                         CHECK (status IN ('online', 'degraded', 'offline')),
    cpu              DECIMAL(5,2) DEFAULT 0,
    memory           DECIMAL(5,2) DEFAULT 0,
    disk             DECIMAL(5,2) DEFAULT 0,
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags             TEXT[],
    created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL UNIQUE,
    type            VARCHAR(100) NOT NULL,
    running_on      UUID REFERENCES servers(id) ON DELETE CASCADE,
    status          VARCHAR(20)  NOT NULL DEFAULT 'running'
                        CHECK (status IN ('running', 'stopped', 'degraded')),
    owner           VARCHAR(255) NOT NULL,
    last_deployment TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    severity    VARCHAR(20) NOT NULL DEFAULT 'warning'
                    CHECK (severity IN ('info', 'warning', 'critical')),
    description TEXT,
    status      VARCHAR(20) NOT NULL DEFAULT 'new'
                    CHECK (status IN ('new', 'acknowledged', 'resolved')),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('server', 'service')),
    entity_id   UUID NOT NULL,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data
INSERT INTO servers (name, ip, location, status, cpu, memory, disk, tags) VALUES
    ('web-server-01',  '10.0.1.10', 'datacenter-paris',  'online',   35.5, 62.3, 45.1, ARRAY['web',      'production']),
    ('api-server-01',  '10.0.1.11', 'datacenter-paris',  'online',   48.2, 71.5, 55.8, ARRAY['api',      'production']),
    ('db-server-01',   '10.0.1.12', 'datacenter-london', 'degraded', 82.1, 88.4, 72.3, ARRAY['database', 'production'])
ON CONFLICT (name) DO NOTHING;
