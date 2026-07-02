import * as XLSX from 'xlsx'

type XlsConvertWorkerRequest = {
  id: string
  buffer: ArrayBuffer
}

type XlsConvertWorkerScope = {
  onmessage: ((event: MessageEvent<XlsConvertWorkerRequest>) => void) | null
  postMessage: (message: unknown, transfer?: Transferable[]) => void
}

const workerSelf = self as unknown as XlsConvertWorkerScope

workerSelf.onmessage = (event: MessageEvent<XlsConvertWorkerRequest>) => {
  const { id, buffer } = event.data
  try {
    const workbook = XLSX.read(buffer, { type: 'array', cellStyles: true })
    const output = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer
    workerSelf.postMessage({ id, ok: true, buffer: output }, [output])
  } catch {
    workerSelf.postMessage({ id, ok: false })
  }
}
