-- Setup Test Users for All Roles
-- Password for all users: "password123"
-- Bcrypt hash: $2a$10$rZ5gZqQZ5qQZ5qQZ5qQZ5uK7X7X7X7X7X7X7X7X7X7X7X7X7X7X7Xe

-- First, let's update the existing admin password to a known one
-- Password: admin123
UPDATE users 
SET password_hash = '$2a$10$S.cmpR7W1QKKa0joABJ.bOCra.PgHzTIggOFqWjV4DAuErengalIi'
WHERE email = 'admin@eventplanner.com';

-- Create test users for each tenant role
-- Password for all: password123
-- Hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

-- 1. EVENT_MANAGER
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Event Manager', 'eventmanager@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 2. MARKETING_MANAGER
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Marketing Manager', 'marketing@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 3. FINANCE_MANAGER
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Finance Manager', 'finance@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 4. SUPPORT_STAFF
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Support Staff', 'support@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 5. CONTENT_CREATOR
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Content Creator', 'content@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 6. ANALYST
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Analyst', 'analyst@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 7. VIEWER
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Viewer', 'viewer@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- 8. TENANT_ADMIN (additional)
INSERT INTO users (name, email, email_verified, role, password_hash, created_at, updated_at, current_tenant_id)
VALUES ('Tenant Admin', 'tenantadmin@test.com', NOW(), 'USER', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', NOW(), NOW(), 'default-tenant')
ON CONFLICT (email) DO UPDATE SET password_hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

-- Now assign tenant roles to these users
-- First, get the user IDs
DO $$
DECLARE
    event_manager_id BIGINT;
    marketing_id BIGINT;
    finance_id BIGINT;
    support_id BIGINT;
    content_id BIGINT;
    analyst_id BIGINT;
    viewer_id BIGINT;
    tenant_admin_id BIGINT;
BEGIN
    -- Get user IDs
    SELECT id INTO event_manager_id FROM users WHERE email = 'eventmanager@test.com';
    SELECT id INTO marketing_id FROM users WHERE email = 'marketing@test.com';
    SELECT id INTO finance_id FROM users WHERE email = 'finance@test.com';
    SELECT id INTO support_id FROM users WHERE email = 'support@test.com';
    SELECT id INTO content_id FROM users WHERE email = 'content@test.com';
    SELECT id INTO analyst_id FROM users WHERE email = 'analyst@test.com';
    SELECT id INTO viewer_id FROM users WHERE email = 'viewer@test.com';
    SELECT id INTO tenant_admin_id FROM users WHERE email = 'tenantadmin@test.com';

    -- Insert tenant memberships
    INSERT INTO "TenantMember" (id, "userId", "tenantId", role, "joinedAt")
    VALUES 
        (gen_random_uuid(), event_manager_id, 'default-tenant', 'EVENT_MANAGER', NOW()),
        (gen_random_uuid(), marketing_id, 'default-tenant', 'MARKETING_MANAGER', NOW()),
        (gen_random_uuid(), finance_id, 'default-tenant', 'FINANCE_MANAGER', NOW()),
        (gen_random_uuid(), support_id, 'default-tenant', 'SUPPORT_STAFF', NOW()),
        (gen_random_uuid(), content_id, 'default-tenant', 'CONTENT_CREATOR', NOW()),
        (gen_random_uuid(), analyst_id, 'default-tenant', 'ANALYST', NOW()),
        (gen_random_uuid(), viewer_id, 'default-tenant', 'VIEWER', NOW()),
        (gen_random_uuid(), tenant_admin_id, 'default-tenant', 'TENANT_ADMIN', NOW())
    ON CONFLICT DO NOTHING;
END $$;

-- Display all users with their roles
SELECT 
    u.id,
    u.name,
    u.email,
    u.role as system_role,
    tm.role as tenant_role,
    'password123' as password_hint
FROM users u
LEFT JOIN "TenantMember" tm ON u.id = tm."userId" AND tm."tenantId" = 'default-tenant'
ORDER BY u.id;
