-- Seed additional sample users for testing sign-in flows
-- NOTE: bcrypt hash below corresponds to the plaintext "password"
-- $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES
  ('organizer@eventplanner.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sample Organizer', 'ORGANIZER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES
  ('user@eventplanner.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sample User', 'USER', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;
