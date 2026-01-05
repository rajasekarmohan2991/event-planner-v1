-- Live Streaming Feature Database Schema
-- This file contains all database tables for the live streaming module
-- Run this migration to enable live streaming functionality

-- Main streaming sessions table
CREATE TABLE IF NOT EXISTS live_streams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id BIGINT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id TEXT,
  
  -- Streaming credentials
  channel_name TEXT UNIQUE NOT NULL,
  stream_key TEXT UNIQUE NOT NULL,
  rtmp_url TEXT NOT NULL,
  playback_url TEXT,
  
  -- Stream metadata
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  
  -- Status and timing
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'error')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  scheduled_start TIMESTAMP WITH TIME ZONE,
  
  -- Analytics
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  average_watch_time INTEGER DEFAULT 0, -- in seconds
  
  -- Recording
  recording_enabled BOOLEAN DEFAULT true,
  recording_url TEXT,
  recording_duration INTEGER, -- in seconds
  
  -- Access control
  access_level TEXT DEFAULT 'ticket_holders' CHECK (access_level IN ('public', 'ticket_holders', 'vip_only', 'custom')),
  allowed_ticket_types TEXT[], -- array of ticket type IDs
  
  -- Configuration
  config JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_live_streams_session ON live_streams(session_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_event ON live_streams(event_id);
CREATE INDEX IF NOT EXISTS idx_live_streams_status ON live_streams(status);
CREATE INDEX IF NOT EXISTS idx_live_streams_channel ON live_streams(channel_name);

-- Viewer tracking table
CREATE TABLE IF NOT EXISTS stream_viewers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  
  -- Session info
  session_token TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Viewing details
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  watch_duration INTEGER DEFAULT 0, -- in seconds
  is_active BOOLEAN DEFAULT true,
  
  -- Engagement
  messages_sent INTEGER DEFAULT 0,
  reactions_sent INTEGER DEFAULT 0,
  
  -- Device info
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  location JSONB, -- {country, city, region}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_viewers_stream ON stream_viewers(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_user ON stream_viewers(user_id);
CREATE INDEX IF NOT EXISTS idx_stream_viewers_active ON stream_viewers(is_active);

-- Live chat messages table
CREATE TABLE IF NOT EXISTS stream_chat (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  viewer_id TEXT REFERENCES stream_viewers(id) ON DELETE CASCADE,
  
  -- Message content
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message' CHECK (type IN ('message', 'question', 'reaction', 'system')),
  
  -- Metadata
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  is_moderator BOOLEAN DEFAULT false,
  is_speaker BOOLEAN DEFAULT false,
  
  -- Moderation
  is_deleted BOOLEAN DEFAULT false,
  deleted_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Reactions
  reactions JSONB DEFAULT '{}', -- {emoji: count}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_chat_stream ON stream_chat(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_chat_created ON stream_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stream_chat_type ON stream_chat(type);

-- Stream analytics snapshots (for historical data)
CREATE TABLE IF NOT EXISTS stream_analytics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  
  -- Snapshot timestamp
  snapshot_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metrics at this point in time
  viewer_count INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  chat_messages INTEGER DEFAULT 0,
  reactions INTEGER DEFAULT 0,
  
  -- Engagement metrics
  average_watch_time INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0, -- percentage
  
  -- Technical metrics
  stream_quality TEXT, -- 'excellent', 'good', 'fair', 'poor'
  buffering_rate DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_analytics_stream ON stream_analytics(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_analytics_snapshot ON stream_analytics(snapshot_at DESC);

-- Stream recordings table
CREATE TABLE IF NOT EXISTS stream_recordings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  
  -- Recording details
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT NOT NULL,
  
  -- Metadata
  duration INTEGER NOT NULL, -- in seconds
  file_size BIGINT, -- in bytes
  format TEXT DEFAULT 'mp4',
  resolution TEXT, -- '1080p', '720p', etc.
  
  -- Access control
  access_level TEXT DEFAULT 'ticket_holders' CHECK (access_level IN ('public', 'ticket_holders', 'vip_only', 'paid')),
  price_inr DECIMAL(10,2) DEFAULT 0,
  
  -- Stats
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_recordings_stream ON stream_recordings(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_event ON stream_recordings(event_id);
CREATE INDEX IF NOT EXISTS idx_stream_recordings_status ON stream_recordings(status);

-- Stream reactions table (for emoji reactions)
CREATE TABLE IF NOT EXISTS stream_reactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
  viewer_id TEXT REFERENCES stream_viewers(id) ON DELETE CASCADE,
  
  -- Reaction details
  emoji TEXT NOT NULL, -- '👍', '❤️', '👏', etc.
  timestamp_in_stream INTEGER, -- seconds from stream start
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_reactions_stream ON stream_reactions(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_reactions_emoji ON stream_reactions(emoji);

-- Stream polls table (for interactive polls during stream)
CREATE TABLE IF NOT EXISTS stream_polls (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  stream_id TEXT NOT NULL REFERENCES live_streams(id) ON DELETE CASCADE,
  
  -- Poll details
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- [{id, text, votes}]
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Results
  total_votes INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stream_polls_stream ON stream_polls(stream_id);
CREATE INDEX IF NOT EXISTS idx_stream_polls_active ON stream_polls(is_active);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_live_streams_updated_at BEFORE UPDATE ON live_streams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_viewers_updated_at BEFORE UPDATE ON stream_viewers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_recordings_updated_at BEFORE UPDATE ON stream_recordings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stream_polls_updated_at BEFORE UPDATE ON stream_polls
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
