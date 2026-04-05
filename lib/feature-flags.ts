function parseBoolean(value?: string | null) {
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function isV4Enabled() {
  return parseBoolean(process.env.ENABLE_V4);
}
