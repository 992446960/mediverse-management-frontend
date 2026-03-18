<template>
  <div class="kb-search-page h-full flex">
    <!-- Sidebar -->
    <KBSidebar />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col h-full overflow-hidden bg-white">
      <!-- Header -->
      <div
        class="h-14 border-b border-gray-200 flex items-center justify-between px-6 bg-white flex-shrink-0"
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

      <!-- Input Area -->
      <div class="p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div class="relative max-w-4xl mx-auto">
          <a-textarea
            v-model:value="inputContent"
            :placeholder="t('knowledgeSearch.followUpPlaceholder')"
            :auto-size="{ minRows: 1, maxRows: 6 }"
            class="pr-12 !resize-none !rounded-xl !py-3 !px-4 !border-gray-300 focus:!border-blue-500 focus:!shadow-none"
            :disabled="streaming"
            @keydown.enter.prevent="handleKeydown"
          />
          <div class="absolute right-2 bottom-2">
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
              size="small"
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
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { SendOutlined, PauseOutlined } from '@ant-design/icons-vue'
import KBSidebar from '@/components/KBSidebar/index.vue'
import SearchResultThread from '@/components/SearchResultThread/index.vue'
import { useKnowledgeSearchStore } from '@/stores/knowledgeSearch'

const route = useRoute()
const { t } = useI18n()
const store = useKnowledgeSearchStore()
const { currentSession, messages, streaming } = storeToRefs(store)

const inputContent = ref('')

const handleFollowUp = async (content: string) => {
  if (!content.trim() || streaming.value) return

  const text = content
  inputContent.value = ''
  await store.sendFollowUp(text)
}

const handleKeydown = (e: KeyboardEvent) => {
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
      store.loadMessages(newId)
    }
  },
  { immediate: true }
)
</script>
