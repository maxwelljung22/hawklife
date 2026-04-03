import { readFileSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

function parseStatements(sql: string) {
  return sql
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(/;\s*\n/g)
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const target = process.argv[2] || "prisma/migrations/20240101000000_init/migration.sql";
  const file = join(process.cwd(), target);
  const sql = readFileSync(file, "utf8");
  const statements = parseStatements(sql);

  console.log(`Applying ${statements.length} SQL statements from ${target}...`);

  for (let index = 0; index < statements.length; index += 1) {
    const statement = statements[index];
    await prisma.$executeRawUnsafe(statement);
    console.log(`  ${index + 1}/${statements.length}`);
  }

  console.log("Migration applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
