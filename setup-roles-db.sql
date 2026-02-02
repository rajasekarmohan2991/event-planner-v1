-- Create roles and permissions tables for RBAC system
-- Run this in your PostgreSQL database

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  permission_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(role_id, permission_key)
);

-- Seed default roles matching the UI image
INSERT INTO roles (name, description, is_system) VALUES
('Super Admin', 'Full system access with all permissions', true),
('Admin', 'Tenant admin access with most permissions', true), 
('Event Manager', 'Can create and manage events', true),
('User', 'Regular user access for event registration', true)
ON CONFLICT (name) DO NOTHING;

-- Get role IDs for permission assignment
DO $$
DECLARE
    super_admin_id INTEGER;
    admin_id INTEGER;
    event_manager_id INTEGER;
    user_id INTEGER;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_id FROM roles WHERE name = 'Super Admin';
    SELECT id INTO admin_id FROM roles WHERE name = 'Admin';
    SELECT id INTO event_manager_id FROM roles WHERE name = 'Event Manager';
    SELECT id INTO user_id FROM roles WHERE name = 'User';

    -- Super Admin permissions (9 permissions as shown in image)
    INSERT INTO role_permissions (role_id, permission_key) VALUES
    (super_admin_id, 'users.view'),
    (super_admin_id, 'users.create'),
    (super_admin_id, 'users.edit'),
    (super_admin_id, 'users.delete'),
    (super_admin_id, 'users.assign_roles'),
    (super_admin_id, 'events.view'),
    (super_admin_id, 'events.create'),
    (super_admin_id, 'events.edit'),
    (super_admin_id, 'events.delete'),
    (super_admin_id, 'events.publish'),
    (super_admin_id, 'roles.view'),
    (super_admin_id, 'roles.create'),
    (super_admin_id, 'roles.edit'),
    (super_admin_id, 'roles.delete'),
    (super_admin_id, 'analytics.view'),
    (super_admin_id, 'analytics.export'),
    (super_admin_id, 'system.settings'),
    (super_admin_id, 'system.backup'),
    (super_admin_id, 'payments.view'),
    (super_admin_id, 'payments.process'),
    (super_admin_id, 'communication.send_email'),
    (super_admin_id, 'communication.send_sms')
    ON CONFLICT (role_id, permission_key) DO NOTHING;

    -- Admin permissions (5 permissions as shown in image)
    INSERT INTO role_permissions (role_id, permission_key) VALUES
    (admin_id, 'events.view'),
    (admin_id, 'events.create'),
    (admin_id, 'events.edit'),
    (admin_id, 'analytics.view'),
    (admin_id, 'payments.view'),
    (admin_id, 'users.view')
    ON CONFLICT (role_id, permission_key) DO NOTHING;

    -- Event Manager permissions (3 permissions as shown in image)
    INSERT INTO role_permissions (role_id, permission_key) VALUES
    (event_manager_id, 'events.view'),
    (event_manager_id, 'events.create'),
    (event_manager_id, 'events.edit'),
    (event_manager_id, 'events.manage_registrations'),
    (event_manager_id, 'analytics.view')
    ON CONFLICT (role_id, permission_key) DO NOTHING;

    -- User permissions (2 permissions as shown in image)
    INSERT INTO role_permissions (role_id, permission_key) VALUES
    (user_id, 'events.view')
    ON CONFLICT (role_id, permission_key) DO NOTHING;

END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_key ON role_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_is_system ON roles(is_system);

-- Display created roles and their permission counts
SELECT 
    r.name,
    r.description,
    r.is_system,
    COUNT(rp.permission_key) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
GROUP BY r.id, r.name, r.description, r.is_system
ORDER BY r.is_system DESC, r.name;
