-- CreateEnum
CREATE TYPE "public"."GitHubSyncStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "public"."github_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "githubUserId" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "profileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."github_repositories" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "githubConnectionId" TEXT NOT NULL,
    "githubRepoId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "defaultBranch" TEXT NOT NULL DEFAULT 'main',
    "htmlUrl" TEXT NOT NULL,
    "cloneUrl" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "syncStatus" "public"."GitHubSyncStatus" NOT NULL DEFAULT 'PENDING',
    "syncError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "github_repositories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "github_connections_userId_key" ON "public"."github_connections"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "github_connections_githubUserId_key" ON "public"."github_connections"("githubUserId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_projectId_key" ON "public"."github_repositories"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "github_repositories_githubConnectionId_githubRepoId_key" ON "public"."github_repositories"("githubConnectionId", "githubRepoId");

-- AddForeignKey
ALTER TABLE "public"."github_repositories" ADD CONSTRAINT "github_repositories_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."github_repositories" ADD CONSTRAINT "github_repositories_githubConnectionId_fkey" FOREIGN KEY ("githubConnectionId") REFERENCES "public"."github_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
