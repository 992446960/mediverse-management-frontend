import { describe, expect, it } from 'vitest'
import {
  LEGACY_XLS_MAX_PREVIEW_BYTES,
  detectExcelBinaryKind,
  getExcelExtension,
  isLegacyXlsTooLarge,
  shouldUseLegacyXlsConversion,
} from '../../src/components/FilePreview/excelFileKind'

function bytes(values: number[]) {
  return new Uint8Array(values)
}

describe('excelFileKind', () => {
  it('detects legacy OLE xls binary files', () => {
    expect(detectExcelBinaryKind(bytes([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))).toBe(
      'xls'
    )
  })

  it('detects zip based xlsx binary files', () => {
    expect(detectExcelBinaryKind(bytes([0x50, 0x4b, 0x03, 0x04]))).toBe('xlsx')
  })

  it('returns unknown for empty or unrecognized files', () => {
    expect(detectExcelBinaryKind(bytes([]))).toBe('unknown')
    expect(detectExcelBinaryKind(bytes([0x01, 0x02, 0x03, 0x04]))).toBe('unknown')
  })

  it('routes explicit xls and mislabeled xlsx files through legacy conversion', () => {
    expect(shouldUseLegacyXlsConversion('xls', 'xls')).toBe(true)
    expect(shouldUseLegacyXlsConversion('xlsx', 'xls')).toBe(true)
    expect(shouldUseLegacyXlsConversion('xlsx', 'xlsx')).toBe(false)
    expect(shouldUseLegacyXlsConversion('xls', 'xlsx')).toBe(false)
  })

  it('normalizes excel extensions from file type values', () => {
    expect(getExcelExtension(' XLS ')).toBe('xls')
    expect(getExcelExtension('.xlsx')).toBe('xlsx')
    expect(getExcelExtension(null)).toBe('')
  })

  it('allows legacy preview at 10MB and rejects larger files', () => {
    expect(isLegacyXlsTooLarge(LEGACY_XLS_MAX_PREVIEW_BYTES)).toBe(false)
    expect(isLegacyXlsTooLarge(LEGACY_XLS_MAX_PREVIEW_BYTES + 1)).toBe(true)
  })
})
