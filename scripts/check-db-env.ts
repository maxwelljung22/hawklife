import { loadEnvConfig } from "@next/env";
import { getDatabaseEnv } from "../lib/env";

loadEnvConfig(process.cwd());

getDatabaseEnv();

console.log("Database environment looks valid.");
