/** 遮掩 Token：保留前 6 位与后 2 位，中间用 • 代替，如 med_ab••••••••89 */
export function maskToken(token: string): string {
  if (!token || token.length <= 8) return '••••••••'
  const head = token.slice(0, 6)
  const tail = token.slice(-2)
  const midLen = Math.max(0, token.length - 8)
  return `${head}${'•'.repeat(Math.min(midLen, 10))}${tail}`
}
