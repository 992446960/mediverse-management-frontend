<template>
  <div class="kb-search-page h-full flex flex-col overflow-hidden rounded-md">
    <div class="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-white">
      <!-- Header -->
      <div
        class="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white shrink-0"
      >
        <div class="font-medium text-gray-900 truncate">
          {{ currentSession?.title || t('knowledgeSearch.noTitle') }}
        </div>
        <div class="text-xs text-gray-500">
          {{ currentSession?.updatedAt ? new Date(currentSession.updatedAt).toLocaleString() : '' }}
        </div>
      </div>

      <!-- Thread -->
      <SearchResultThread
        :messages="messages"
        :loading="streaming"
        @question-select="handleFollowUp"
      />

      <!-- Input Area（主题色边框 + 发送图标垂直居中） -->
      <div class="p-4 border-t border-gray-200 bg-white shrink-0">
        <div class="kb-search-input-wrap relative max-w-4xl mx-auto">
          <a-textarea
            v-model:value="inputContent"
            :placeholder="t('knowledgeSearch.followUpPlaceholder')"
            :auto-size="{ minRows: 1, maxRows: 6 }"
            class="kb-search-textarea pr-12 resize-none! rounded-xl! py-3! px-4!"
            :disabled="streaming"
            @keydown.enter.prevent="handleKeydown"
          />
          <div
            class="kb-search-send-wrap absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
          >
            <a-button
              v-if="streaming"
              type="primary"
              danger
              shape="circle"
              size="small"
              @click="stopGeneration"
            >
              <template #icon><PauseOutlined /></template>
            </a-button>
            <a-button
              v-else
              type="primary"
              shape="circle"
              size="medium"
              :disabled="!inputContent.trim()"
              @click="handleFollowUp(inputContent)"
            >
              <template #icon><SendOutlined /></template>
            </a-button>
          </div>
        </div>
        <div class="text-center mt-2 text-xs text-gray-400">
          {{ t('knowledgeSearch.aiDisclaimer') }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { SendOutlined, PauseOutlined } from '@ant-design/icons-vue'
import SearchResultThread from '@/components/SearchResultThread/index.vue'
import { useKnowledgeSearchStore } from '@/stores/knowledgeSearch'

const route = useRoute()
const { t } = useI18n()
const store = useKnowledgeSearchStore()
const { currentSession, messages, streaming } = storeToRefs(store)

const inputContent = ref('')

const clearInput = async () => {
  inputContent.value = ''
  await nextTick()
}

const handleFollowUp = async (content: string) => {
  const text = content.trim()
  if (!text || streaming.value) return

  await clearInput()
  try {
    await store.sendFollowUp(text)
  } catch {
    inputContent.value = text
    await nextTick()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.isComposing || e.key === 'Process') return
  if (!e.shiftKey) {
    handleFollowUp(inputContent.value)
  }
}

const stopGeneration = () => {
  store.stopGeneration()
}

watch(
  () => route.params.id,
  (newId) => {
    if (newId && typeof newId === 'string') {
      void clearInput()
      store.loadMessages(newId)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.kb-search-input-wrap :deep(.kb-search-textarea.ant-input),
.kb-search-input-wrap :deep(.kb-search-textarea.ant-input:hover) {
  border-color: var(--color-border);
}
.kb-search-input-wrap :deep(.kb-search-textarea.ant-input:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent);
}
.kb-search-send-wrap {
  pointer-events: none;
}
.kb-search-send-wrap :deep(.ant-btn) {
  pointer-events: auto;
}
</style>
