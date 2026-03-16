<template>
  <div class="search-result-thread flex-1 overflow-y-auto p-6 space-y-6">
    <div
      v-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-gray-400"
    >
      <SearchOutlined class="text-4xl mb-4" />
      <p>开始新的搜索...</p>
    </div>

    <div v-for="msg in messages" :key="msg.id" class="message-item group">
      <!-- User Message -->
      <div v-if="msg.role === 'user'" class="flex justify-end mb-4">
        <div
          class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm"
        >
          {{ msg.content }}
        </div>
      </div>

      <!-- Assistant Message -->
      <div v-else class="flex gap-3 mb-6">
        <div
          class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0"
        >
          <RobotOutlined class="text-indigo-600" />
        </div>

        <div class="flex-1 min-w-0">
          <!-- Thinking Process -->
          <ThinkingProcess
            v-if="msg.thinkingSteps && msg.thinkingSteps.length > 0"
            :steps="msg.thinkingSteps"
          />

          <!-- Content -->
          <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <BubbleRenderer
              :content="msg.content"
              @citation-click="(index) => handleCitationClick(msg, index)"
            />

            <!-- Citations -->
            <div
              v-if="msg.citations && msg.citations.length > 0"
              class="mt-4 pt-4 border-t border-gray-100"
            >
              <div class="text-xs font-medium text-gray-500 mb-2">引用来源:</div>
              <div class="flex flex-wrap gap-2">
                <CitationLink
                  v-for="(citation, idx) in msg.citations"
                  :key="citation.id"
                  ref="citationRefs"
                  :citation="citation"
                  :index="idx + 1"
                />
              </div>
            </div>

            <!-- Related Questions -->
            <div v-if="msg.relatedQuestions && msg.relatedQuestions.length > 0" class="mt-4">
              <RelatedQuestions :questions="msg.relatedQuestions" @select="handleQuestionSelect" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Streaming Indicator (if creating new message but not yet in list, though store handles this) -->
    <div v-if="loading && messages.length === 0" class="flex justify-center py-4">
      <a-spin />
    </div>

    <!-- Global Citation Modal for inline clicks -->
    <a-modal v-model:open="detailsVisible" :title="currentCitation?.title" footer="">
      <div v-if="currentCitation" class="prose prose-sm max-w-none">
        <p class="text-gray-600">{{ currentCitation.content }}</p>
        <div v-if="currentCitation.url" class="mt-4">
          <a :href="currentCitation.url" target="_blank" class="text-blue-600 hover:underline"
            >查看原文</a
          >
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { SearchOutlined, RobotOutlined } from '@ant-design/icons-vue'
import BubbleRenderer from '@/components/ChatWindow/BubbleRenderer.vue'
import ThinkingProcess from '@/components/ChatWindow/ThinkingProcess.vue'
import CitationLink from './CitationLink.vue'
import RelatedQuestions from './RelatedQuestions.vue'
import type { SearchMessage, Citation } from '@/api/knowledgeSearch'

const props = defineProps<{
  messages: SearchMessage[]
  loading?: boolean
}>()

const emit = defineEmits(['question-select'])

const citationRefs = ref<any[]>([])

const handleQuestionSelect = (question: string) => {
  emit('question-select', question)
}

const handleCitationClick = (msg: SearchMessage, index: number) => {
  // Find the CitationLink component instance corresponding to this citation index
  // Note: This assumes citations are 1-indexed and match the array index + 1
  // We need to find the specific CitationLink component in the list for this message
  // But citationRefs is a flat array of all CitationLink components rendered in the loop
  // This is tricky with v-for inside v-for.
  // A simpler way is to emit an event or use a global store/modal for citation details.
  // Or, just find the citation object and open a modal directly here.

  if (msg.citations && msg.citations[index - 1]) {
    const citation = msg.citations[index - 1]
    // Open modal directly or trigger method on CitationLink if possible
    // Since we don't have easy access to the specific component instance, let's just use a local state for modal
    currentCitation.value = citation
    detailsVisible.value = true
  }
}

const currentCitation = ref<Citation | null>(null)
const detailsVisible = ref(false)

// Auto-scroll to bottom
watch(
  () => props.messages.length,
  () => {
    nextTick(() => {
      const container = document.querySelector('.search-result-thread')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })
  }
)
</script>
