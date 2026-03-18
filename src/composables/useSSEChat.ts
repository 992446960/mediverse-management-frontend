import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ThinkingStep } from '@/types/chat'

export interface SSEChatCallbacks {
  onDelta?: (text: string) => void
  onDone?: (messageId: string, tokensUsed?: number) => void
  onError?: (err: string) => void
}

export interface UseSSEChatReturn {
  streaming: Ref<boolean>
  currentText: Ref<string>
  thinkingSteps: Ref<ThinkingStep[]>
  error: Ref<string | null>
  /**
   * 消费已有的 SSE Response 流（由 sendMessageRaw 获取）
   */
  consumeSSE: (response: Response, callbacks?: SSEChatCallbacks) => Promise<void>
  /**
   * @deprecated 改为先调 sendMessageRaw 获取 Response，再调 consumeSSE
   * 保留以兼容 isTestMode 等场景直接传 URL + JSON body
   */
  sendMessage: (
    url: string,
    body: Record<string, any>,
    callbacks?: SSEChatCallbacks
  ) => Promise<void>
  stopGeneration: () => void
}

export function useSSEChat(): UseSSEChatReturn {
  const streaming = ref(false)
  const currentText = ref('')
  const thinkingSteps = ref<ThinkingStep[]>([])
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
                if (!thinkingSteps.value[index]) {
                  thinkingSteps.value[index] = {
                    title: event.title || '',
                    description: '',
                    status: 'processing',
                  }
                }
                const step = thinkingSteps.value[index]!
                if (event.title) step.title = event.title
                if (event.description)
                  step.description = (step.description || '') + event.description
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
            // ignore malformed events
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
    thinkingSteps.value = []
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

  const sendMessage = async (
    url: string,
    body: Record<string, any>,
    callbacks: SSEChatCallbacks = {}
  ): Promise<void> => {
    streaming.value = true
    currentText.value = ''
    thinkingSteps.value = []
    error.value = null

    abortController = new AbortController()

    try {
      const token = localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      await processSSEStream(reader, callbacks)
    } catch (err: any) {
      if (err?.name === 'AbortError') return
      error.value = err.message || 'Network error'
      callbacks.onError?.(error.value!)
      streaming.value = false
    }
  }

  return {
    streaming,
    currentText,
    thinkingSteps,
    error,
    consumeSSE,
    sendMessage,
    stopGeneration,
  }
}
