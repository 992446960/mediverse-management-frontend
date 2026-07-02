export const OLE_XLS_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] as const
export const ZIP_XLSX_SIGNATURE = [0x50, 0x4b] as const

export const LEGACY_XLS_MAX_PREVIEW_BYTES = 10 * 1024 * 1024
export const LEGACY_XLS_CONVERT_TIMEOUT_MS = 8000

export type ExcelBinaryKind = 'xls' | 'xlsx' | 'unknown'

function toBytes(input: ArrayBuffer | Uint8Array): Uint8Array {
  return input instanceof Uint8Array ? input : new Uint8Array(input)
}

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  if (bytes.length < signature.length) return false
  return signature.every((value, index) => bytes[index] === value)
}

export function detectExcelBinaryKind(input: ArrayBuffer | Uint8Array): ExcelBinaryKind {
  const bytes = toBytes(input)
  if (startsWith(bytes, OLE_XLS_SIGNATURE)) return 'xls'
  if (startsWith(bytes, ZIP_XLSX_SIGNATURE)) return 'xlsx'
  return 'unknown'
}

export function getExcelExtension(fileType: string | null | undefined): string {
  return fileType?.trim().replace(/^\./, '').toLowerCase() ?? ''
}

export function shouldUseLegacyXlsConversion(
  fileType: string | null | undefined,
  kind: ExcelBinaryKind
): boolean {
  const ext = getExcelExtension(fileType)
  if (ext === 'xls' && kind !== 'xlsx') return true
  return ext === 'xlsx' && kind === 'xls'
}

export function isLegacyXlsTooLarge(byteLength: number): boolean {
  return byteLength > LEGACY_XLS_MAX_PREVIEW_BYTES
}
