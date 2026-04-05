import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN (
         'WorkspacePost',
         'WorkspaceComment',
         'WorkspaceReaction',
         'WorkspaceAssignment',
         'WorkspaceAssignmentSubmission',
         'WorkspaceTask'
       )
     ORDER BY table_name`
  );

  const enums = await prisma.$queryRawUnsafe<{ typname: string }[]>(
    `SELECT typname
     FROM pg_type
     WHERE typname = 'WorkspaceTaskStatus'`
  );

  const clubColumns = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'Club'
       AND column_name IN ('workspaceTitle', 'workspaceDescription')
     ORDER BY column_name`
  );

  const resourceColumns = await prisma.$queryRawUnsafe<{ column_name: string }[]>(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'Resource'
       AND column_name IN ('category', 'dueAt', 'membersOnly')
     ORDER BY column_name`
  );

  console.log(JSON.stringify({ tables, enums, clubColumns, resourceColumns }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
