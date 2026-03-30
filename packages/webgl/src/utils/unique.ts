/** HTTP 等非安全上下文中没有 `crypto.randomUUID`，需降级 */
export function getShortUnique(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) {
    return c.randomUUID().replace(/-/g, "").slice(0, 12);
  }
  if (c?.getRandomValues) {
    const buf = new Uint8Array(6);
    c.getRandomValues(buf);
    return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return Array.from({ length: 12 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
}
