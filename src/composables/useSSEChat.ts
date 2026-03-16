import { ref } from 'vue'
import type { Ref } from 'vue'
import type { ThinkingStep } from '@/types/chat'

export interface UseSSEChatReturn {
  streaming: Ref<boolean>
  currentText: Ref<string>
  thinkingSteps: Ref<ThinkingStep[]>
  error: Ref<string | null>
  sendMessage: (
    url: string,
    body: Record<string, any>,
    options?: {
      onDelta?: (text: string) => void
      onDone?: (messageId: string) => void
      onError?: (err: string) => void
    }
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

  const sendMessage = async (
    url: string,
    body: Record<string, any>,
    options: {
      onDelta?: (text: string) => void
      onDone?: (messageId: string) => void
      onError?: (err: string) => void
    } = {}
  ) => {
    // Reset state
    streaming.value = true
    currentText.value = ''
    thinkingSteps.value = []
    error.value = null

    abortController = new AbortController()

    try {
      const token = localStorage.getItem('token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

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
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk

        const lines = buffer.split('\n')
        // Keep the last potentially incomplete line in buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmedLine = line.trim()
          if (!trimmedLine || !trimmedLine.startsWith('data: ')) {
            continue
          }

          const data = trimmedLine.slice(6)
          if (data === '[DONE]') {
            continue
          }

          try {
            const event = JSON.parse(data)

            switch (event.type) {
              case 'thinking_step':
                // Update or add thinking step
                if (event.index !== undefined) {
                  const index = event.index
                  if (!thinkingSteps.value[index]) {
                    thinkingSteps.value[index] = {
                      title: event.title || 'Thinking...',
                      content: '',
                      status: 'thinking',
                    }
                  }

                  if (event.content) {
                    thinkingSteps.value[index].content += event.content
                  }

                  if (event.status) {
                    thinkingSteps.value[index].status = event.status
                  }
                }
                break

              case 'delta':
                if (event.content) {
                  currentText.value += event.content
                  options.onDelta?.(event.content)
                }
                break

              case 'done':
                streaming.value = false
                options.onDone?.(event.message_id)
                return // Stop processing

              case 'error':
                throw new Error(event.message || 'Unknown error')
            }
          } catch (e) {
            console.error('Error parsing SSE event:', e)
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User aborted, not an error
        return
      }
      error.value = err.message || 'Network error'
      options.onError?.(error.value!)
    } finally {
      streaming.value = false
      abortController = null
    }
  }

  return {
    streaming,
    currentText,
    thinkingSteps,
    error,
    sendMessage,
    stopGeneration,
  }
}
