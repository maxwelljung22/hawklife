export function normalizePlainText(value: string, options?: { maxLength?: number }) {
  const trimmed = value.replace(/\r\n/g, "\n").trim();
  const maxLength = options?.maxLength;

  if (!maxLength) return trimmed;
  return trimmed.slice(0, maxLength);
}
