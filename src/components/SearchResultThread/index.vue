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
            :steps="mapThinkingSteps(msg.thinkingSteps)"
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
              class="mt-4 pt-4 border-t border-(--color-border)"
            >
              <div
                class="kb-section-title flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-2.5"
              >
                <LinkOutlined class="text-primary text-sm" />
                <span>{{ t('knowledgeSearch.citationLabel') }}</span>
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

            <!-- 知识卡明细（与 citations 同源） -->
            <div
              v-if="msg.citations && msg.citations.length > 0"
              class="mt-4 pt-4 border-t border-(--color-border)"
            >
              <div
                class="kb-section-title flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-3"
              >
                <IdcardOutlined class="text-primary text-sm" />
                <span>{{ t('knowledgeSearch.knowledgeCardHitsTitle') }}</span>
              </div>
              <ul class="kb-card-hits list-none space-y-3 m-0 p-0" role="list">
                <li
                  v-for="(citation, idx) in msg.citations"
                  :key="`card-${citation.id}`"
                  role="listitem"
                  class="kb-card-hit-item rounded-lg border border-(--color-border) bg-(--color-bg-container) p-3 shadow-sm transition-all duration-200 hover:border-primary hover:shadow-md"
                >
                  <div class="flex items-start justify-between gap-2 mb-2">
                    <h4
                      class="kb-card-hit-title m-0 min-w-0 flex-1 font-medium text-sm leading-snug text-(--color-text-base) line-clamp-2"
                      :title="`${idx + 1}. ${citation.title}`"
                    >
                      {{ idx + 1 }}. {{ citation.title }}
                    </h4>
                    <span
                      v-if="citation.cardType"
                      class="shrink-0 px-1.5 py-0.5 text-[10px] font-medium border rounded uppercase tracking-wide"
                      :class="cardTypeBadgeClass(citation.cardType)"
                    >
                      {{ cardTypeLabel(citation.cardType) }}
                    </span>
                  </div>
                  <CitationPreviewHtml :content="citation.content" variant="skill" />
                </li>
              </ul>
            </div>

            <!-- 匹配文件 matched_files -->
            <div
              v-if="msg.matchedFiles && msg.matchedFiles.length > 0"
              class="mt-4 pt-4 border-t border-(--color-border)"
            >
              <div
                class="kb-section-title flex items-center gap-1.5 text-xs font-semibold text-(--color-text-secondary) mb-3"
              >
                <FileSearchOutlined class="text-primary text-sm" />
                <span>{{ t('knowledgeSearch.matchedFilesLabel') }}</span>
              </div>
              <ul class="kb-matched-files list-none space-y-2 m-0 p-0">
                <li v-for="file in msg.matchedFiles" :key="file.file_id">
                  <a-tooltip :title="t('knowledgeSearch.openFilePreview')">
                    <button
                      type="button"
                      class="kb-file-hit group w-full cursor-pointer flex items-center gap-3 rounded-xl border border-(--color-border) bg-white px-3 py-2.5 text-left text-sm text-gray-700 shadow-sm transition-all duration-200 hover:-translate-y-px hover:border-primary hover:bg-primary/6 hover:shadow-md active:translate-y-0 active:scale-[0.995] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      @click="openMatchedFilePreview(file)"
                    >
                      <span
                        class="kb-file-hit-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-bg-layout) text-primary transition-all duration-200 group-hover:bg-primary/12 group-hover:scale-105"
                      >
                        <FileOutlined class="text-base" />
                      </span>
                      <span
                        class="truncate flex-1 min-w-0 font-medium text-gray-800 transition-colors duration-200 group-hover:text-primary"
                      >
                        {{ file.file_name }}
                      </span>
                      <span
                        v-if="file.relevance_score != null"
                        class="text-xs text-gray-400 shrink-0 tabular-nums px-1.5 py-0.5 rounded-md bg-(--color-bg-layout) transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-gray-600"
                      >
                        {{ formatRelevancePercent(file.relevance_score) }}
                      </span>
                      <RightOutlined
                        class="text-gray-300 text-xs shrink-0 transition-all duration-200 group-hover:text-primary group-hover:translate-x-px"
                      />
                    </button>
                  </a-tooltip>
                </li>
              </ul>
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
      <div v-if="currentCitation">
        <CitationPreviewHtml :content="currentCitation.content" variant="modal" />
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
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  RobotOutlined,
  CopyOutlined,
  FileOutlined,
  IdcardOutlined,
  LinkOutlined,
  FileSearchOutlined,
  RightOutlined,
} from '@ant-design/icons-vue'
import BubbleRenderer from '@/components/ChatWindow/BubbleRenderer.vue'
import ThinkingProcess from '@/components/ChatWindow/ThinkingProcess.vue'
import CitationLink from './CitationLink.vue'
import CitationPreviewHtml from '@/components/CitationPreviewHtml/index.vue'
import RelatedQuestions from './RelatedQuestions.vue'
import type { SearchMessage, Citation, ThinkingStep, MatchedFile } from '@/api/knowledgeSearch'
import { useAuthStore } from '@/stores/auth'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import { openFilePreview } from '@/utils/fileType'
import { fileListItemFromKbMatchedFile } from '@/utils/kbSearchMatchedFile'
import type { ThinkingProcessStep } from '@/types/chat'
import type { CardType } from '@/types/knowledge'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const props = defineProps<{
  messages: SearchMessage[]
  loading?: boolean
}>()

const emit = defineEmits(['question-select'])

const handleQuestionSelect = (question: string) => {
  emit('question-select', question)
}

/** 与 SkillPanel 引用卡类型徽标一致 */
const CARD_TYPE_BADGE_CLASSES: Record<CardType, string> = {
  evidence:
    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  rule: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  experience:
    'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
}

const CARD_TYPE_I18N_KEYS: Record<CardType, string> = {
  evidence: 'knowledge.card.typeEvidence',
  rule: 'knowledge.card.typeRule',
  experience: 'knowledge.card.typeExperience',
}

function cardTypeBadgeClass(cardType: string): string {
  if (cardType in CARD_TYPE_CONFIG) {
    return CARD_TYPE_BADGE_CLASSES[cardType as CardType]
  }
  return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}

function cardTypeLabel(cardType: string): string {
  if (cardType in CARD_TYPE_I18N_KEYS) {
    return t(CARD_TYPE_I18N_KEYS[cardType as CardType])
  }
  return cardType.toUpperCase()
}

function formatRelevancePercent(score: number): string {
  if (Number.isNaN(score)) return ''
  return `${(score * 100).toFixed(1)}%`
}

function mapThinkingSteps(steps: ThinkingStep[] | undefined): ThinkingProcessStep[] {
  if (!steps?.length) return []
  return steps.map((s) => ({
    title: s.title,
    description: s.content,
    status: s.status === 'success' ? 'done' : 'processing',
    duration_ms: s.duration,
  }))
}

function resolveFilesPreviewRoute(): 'MyFilesPreview' | 'DeptFilesPreview' | 'OrgFilesPreview' {
  const path = router.currentRoute.value.path
  if (path.startsWith('/dept') && authStore.currentDeptId) return 'DeptFilesPreview'
  if (path.startsWith('/org') && authStore.currentOrgId) return 'OrgFilesPreview'
  return 'MyFilesPreview'
}

function openMatchedFilePreview(file: MatchedFile) {
  const direct =
    file.file_url != null && typeof file.file_url === 'string' ? file.file_url.trim() : ''
  if (direct) {
    openFilePreview(direct, file.file_name)
    return
  }
  stashKnowledgePreviewFile(fileListItemFromKbMatchedFile(file))
  const name = resolveFilesPreviewRoute()
  const { href } = router.resolve({ name, params: { id: file.file_id } })
  const url = new URL(href, window.location.origin).href
  window.open(url, '_blank', 'noopener,noreferrer')
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
