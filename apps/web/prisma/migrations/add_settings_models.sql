-- Add RSVP Settings table
CREATE TABLE IF NOT EXISTS "RSVPSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL UNIQUE,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxAttendees" INTEGER NOT NULL DEFAULT 0,
    "openAt" TIMESTAMP(3),
    "closeAt" TIMESTAMP(3),
    "questions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add Registration Settings table
CREATE TABLE IF NOT EXISTS "RegistrationSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL UNIQUE,
    "timeLimitMinutes" INTEGER NOT NULL DEFAULT 15,
    "noTimeLimit" BOOLEAN NOT NULL DEFAULT false,
    "allowTransfer" BOOLEAN NOT NULL DEFAULT false,
    "allowAppleWallet" BOOLEAN NOT NULL DEFAULT true,
    "showTicketAvailability" BOOLEAN NOT NULL DEFAULT false,
    "restrictDuplicates" TEXT NOT NULL DEFAULT 'event',
    "registrationApproval" BOOLEAN NOT NULL DEFAULT false,
    "cancellationApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowCheckinUnpaidOffline" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Add new columns to Exhibitor table
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "prefix" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "preferredPronouns" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "workPhone" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "cellPhone" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "jobTitle" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "company" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "businessAddress" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "companyDescription" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "productsServices" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "boothType" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "staffList" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "competitors" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "boothOption" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "boothNumber" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "boothArea" TEXT;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "electricalAccess" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Exhibitor" ADD COLUMN IF NOT EXISTS "displayTables" BOOLEAN NOT NULL DEFAULT false;
