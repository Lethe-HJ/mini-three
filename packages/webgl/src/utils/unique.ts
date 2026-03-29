export function getShortUnique(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
}
