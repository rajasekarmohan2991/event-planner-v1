-- Create event_feed_posts table for event engagement feed
CREATE TABLE IF NOT EXISTS event_feed_posts (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  tenant_id VARCHAR(255),
  user_id VARCHAR(255),
  author_name VARCHAR(255),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_feed_posts_event_id ON event_feed_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_event_feed_posts_created_at ON event_feed_posts(created_at DESC);

-- Add foreign key constraint (optional, depends on your schema)
-- ALTER TABLE event_feed_posts ADD CONSTRAINT fk_event_feed_posts_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
