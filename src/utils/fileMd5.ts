const MD5_SHIFT_AMOUNTS = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14,
  20, 5, 9, 14, 20, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6,
  10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_TABLE = Array.from({ length: 64 }, (_, index) =>
  Math.floor(Math.abs(Math.sin(index + 1)) * 0x100000000)
)

function leftRotate(value: number, amount: number): number {
  return (value << amount) | (value >>> (32 - amount))
}

function appendLength(bytes: Uint8Array, offset: number, bitLength: number) {
  const view = new DataView(bytes.buffer)
  view.setUint32(offset, bitLength >>> 0, true)
  view.setUint32(offset + 4, Math.floor(bitLength / 0x100000000), true)
}

function toHex(value: number): string {
  return Array.from({ length: 4 }, (_, index) =>
    ((value >>> (index * 8)) & 0xff).toString(16).padStart(2, '0')
  ).join('')
}

function calculateMd5(input: Uint8Array): string {
  let paddedLength = input.length + 1
  while (paddedLength % 64 !== 56) paddedLength += 1

  const bytes = new Uint8Array(paddedLength + 8)
  bytes.set(input)
  bytes[input.length] = 0x80
  appendLength(bytes, paddedLength, input.length * 8)

  const view = new DataView(bytes.buffer)
  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  for (let offset = 0; offset < bytes.length; offset += 64) {
    const words = Array.from({ length: 16 }, (_, index) => view.getUint32(offset + index * 4, true))
    let a = a0
    let b = b0
    let c = c0
    let d = d0

    for (let index = 0; index < 64; index += 1) {
      let f: number
      let g: number

      if (index < 16) {
        f = (b & c) | (~b & d)
        g = index
      } else if (index < 32) {
        f = (d & b) | (~d & c)
        g = (5 * index + 1) % 16
      } else if (index < 48) {
        f = b ^ c ^ d
        g = (3 * index + 5) % 16
      } else {
        f = c ^ (b | ~d)
        g = (7 * index) % 16
      }

      const nextD = c
      c = b
      const tableValue = MD5_TABLE[index] ?? 0
      const wordValue = words[g] ?? 0
      const shiftAmount = MD5_SHIFT_AMOUNTS[index] ?? 0
      b = (b + leftRotate((a + f + tableValue + wordValue) | 0, shiftAmount)) | 0
      a = d
      d = nextD
    }

    a0 = (a0 + a) | 0
    b0 = (b0 + b) | 0
    c0 = (c0 + c) | 0
    d0 = (d0 + d) | 0
  }

  return `${toHex(a0)}${toHex(b0)}${toHex(c0)}${toHex(d0)}`
}

export async function getFileMd5(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  return calculateMd5(new Uint8Array(buffer))
}
