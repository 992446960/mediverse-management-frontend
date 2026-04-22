/**
 * 生成 RFC 4122 v4 UUID。
 * `crypto.randomUUID()` 仅在安全上下文（HTTPS / localhost）可用；
 * Docker 等 HTTP 部署下需用 `getRandomValues` 降级。
 */
export function randomUUID(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID()
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    const b6 = bytes[6] ?? 0
    const b8 = bytes[8] ?? 0
    bytes[6] = (b6 & 0x0f) | 0x40
    bytes[8] = (b8 & 0x3f) | 0x80
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0
    const v = ch === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
