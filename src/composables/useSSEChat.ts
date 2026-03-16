import { ref } from 'vue'

export interface ThinkingStep {
  title: string
  status: 'pending' | 'success' | 'error'
  content?: string
  duration?: number
}

export interface Citation {
  id: string
  title: string
  content: string
  url?: string
}

export interface SSEEvent {
  type: 'thinking_step' | 'delta' | 'done' | 'error'
  index?: number
  content?: string
  message_id?: string
  title?: string
  status?: 'pending' | 'success' | 'error'
  duration?: number
  citations?: Citation[]
  relatedQuestions?: string[]
}

export function useSSEChat() {
  const streaming = ref(false)
  const currentText = ref('')
  const thinkingSteps = ref<ThinkingStep[]>([])
  const error = ref<string | null>(null)
  let abortController: AbortController | null = null

  const sendMessage = async (
    url: string,
    body: FormData | Record<string, unknown>,
    options?: {
      onDelta?: (text: string) => void
      onThinking?: (steps: ThinkingStep[]) => void
      onDone?: (messageId: string, event?: SSEEvent) => void
      headers?: Record<string, string>
    }
  ) => {
    streaming.value = true
    currentText.value = ''
    thinkingSteps.value = []
    error.value = null
    abortController = new AbortController()

    try {
      const headers = {
        ...(options?.headers || {}),
      }

      // If body is not FormData, set Content-Type to application/json
      let requestBody: BodyInit
      if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'
        requestBody = JSON.stringify(body)
      } else {
        requestBody = body
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: requestBody,
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
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6)
            if (dataStr === '[DONE]') continue

            try {
              const event: SSEEvent = JSON.parse(dataStr)
              handleSSEEvent(event, options)
            } catch (e) {
              console.error('Failed to parse SSE event:', e)
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Generation aborted')
      } else {
        error.value = err.message || 'Unknown error'
      }
    } finally {
      streaming.value = false
      abortController = null
    }
  }

  const handleSSEEvent = (
    event: SSEEvent,
    options?: {
      onDelta?: (text: string) => void
      onThinking?: (steps: ThinkingStep[]) => void
      onDone?: (messageId: string, event?: SSEEvent) => void
    }
  ) => {
    switch (event.type) {
      case 'thinking_step':
        if (typeof event.index === 'number') {
          // Ensure the array is large enough
          while (thinkingSteps.value.length <= event.index) {
            thinkingSteps.value.push({ title: '', status: 'pending' })
          }

          const step = thinkingSteps.value[event.index]
          if (event.title) step.title = event.title
          if (event.status) step.status = event.status
          if (event.content) step.content = (step.content || '') + event.content
          if (event.duration) step.duration = event.duration

          options?.onThinking?.(thinkingSteps.value)
        }
        break
      case 'delta':
        if (event.content) {
          currentText.value += event.content
          options?.onDelta?.(event.content)
        }
        break
      case 'done':
        if (event.message_id) {
          options?.onDone?.(event.message_id, event)
        }
        break
      case 'error':
        error.value = event.content || 'Unknown error from server'
        break
    }
  }

  const stopGeneration = () => {
    if (abortController) {
      abortController.abort()
      abortController = null
      streaming.value = false
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
