-- Create feed_posts table
CREATE TABLE IF NOT EXISTS feed_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "tenantId" VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create feed_likes table
CREATE TABLE IF NOT EXISTS feed_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    "userId" BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("postId", "userId")
);

-- Create feed_comments table
CREATE TABLE IF NOT EXISTS feed_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "postId" UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
    "userId" BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_feed_posts_tenant ON feed_posts("tenantId");
CREATE INDEX IF NOT EXISTS idx_feed_posts_user ON feed_posts("userId");
CREATE INDEX IF NOT EXISTS idx_feed_posts_created ON feed_posts("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_feed_likes_post ON feed_likes("postId");
CREATE INDEX IF NOT EXISTS idx_feed_comments_post ON feed_comments("postId");
