-- Test Users for RBAC Testing
-- Password for all users: password123
-- Hashed with bcrypt: $2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52

-- 1. SUPER_ADMIN (already exists)
-- Email: rbusiness2111@gmail.com

-- 2. ADMIN Role User
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'admin-test-001',
  'admin@test.com',
  'Test Admin',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'ADMIN',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

-- 3. EVENT_MANAGER Role User
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'manager-test-001',
  'manager@test.com',
  'Test Event Manager',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'EVENT_MANAGER',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'EVENT_MANAGER',
  password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

-- 4. USER Role User
INSERT INTO "User" (id, email, name, password, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'user-test-001',
  'user@test.com',
  'Test Regular User',
  '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52',
  'USER',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'USER',
  password = '$2a$10$yxc/2I8j7iP93t6dzCHmmeKcN8q0QP8koCn7U44xbiNQkwJ5O1N52';

-- Verify users created
SELECT id, email, name, role FROM "User" WHERE email IN (
  'rbusiness2111@gmail.com',
  'admin@test.com',
  'manager@test.com',
  'user@test.com'
);
