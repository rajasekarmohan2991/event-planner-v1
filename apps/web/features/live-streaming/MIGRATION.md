# Live Streaming Database Migration

This document contains the SQL migration script to enable live streaming functionality.

## Prerequisites
- Access to Supabase SQL Editor
- Database backup recommended before running migration

## Migration Steps

### Step 1: Run the Migration SQL

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the contents of `schema.sql`
5. Click "Run" to execute

### Step 2: Verify Tables Created

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'live_streams',
  'stream_viewers',
  'stream_chat',
  'stream_analytics',
  'stream_recordings',
  'stream_reactions',
  'stream_polls'
)
ORDER BY table_name;
```

You should see all 7 tables listed.

### Step 3: Verify Triggers

Check that the update triggers were created:

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%updated_at%'
AND event_object_table IN ('live_streams', 'stream_viewers', 'stream_recordings', 'stream_polls');
```

### Step 4: Test Insert

Test that you can insert data:

```sql
-- Test insert into live_streams
INSERT INTO live_streams (
  id, session_id, event_id, channel_name, stream_key, rtmp_url, title, status
) VALUES (
  gen_random_uuid()::text,
  1,
  1,
  'test-channel',
  'test-key-123',
  'rtmp://test.com/live',
  'Test Stream',
  'scheduled'
);

-- Verify insert
SELECT id, title, status, created_at FROM live_streams WHERE title = 'Test Stream';

-- Clean up test data
DELETE FROM live_streams WHERE title = 'Test Stream';
```

## Rollback (If Needed)

If you need to rollback the migration:

```sql
-- Drop all streaming tables
DROP TABLE IF EXISTS stream_polls CASCADE;
DROP TABLE IF EXISTS stream_reactions CASCADE;
DROP TABLE IF EXISTS stream_recordings CASCADE;
DROP TABLE IF EXISTS stream_analytics CASCADE;
DROP TABLE IF EXISTS stream_chat CASCADE;
DROP TABLE IF EXISTS stream_viewers CASCADE;
DROP TABLE IF EXISTS live_streams CASCADE;

-- Drop the trigger function
DROP FUNCTION IF EXISTS update_updated_at_column();
```

## Post-Migration

After successful migration:

1. ✅ All 7 tables created
2. ✅ Triggers installed
3. ✅ Test insert successful
4. ✅ Ready to use streaming features

## Troubleshooting

### Error: "relation already exists"
This means tables were already created. You can either:
- Skip the migration (tables already exist)
- Drop existing tables and re-run (see Rollback section)

### Error: "column does not exist"
Make sure you're running the complete schema.sql file, not partial sections.

### Error: "permission denied"
Ensure your database user has CREATE TABLE permissions.

## Next Steps

After migration is complete:
1. Set up Agora.io account
2. Add environment variables to Vercel
3. Test streaming functionality
