-- Normalize legacy event statuses to new lifecycle values
UPDATE "public"."Event" SET "status" = 'ACTIVE' WHERE "status" = 'READY';
UPDATE "public"."Event" SET "status" = 'COMPLETED' WHERE "status" = 'FINISHED';

-- AlterTable
ALTER TABLE "public"."Event"
ADD COLUMN "archiveVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "finalAttendance" INTEGER,
ADD COLUMN "finalBudgetUsed" DOUBLE PRECISION,
ADD COLUMN "finalNotes" TEXT,
ADD COLUMN "finalizedById" TEXT;

-- CreateTable
CREATE TABLE "public"."EventArchive" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatedById" TEXT,
  "archiveUrl" TEXT NOT NULL,
  "summaryPdfUrl" TEXT NOT NULL,
  "budgetCsvUrl" TEXT NOT NULL,
  "vendorCsvUrl" TEXT NOT NULL,
  "socialCsvUrl" TEXT NOT NULL,
  CONSTRAINT "EventArchive_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventArchive_eventId_version_key" ON "public"."EventArchive"("eventId", "version");

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."EventArchive" ADD CONSTRAINT "EventArchive_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventArchive" ADD CONSTRAINT "EventArchive_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
