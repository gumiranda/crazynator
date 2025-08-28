-- CreateEnum
CREATE TYPE "public"."GitHubSyncJobType" AS ENUM ('PULL_FROM_GITHUB', 'PUSH_TO_GITHUB');

-- CreateEnum
CREATE TYPE "public"."GitHubSyncJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "public"."github_sync_jobs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "repositoryId" TEXT,
    "type" "public"."GitHubSyncJobType" NOT NULL,
    "status" "public"."GitHubSyncJobStatus" NOT NULL DEFAULT 'PENDING',
    "totalFiles" INTEGER NOT NULL DEFAULT 0,
    "processedFiles" INTEGER NOT NULL DEFAULT 0,
    "failedFiles" INTEGER NOT NULL DEFAULT 0,
    "totalBatches" INTEGER NOT NULL DEFAULT 0,
    "processedBatches" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_sync_jobs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."github_sync_jobs" ADD CONSTRAINT "github_sync_jobs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."github_sync_jobs" ADD CONSTRAINT "github_sync_jobs_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "public"."github_repositories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
