-- DropIndex
DROP INDEX "events_starts_at_idx";

-- DropIndex
DROP INDEX "events_status_idx";

-- DropIndex
DROP INDEX "events_tenant_id_starts_at_idx";

-- DropIndex
DROP INDEX "events_tenant_id_status_idx";

-- AlterTable
ALTER TABLE "registrations" ALTER COLUMN "updated_at" DROP DEFAULT;
