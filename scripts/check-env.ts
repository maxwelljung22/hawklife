import { loadEnvConfig } from "@next/env";
import { getAuthEnv, getDatabaseEnv } from "../lib/env";

loadEnvConfig(process.cwd());

getAuthEnv();
getDatabaseEnv();

console.log("Environment looks valid.");
