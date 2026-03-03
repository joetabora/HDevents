-- CreateTable
CREATE TABLE "public"."SocialPost" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platforms" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "scheduledFor" TIMESTAMP(3),
    "postedAt" TIMESTAMP(3),
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPost_pkey" PRIMARY KEY ("id")
);
