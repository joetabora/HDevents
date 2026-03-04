-- AlterTable
ALTER TABLE "public"."Contact"
ADD COLUMN "firstName" TEXT,
ADD COLUMN "lastName" TEXT,
ADD COLUMN "company" TEXT,
ADD COLUMN "contactType" TEXT NOT NULL DEFAULT 'VENDOR',
ADD COLUMN "source" TEXT NOT NULL DEFAULT 'OTHER',
ADD COLUMN "assignedToId" TEXT,
ADD COLUMN "status" TEXT NOT NULL DEFAULT 'NEW',
ADD COLUMN "leadScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill compatibility values for existing contacts
UPDATE "public"."Contact"
SET
  "company" = COALESCE(NULLIF("company", ''), "businessName"),
  "contactType" = 'VENDOR',
  "status" = CASE WHEN "category" = 'MISC' THEN 'NEW' ELSE 'ACTIVE' END
WHERE "company" IS NULL OR "contactType" IS NULL OR "status" IS NULL;

-- CreateTable
CREATE TABLE "public"."Interaction" (
  "id" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "followUpDate" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Interaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventContact" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "roleTag" TEXT,
  "convertedToLead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EventContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SocialPostContact" (
  "id" TEXT NOT NULL,
  "socialPostId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "relationshipType" TEXT NOT NULL DEFAULT 'COMMENTER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SocialPostContact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventContact_eventId_contactId_key" ON "public"."EventContact"("eventId", "contactId");
CREATE UNIQUE INDEX "SocialPostContact_socialPostId_contactId_key" ON "public"."SocialPostContact"("socialPostId", "contactId");
CREATE INDEX "Interaction_contactId_createdAt_idx" ON "public"."Interaction"("contactId", "createdAt");
CREATE INDEX "Contact_contactType_status_idx" ON "public"."Contact"("contactType", "status");

-- AddForeignKey
ALTER TABLE "public"."Contact" ADD CONSTRAINT "Contact_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."Interaction" ADD CONSTRAINT "Interaction_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."Interaction" ADD CONSTRAINT "Interaction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."EventContact" ADD CONSTRAINT "EventContact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventContact" ADD CONSTRAINT "EventContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SocialPostContact" ADD CONSTRAINT "SocialPostContact_socialPostId_fkey" FOREIGN KEY ("socialPostId") REFERENCES "public"."SocialPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."SocialPostContact" ADD CONSTRAINT "SocialPostContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
