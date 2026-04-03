CREATE TABLE "CharterApplication" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "clubName" TEXT NOT NULL,
    "category" "ClubCategory" NOT NULL,
    "missionStatement" TEXT NOT NULL,
    "founderName" TEXT NOT NULL,
    "coFounders" JSONB NOT NULL,
    "leadershipRoles" JSONB NOT NULL,
    "whyExist" TEXT NOT NULL,
    "uniqueValue" TEXT NOT NULL,
    "plannedEvents" JSONB NOT NULL,
    "meetingFrequency" TEXT NOT NULL,
    "expectedMemberCount" INTEGER NOT NULL,
    "advisorName" TEXT,
    "advisorEmail" TEXT,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "reviewNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharterApplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CharterApplication_applicantId_createdAt_idx" ON "CharterApplication"("applicantId", "createdAt");
CREATE INDEX "CharterApplication_status_submittedAt_idx" ON "CharterApplication"("status", "submittedAt");

ALTER TABLE "CharterApplication"
ADD CONSTRAINT "CharterApplication_applicantId_fkey"
FOREIGN KEY ("applicantId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
