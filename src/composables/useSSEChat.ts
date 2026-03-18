import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ThinkingProcessStep } from '@/types/chat'

export interface SSEChatCallbacks {
  onDelta?: (text: string) => void
  /** thinking_step 事件到达时调用，用于实时同步思考步骤到消息（符合 API 文档与开发规范） */
  onThinkingStep?: () => void
  onDone?: (messageId: string, tokensUsed?: number) => void
  /** 流结束但未收到 done 事件时调用（如后端直接关闭连接），用于收尾 UI 状态 */
  onStreamEnd?: () => void
  onError?: (err: string, code?: number) => void
}

export interface UseSSEChatReturn {
  streaming: Ref<boolean>
  currentText: Ref<string>
  thinkingProcess: Ref<ThinkingProcessStep[]>
  error: Ref<string | null>
  consumeSSE: (response: Response, callbacks?: SSEChatCallbacks) => Promise<void>
  stopGeneration: () => void
}

export function useSSEChat(): UseSSEChatReturn {
  const streaming = ref(false)
  const currentText = ref('')
  const thinkingProcess = ref<ThinkingProcessStep[]>([])
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    streaming.value = false
  }

  /** 让出事件循环，使 Vue 能 flush 响应式更新并触发渲染（解决流式内容一次性渲染的 bug） */
  const yieldToEventLoop = () => new Promise<void>((r) => setTimeout(r, 0))

  async function processSSEStream(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    callbacks: SSEChatCallbacks = {}
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

              case 'delta':
              case 'message':
              case 'chunk': {
                const content = event.content ?? event.text ?? event.data
                const str = typeof content === 'string' ? content : ''
                if (str) {
                  currentText.value += str
                  callbacks.onDelta?.(str)
                  await yieldToEventLoop()
                }
                break
              }

              case 'done':
              case 'end':
              case 'finish': {
                const messageId = event.message_id ?? event.messageId ?? event.id
                const tokensUsed = event.tokens_used ?? event.tokensUsed
                streaming.value = false
                callbacks.onDone?.(
                  typeof messageId === 'string' ? messageId : '',
                  typeof tokensUsed === 'number' ? tokensUsed : undefined
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
            console.warn('[useSSEChat] Failed to parse SSE event:', parseErr)
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
            if (eventType === 'done' || eventType === 'end' || eventType === 'finish') {
              const messageId = event.message_id ?? event.messageId ?? event.id
              const tokensUsed = event.tokens_used ?? event.tokensUsed
              streaming.value = false
              callbacks.onDone?.(
                typeof messageId === 'string' ? messageId : '',
                typeof tokensUsed === 'number' ? tokensUsed : undefined
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
            if (eventType === 'delta' || eventType === 'message' || eventType === 'chunk') {
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
    callbacks: SSEChatCallbacks = {}
  ): Promise<void> => {
    streaming.value = true
    currentText.value = ''
    thinkingProcess.value = []
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

  return {
    streaming,
    currentText,
    thinkingProcess,
    error,
    consumeSSE,
    stopGeneration,
  }
}
