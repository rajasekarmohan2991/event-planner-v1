CREATE TABLE IF NOT EXISTS "activity_log" (
    "id" BIGSERIAL NOT NULL,
    "user_id" BIGINT,
    "user_name" TEXT,
    "user_email" TEXT,
    "action_type" TEXT NOT NULL,
    "action_description" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" BIGINT,
    "entity_name" TEXT,
    "metadata" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "activity_log_user_id_idx" ON "activity_log"("user_id");
CREATE INDEX IF NOT EXISTS "activity_log_entity_type_entity_id_idx" ON "activity_log"("entity_type", "entity_id");
