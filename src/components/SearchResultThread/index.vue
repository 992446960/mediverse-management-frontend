<template>
  <div class="search-result-thread flex-1 overflow-y-auto p-6 space-y-6">
    <div
      v-if="messages.length === 0"
      class="flex flex-col items-center justify-center h-full text-gray-400"
    >
      <SearchOutlined class="text-4xl mb-4" />
      <p>{{ t('knowledgeSearch.startNewSearch') }}</p>
    </div>

    <div v-for="msg in messages" :key="msg.id" class="message-item group">
      <!-- User Message（与分身聊天气泡风格一致，使用主题色） -->
      <div v-if="msg.role === 'user'" class="flex justify-end mb-4">
        <div
          class="kb-user-bubble text-white px-4 py-2 rounded-2xl rounded-tr-sm max-w-[80%] shadow-sm"
        >
          {{ msg.content }}
        </div>
      </div>

      <!-- Assistant Message（气泡宽度适应内容；复制按钮在气泡下方 hover 展示） -->
      <div v-else class="kb-assistant-row flex gap-3 mb-6 group">
        <div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
          <RobotOutlined class="text-indigo-600" />
        </div>

        <div class="kb-assistant-content w-fit max-w-full flex flex-col">
          <!-- Thinking Process (API 无 thinkingSteps 时为空) -->
          <ThinkingProcess
            v-if="msg.thinkingSteps && msg.thinkingSteps.length > 0"
            :steps="
              (msg.thinkingSteps as ThinkingStep[]).map((s) => ({ ...s, content: s.content ?? '' }))
            "
          />

          <!-- Content 气泡 -->
          <div class="bg-white border border-gray-100 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <BubbleRenderer
              :content="msg.content"
              :show-copy-button="false"
              @citation-click="(index: number) => handleCitationClick(msg, index)"
            />

            <!-- Citations -->
            <div
              v-if="msg.citations && msg.citations.length > 0"
              class="mt-4 pt-4 border-t border-gray-100"
            >
              <div class="text-xs font-medium text-gray-500 mb-2">
                {{ t('knowledgeSearch.citationLabel') }}:
              </div>
              <div class="flex flex-wrap gap-2">
                <CitationLink
                  v-for="(citation, idx) in msg.citations"
                  :key="citation.id"
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

          <!-- 复制按钮：hover 时显示在气泡下方 -->
          <div
            class="kb-copy-below opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex items-center"
          >
            <a-tooltip :title="t('common.copy')">
              <a-button
                type="text"
                size="small"
                class="text-gray-400 hover:text-gray-600"
                @click="copyMessageContent(msg.content)"
              >
                <template #icon><CopyOutlined /></template>
              </a-button>
            </a-tooltip>
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
          <a :href="currentCitation.url" target="_blank" class="text-blue-600 hover:underline">{{
            t('knowledgeSearch.viewOriginal')
          }}</a>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { SearchOutlined, RobotOutlined, CopyOutlined } from '@ant-design/icons-vue'
import BubbleRenderer from '@/components/ChatWindow/BubbleRenderer.vue'
import ThinkingProcess from '@/components/ChatWindow/ThinkingProcess.vue'
import CitationLink from './CitationLink.vue'
import RelatedQuestions from './RelatedQuestions.vue'
import type { SearchMessage, Citation } from '@/api/knowledgeSearch'
import type { ThinkingStep } from '@/types/chat'

const { t } = useI18n()
const props = defineProps<{
  messages: SearchMessage[]
  loading?: boolean
}>()

const emit = defineEmits(['question-select'])

const handleQuestionSelect = (question: string) => {
  emit('question-select', question)
}

const copyMessageContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    message.success(t('common.copied'))
  } catch {
    message.error(t('common.copyFailed'))
  }
}

const handleCitationClick = (msg: SearchMessage, index: number) => {
  // Find the CitationLink component instance corresponding to this citation index
  // Note: This assumes citations are 1-indexed and match the array index + 1
  // We need to find the specific CitationLink component in the list for this message
  // But citationRefs is a flat array of all CitationLink components rendered in the loop
  // This is tricky with v-for inside v-for.
  // A simpler way is to emit an event or use a global store/modal for citation details.
  // Or, just find the citation object and open a modal directly here.

  const citation = msg.citations?.[index - 1]
  if (citation) {
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

<style scoped>
.kb-user-bubble {
  background: var(--color-primary);
}
</style>
