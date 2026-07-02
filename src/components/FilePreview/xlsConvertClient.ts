import { LEGACY_XLS_CONVERT_TIMEOUT_MS } from './excelFileKind'

export type XlsConvertFailureReason = 'timeout' | 'convert-error' | 'worker-error'

export class XlsConvertError extends Error {
  reason: XlsConvertFailureReason

  constructor(reason: XlsConvertFailureReason) {
    super(`xls convert failed: ${reason}`)
    this.name = 'XlsConvertError'
    this.reason = reason
  }
}

type XlsConvertWorkerResponse =
  | {
      id: string
      ok: true
      buffer: ArrayBuffer
    }
  | {
      id: string
      ok: false
    }

function createRequestId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function convertLegacyXlsInWorker(
  buffer: ArrayBuffer,
  timeoutMs = LEGACY_XLS_CONVERT_TIMEOUT_MS
): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./xlsConvert.worker.ts', import.meta.url), {
      type: 'module',
    })
    const id = createRequestId()
    let settled = false

    const cleanup = () => {
      if (settled) return
      settled = true
      globalThis.clearTimeout(timer)
      worker.terminate()
    }

    const fail = (reason: XlsConvertFailureReason) => {
      cleanup()
      reject(new XlsConvertError(reason))
    }

    const timer = globalThis.setTimeout(() => {
      fail('timeout')
    }, timeoutMs)

    worker.onmessage = (event: MessageEvent<XlsConvertWorkerResponse>) => {
      const data = event.data
      if (!data || data.id !== id) return
      if (data.ok) {
        cleanup()
        resolve(data.buffer)
        return
      }
      fail('convert-error')
    }

    worker.onerror = () => {
      fail('worker-error')
    }

    worker.postMessage({ id, buffer }, [buffer])
  })
}
