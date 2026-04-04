const PLACEHOLDER_PATTERNS = [
  /\[ref\]/,
  /\[password\]/,
  /^your-/i,
  /your-secret-here/i,
  /your-client-id/i,
];

function isPlaceholder(value: string | undefined) {
  if (!value) return true;
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

function requireEnv(name: string) {
  const value = process.env[name];
  if (isPlaceholder(value)) {
    throw new Error(
      `Missing valid ${name}. Update your local .env with the real value instead of the example placeholder.`
    );
  }
  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name];
  return isPlaceholder(value) ? undefined : value;
}

export function getAuthEnv(options?: { strict?: boolean }) {
  const strict = options?.strict ?? true;

  return {
    googleClientId: strict ? requireEnv("GOOGLE_CLIENT_ID") : optionalEnv("GOOGLE_CLIENT_ID"),
    googleClientSecret: strict ? requireEnv("GOOGLE_CLIENT_SECRET") : optionalEnv("GOOGLE_CLIENT_SECRET"),
    nextAuthSecret: strict ? requireEnv("NEXTAUTH_SECRET") : optionalEnv("NEXTAUTH_SECRET"),
    nextAuthUrl: strict ? requireEnv("NEXTAUTH_URL") : optionalEnv("NEXTAUTH_URL"),
  };
}

export function hasConfiguredAuthEnv() {
  const authEnv = getAuthEnv({ strict: false });
  return Boolean(
    authEnv.googleClientId &&
      authEnv.googleClientSecret &&
      authEnv.nextAuthSecret &&
      authEnv.nextAuthUrl
  );
}

export function getDatabaseEnv() {
  return {
    databaseUrl: requireEnv("DATABASE_URL"),
    directUrl: requireEnv("DIRECT_URL"),
  };
}
