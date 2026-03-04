-- AlterTable
ALTER TABLE "public"."Event"
ADD COLUMN "eventType" TEXT,
ADD COLUMN "templateId" TEXT;

-- CreateTable
CREATE TABLE "public"."EventTemplate" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "eventType" TEXT,
  "defaultBudgetCategories" JSONB,
  "defaultTaskChecklist" JSONB,
  "timelineMilestones" JSONB,
  "createdById" TEXT,
  "archivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TemplateVendor" (
  "id" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "defaultCostEstimate" DOUBLE PRECISION,
  "category" TEXT NOT NULL,
  "priorityLevel" TEXT NOT NULL DEFAULT 'PRIMARY',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TemplateVendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EventDebrief" (
  "id" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "generatedById" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EventDebrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVendor_templateId_vendorId_priorityLevel_key" ON "public"."TemplateVendor"("templateId", "vendorId", "priorityLevel");

-- CreateIndex
CREATE UNIQUE INDEX "EventDebrief_eventId_version_key" ON "public"."EventDebrief"("eventId", "version");

-- AddForeignKey
ALTER TABLE "public"."Event" ADD CONSTRAINT "Event_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."EventTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."EventTemplate" ADD CONSTRAINT "EventTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "public"."TemplateVendor" ADD CONSTRAINT "TemplateVendor_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."EventTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."TemplateVendor" ADD CONSTRAINT "TemplateVendor_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "public"."Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventDebrief" ADD CONSTRAINT "EventDebrief_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "public"."Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "public"."EventDebrief" ADD CONSTRAINT "EventDebrief_generatedById_fkey" FOREIGN KEY ("generatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
