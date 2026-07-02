import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LEGACY_XLS_CONVERT_TIMEOUT_MS } from '../../src/components/FilePreview/excelFileKind'
import {
  XlsConvertError,
  convertLegacyXlsInWorker,
} from '../../src/components/FilePreview/xlsConvertClient'

class FakeWorker {
  static instances: FakeWorker[] = []

  onmessage: ((event: MessageEvent) => void) | null = null
  onerror: ((event: ErrorEvent) => void) | null = null
  postedMessages: Array<{
    message: { id: string; buffer: ArrayBuffer }
    transfer?: Transferable[]
  }> = []
  terminated = false

  constructor() {
    FakeWorker.instances.push(this)
  }

  postMessage(message: { id: string; buffer: ArrayBuffer }, transfer?: Transferable[]) {
    this.postedMessages.push({ message, transfer })
  }

  terminate() {
    this.terminated = true
  }

  emitMessage(data: unknown) {
    this.onmessage?.({ data } as MessageEvent)
  }

  emitError() {
    this.onerror?.({ type: 'error' } as ErrorEvent)
  }
}

describe('convertLegacyXlsInWorker', () => {
  beforeEach(() => {
    FakeWorker.instances = []
    Object.defineProperty(globalThis, 'Worker', {
      configurable: true,
      writable: true,
      value: FakeWorker,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('resolves with the converted buffer and terminates the worker', async () => {
    const input = new ArrayBuffer(4)
    const output = new ArrayBuffer(8)

    const promise = convertLegacyXlsInWorker(input)
    const worker = FakeWorker.instances[0]
    const id = worker.postedMessages[0].message.id

    worker.emitMessage({ id, ok: true, buffer: output })

    await expect(promise).resolves.toBe(output)
    expect(worker.terminated).toBe(true)
    expect(worker.postedMessages[0].transfer).toEqual([input])
  })

  it('rejects with timeout and terminates the worker', async () => {
    vi.useFakeTimers()
    const promise = convertLegacyXlsInWorker(new ArrayBuffer(4), LEGACY_XLS_CONVERT_TIMEOUT_MS)
    const worker = FakeWorker.instances[0]

    vi.advanceTimersByTime(LEGACY_XLS_CONVERT_TIMEOUT_MS)

    await expect(promise).rejects.toMatchObject({ reason: 'timeout' })
    expect(worker.terminated).toBe(true)
  })

  it('rejects with convert-error when the worker returns failure', async () => {
    const promise = convertLegacyXlsInWorker(new ArrayBuffer(4))
    const worker = FakeWorker.instances[0]
    const id = worker.postedMessages[0].message.id

    worker.emitMessage({ id, ok: false })

    await expect(promise).rejects.toBeInstanceOf(XlsConvertError)
    await expect(promise).rejects.toMatchObject({ reason: 'convert-error' })
    expect(worker.terminated).toBe(true)
  })

  it('rejects with worker-error when the worker emits an error', async () => {
    const promise = convertLegacyXlsInWorker(new ArrayBuffer(4))
    const worker = FakeWorker.instances[0]

    worker.emitError()

    await expect(promise).rejects.toMatchObject({ reason: 'worker-error' })
    expect(worker.terminated).toBe(true)
  })
})
