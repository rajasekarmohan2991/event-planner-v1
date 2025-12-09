-- Create Exhibitor table
CREATE TABLE IF NOT EXISTS "Exhibitor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "website" TEXT,
    "notes" TEXT,
    "prefix" TEXT,
    "firstName" TEXT,
    "lastName" TEXT,
    "preferredPronouns" TEXT,
    "workPhone" TEXT,
    "cellPhone" TEXT,
    "jobTitle" TEXT,
    "company" TEXT,
    "businessAddress" TEXT,
    "companyDescription" TEXT,
    "productsServices" TEXT,
    "boothType" TEXT,
    "staffList" TEXT,
    "competitors" TEXT,
    "boothOption" TEXT,
    "boothNumber" TEXT,
    "boothArea" TEXT,
    "electricalAccess" BOOLEAN NOT NULL DEFAULT false,
    "displayTables" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX IF NOT EXISTS "Exhibitor_eventId_name_idx" ON "Exhibitor"("eventId", "name");
