import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ThinkingProcessStep } from '@/types/chat'
import type { SkillExecuteResult } from '@/types/skill'

export interface SkillExecuteCallbacks {
  onDelta?: (text: string) => void
  onThinkingStep?: () => void
  onDone?: (
    result: SkillExecuteResult,
    skillRunId?: string,
    tokensUsed?: number,
    durationMs?: number
  ) => void
  onStreamEnd?: () => void
  onError?: (err: string, code?: number) => void
}

export interface UseSkillExecuteReturn {
  execute: (
    skillCode: string,
    args: Record<string, any>,
    context?: { session_id?: string; avatar_id?: string }
  ) => Promise<void>
  streaming: Ref<boolean>
  currentText: Ref<string>
  thinkingProcess: Ref<ThinkingProcessStep[]>
  result: Ref<SkillExecuteResult | null>
  error: Ref<string | null>
  consumeSSE: (response: Response, callbacks?: SkillExecuteCallbacks) => Promise<void>
  stopGeneration: () => void
  reset: () => void
}

export function useSkillExecute(): UseSkillExecuteReturn {
  const streaming = ref(false)
  const currentText = ref('')
  const thinkingProcess = ref<ThinkingProcessStep[]>([])
  const result = ref<SkillExecuteResult | null>(null)
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    streaming.value = false
  }

  const reset = () => {
    stopGeneration()
    currentText.value = ''
    thinkingProcess.value = []
    result.value = null
    error.value = null
  }

  const yieldToEventLoop = () => new Promise<void>((r) => setTimeout(r, 0))

  async function processSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    callbacks: SkillExecuteCallbacks = {}
  ): Promise<void> {
    const decoder = new TextDecoder()
    let buffer = ''

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          let data: string
          if (trimmed.startsWith('data: ')) {
            data = trimmed.slice(6)
          } else if (trimmed.startsWith('data:')) {
            data = trimmed.slice(5).trim()
          } else if (trimmed.startsWith('{')) {
            data = trimmed
          } else {
            continue
          }
          if (data === '' || data === '[DONE]') continue

          try {
            const event = JSON.parse(data) as Record<string, unknown>
            const eventType = String(event.type ?? '')

            switch (eventType) {
              case 'thinking_step': {
                const index: number = Number(event.index ?? 0)
                if (!thinkingProcess.value[index]) {
                  thinkingProcess.value[index] = {
                    title: String(event.title ?? ''),
                    description: '',
                    status: 'processing',
                  }
                }
                const step = thinkingProcess.value[index]!
                if (event.title != null) step.title = String(event.title)
                if (event.description !== undefined) step.description = String(event.description)
                if (event.status != null)
                  step.status = event.status === 'done' ? 'done' : 'processing'
                if (event.duration_ms !== undefined) step.duration_ms = Number(event.duration_ms)
                callbacks.onThinkingStep?.()
                await yieldToEventLoop()
                break
              }

              case 'delta': {
                const content = event.content ?? event.text ?? event.data
                const str = typeof content === 'string' ? content : ''
                if (str) {
                  currentText.value += str
                  callbacks.onDelta?.(str)
                  await yieldToEventLoop()
                }
                break
              }

              case 'done': {
                const skillRunId = event.skill_run_id as string | undefined
                const tokensUsed = event.tokens_used as number | undefined
                const durationMs = event.duration_ms as number | undefined
                const res = event.result as SkillExecuteResult | undefined

                if (res) {
                  result.value = res
                }

                streaming.value = false
                callbacks.onDone?.(
                  res || { parts: [], citations: [] },
                  skillRunId,
                  tokensUsed,
                  durationMs
                )
                return
              }

              case 'error': {
                const msg = event.message ?? event.error ?? 'Unknown SSE error'
                throw new Error(typeof msg === 'string' ? msg : String(msg))
              }

              default:
                break
            }
          } catch (parseErr) {
            console.warn('[useSkillExecute] Failed to parse SSE event:', parseErr)
          }
        }
      }

      // 处理流结束时 buffer 中可能剩余的最后一行
      if (buffer.trim()) {
        const trimmed = buffer.trim()
        let data: string
        if (trimmed.startsWith('data: ')) {
          data = trimmed.slice(6).trim()
        } else if (trimmed.startsWith('data:')) {
          data = trimmed.slice(5).trim()
        } else if (trimmed.startsWith('{')) {
          data = trimmed
        } else {
          data = ''
        }
        if (data && data !== '[DONE]') {
          try {
            const event = JSON.parse(data) as Record<string, unknown>
            const eventType = String(event.type ?? '')

            if (eventType === 'done') {
              const skillRunId = event.skill_run_id as string | undefined
              const tokensUsed = event.tokens_used as number | undefined
              const durationMs = event.duration_ms as number | undefined
              const res = event.result as SkillExecuteResult | undefined

              if (res) {
                result.value = res
              }

              streaming.value = false
              callbacks.onDone?.(
                res || { parts: [], citations: [] },
                skillRunId,
                tokensUsed,
                durationMs
              )
              return
            }
            if (eventType === 'thinking_step') {
              const index: number = Number(event.index ?? 0)
              if (!thinkingProcess.value[index]) {
                thinkingProcess.value[index] = {
                  title: String(event.title ?? ''),
                  description: '',
                  status: 'processing',
                }
              }
              const step = thinkingProcess.value[index]!
              if (event.title != null) step.title = String(event.title)
              if (event.description !== undefined) step.description = String(event.description)
              if (event.status != null)
                step.status = event.status === 'done' ? 'done' : 'processing'
              if (event.duration_ms !== undefined) step.duration_ms = Number(event.duration_ms)
              callbacks.onThinkingStep?.()
            }
            if (eventType === 'delta') {
              const content = event.content ?? event.text ?? event.data
              const str = typeof content === 'string' ? content : ''
              if (str) {
                currentText.value += str
                callbacks.onDelta?.(str)
                await yieldToEventLoop()
              }
            }
          } catch {
            // ignore parse error for trailing buffer
          }
        }
      }
      callbacks.onStreamEnd?.()
    } finally {
      streaming.value = false
      abortController = null
    }
  }

  const consumeSSE = async (
    response: Response,
    callbacks: SkillExecuteCallbacks = {}
  ): Promise<void> => {
    streaming.value = true
    currentText.value = ''
    thinkingProcess.value = []
    result.value = null
    error.value = null

    if (!response.body) {
      error.value = 'Response body is null'
      callbacks.onError?.(error.value)
      streaming.value = false
      return
    }

    try {
      const reader = response.body.getReader()
      await processSSEStream(reader, callbacks)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      error.value = err.message || 'Stream error'
      callbacks.onError?.(error.value!)
      streaming.value = false
    }
  }

  const execute = async (
    skillCode: string,
    args: Record<string, any>,
    context?: { session_id?: string; avatar_id?: string }
  ) => {
    reset()
    try {
      const { executeSkillRaw } = await import('@/api/skills')
      const response = await executeSkillRaw(skillCode, { args, context })
      await consumeSSE(response)
    } catch (err: any) {
      error.value = err.message || 'Execution failed'
    }
  }

  return {
    execute,
    streaming,
    currentText,
    thinkingProcess,
    result,
    error,
    consumeSSE,
    stopGeneration,
    reset,
  }
}
