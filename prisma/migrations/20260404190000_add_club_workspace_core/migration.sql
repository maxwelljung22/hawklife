-- CreateEnum
CREATE TYPE "WorkspaceTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "WorkspacePost" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "attachments" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkspacePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceComment" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkspaceComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceReaction" (
  "id" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WorkspaceReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAssignment" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "attachments" JSONB,
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkspaceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceAssignmentSubmission" (
  "id" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "content" TEXT,
  "attachments" JSONB,
  "submittedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkspaceAssignmentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceTask" (
  "id" TEXT NOT NULL,
  "clubId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "assigneeId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkspaceTaskStatus" NOT NULL DEFAULT 'TODO',
  "dueAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WorkspaceTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspacePost_clubId_createdAt_idx" ON "WorkspacePost"("clubId", "createdAt");
CREATE INDEX "WorkspaceComment_postId_createdAt_idx" ON "WorkspaceComment"("postId", "createdAt");
CREATE UNIQUE INDEX "WorkspaceReaction_postId_userId_key" ON "WorkspaceReaction"("postId", "userId");
CREATE INDEX "WorkspaceReaction_userId_createdAt_idx" ON "WorkspaceReaction"("userId", "createdAt");
CREATE INDEX "WorkspaceAssignment_clubId_dueAt_idx" ON "WorkspaceAssignment"("clubId", "dueAt");
CREATE UNIQUE INDEX "WorkspaceAssignmentSubmission_assignmentId_userId_key" ON "WorkspaceAssignmentSubmission"("assignmentId", "userId");
CREATE INDEX "WorkspaceAssignmentSubmission_userId_submittedAt_idx" ON "WorkspaceAssignmentSubmission"("userId", "submittedAt");
CREATE INDEX "WorkspaceTask_clubId_status_idx" ON "WorkspaceTask"("clubId", "status");
CREATE INDEX "WorkspaceTask_assigneeId_status_idx" ON "WorkspaceTask"("assigneeId", "status");

-- AddForeignKey
ALTER TABLE "WorkspacePost" ADD CONSTRAINT "WorkspacePost_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspacePost" ADD CONSTRAINT "WorkspacePost_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceComment" ADD CONSTRAINT "WorkspaceComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WorkspacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceComment" ADD CONSTRAINT "WorkspaceComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReaction" ADD CONSTRAINT "WorkspaceReaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WorkspacePost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceReaction" ADD CONSTRAINT "WorkspaceReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssignment" ADD CONSTRAINT "WorkspaceAssignment_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssignment" ADD CONSTRAINT "WorkspaceAssignment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssignmentSubmission" ADD CONSTRAINT "WorkspaceAssignmentSubmission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "WorkspaceAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAssignmentSubmission" ADD CONSTRAINT "WorkspaceAssignmentSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceTask" ADD CONSTRAINT "WorkspaceTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
