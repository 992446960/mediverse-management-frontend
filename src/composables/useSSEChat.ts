import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ThinkingProcessStep } from '@/types/chat'

export interface SSEChatCallbacks {
  onDelta?: (text: string) => void
  onDone?: (messageId: string, tokensUsed?: number) => void
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
          if (!trimmed || !trimmed.startsWith('data: ')) continue

          const data = trimmed.slice(6)
          if (data === '[DONE]') continue

          try {
            const event = JSON.parse(data)

            switch (event.type) {
              case 'thinking_step': {
                const index: number = event.index ?? 0
                if (!thinkingProcess.value[index]) {
                  thinkingProcess.value[index] = {
                    title: event.title || '',
                    description: '',
                    status: 'processing',
                  }
                }
                const step = thinkingProcess.value[index]!
                if (event.title) step.title = event.title
                if (event.description !== undefined) step.description = event.description
                if (event.status) step.status = event.status === 'done' ? 'done' : 'processing'
                if (event.duration_ms !== undefined) step.duration_ms = event.duration_ms
                break
              }

              case 'delta':
                if (event.content) {
                  currentText.value += event.content
                  callbacks.onDelta?.(event.content)
                }
                break

              case 'done':
                streaming.value = false
                callbacks.onDone?.(event.message_id, event.tokens_used)
                return

              case 'error':
                throw new Error(event.message || 'Unknown SSE error')
            }
          } catch (parseErr) {
            console.warn('[useSSEChat] Failed to parse SSE event:', parseErr)
          }
        }
      }
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
