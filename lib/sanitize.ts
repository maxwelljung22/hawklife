export function normalizePlainText(value: string, options?: { maxLength?: number }) {
  const trimmed = value.replace(/\r\n/g, "\n").trim();
  const maxLength = options?.maxLength;

  if (!maxLength) return trimmed;
  return trimmed.slice(0, maxLength);
}

export function normalizeMultilineText(value: string, options?: { maxLength?: number }) {
  const normalized = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");

  const maxLength = options?.maxLength;
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
}

export function normalizeSingleLineText(value: string, options?: { maxLength?: number }) {
  const normalized = value.trim().replace(/\s+/g, " ");
  const maxLength = options?.maxLength;
  if (!maxLength) return normalized;
  return normalized.slice(0, maxLength);
}

export function normalizeThemeColor(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  return /^#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(trimmed) ? trimmed : null;
}

export function normalizeHttpsUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
