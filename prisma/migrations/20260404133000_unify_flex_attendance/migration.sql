DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceSessionType') THEN
    CREATE TYPE "AttendanceSessionType" AS ENUM ('CLUB', 'STUDY_HALL', 'EVENT');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'AttendanceStatus') THEN
    CREATE TYPE "AttendanceStatus" AS ENUM ('JOINED', 'PRESENT', 'LATE');
  END IF;
END $$;

ALTER TABLE "AttendanceSession"
  ALTER COLUMN "clubId" DROP NOT NULL,
  ALTER COLUMN "qrCode" SET NOT NULL;

ALTER TABLE "AttendanceSession"
  ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT 'Flex Session',
  ADD COLUMN IF NOT EXISTS "type" "AttendanceSessionType" NOT NULL DEFAULT 'CLUB',
  ADD COLUMN IF NOT EXISTS "createdById" TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "hostName" TEXT NOT NULL DEFAULT 'HawkLife',
  ADD COLUMN IF NOT EXISTS "location" TEXT NOT NULL DEFAULT 'TBD',
  ADD COLUMN IF NOT EXISTS "capacity" INTEGER NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "endTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "qrRefreshSeconds" INTEGER NOT NULL DEFAULT 45,
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "AttendanceRecord"
  ALTER COLUMN "present" SET DEFAULT false,
  ALTER COLUMN "checkIn" DROP NOT NULL,
  ALTER COLUMN "checkIn" DROP DEFAULT;

ALTER TABLE "AttendanceRecord"
  ADD COLUMN IF NOT EXISTS "status" "AttendanceStatus" NOT NULL DEFAULT 'JOINED',
  ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "AttendanceSession_date_type_idx" ON "AttendanceSession"("date", "type");
CREATE INDEX IF NOT EXISTS "AttendanceSession_clubId_date_idx" ON "AttendanceSession"("clubId", "date");
CREATE INDEX IF NOT EXISTS "AttendanceSession_createdById_date_idx" ON "AttendanceSession"("createdById", "date");
CREATE INDEX IF NOT EXISTS "AttendanceRecord_userId_joinedAt_idx" ON "AttendanceRecord"("userId", "joinedAt");
