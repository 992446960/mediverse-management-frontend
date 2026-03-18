<template>
  <div class="kb-home h-full flex flex-col items-center justify-center bg-white p-8">
    <div class="w-full max-w-3xl space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold text-gray-900">{{ t('knowledgeSearch.title') }}</h1>
        <p class="text-gray-500">{{ t('knowledgeSearch.subtitle') }}</p>
      </div>

      <!-- Search Box -->
      <div class="relative">
        <a-input-search
          v-model:value="searchQuery"
          :placeholder="t('knowledgeSearch.searchPlaceholder')"
          size="large"
          class="kb-search-input"
          :loading="loading"
          @search="handleSearch"
        >
          <template #enterButton>
            <a-button type="primary" size="large">
              <SearchOutlined /> {{ t('knowledgeSearch.searchButton') }}
            </a-button>
          </template>
        </a-input-search>
      </div>

      <!-- Recent Searches -->
      <div v-if="recentSearches.length > 0" class="space-y-2">
        <div class="text-sm text-gray-500 font-medium">
          {{ t('knowledgeSearch.recentSearches') }}:
        </div>
        <div class="flex flex-wrap gap-2">
          <a-tag
            v-for="tag in recentSearches"
            :key="tag"
            class="cursor-pointer hover:text-blue-600 hover:border-blue-600 transition-colors"
            @click="handleSearch(tag)"
          >
            {{ tag }}
          </a-tag>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8 border-t border-gray-100">
        <!-- Recent Files -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900 flex items-center gap-2">
              <FileTextOutlined /> {{ t('knowledge.recentFiles') }}
            </h3>
            <a class="text-xs text-blue-600 hover:underline" href="#">查看全部</a>
          </div>
          <div class="space-y-2">
            <div
              v-for="file in recentFiles"
              :key="file.id"
              class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-600"
            >
              <FileOutlined class="text-gray-400" />
              <span class="truncate flex-1">{{ file.name }}</span>
              <span class="text-xs text-gray-400">{{ file.date }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Cards -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="font-medium text-gray-900 flex items-center gap-2">
              <IdcardOutlined /> {{ t('knowledge.recentCards') }}
            </h3>
            <a class="text-xs text-blue-600 hover:underline" href="#">查看全部</a>
          </div>
          <div class="space-y-2">
            <div
              v-for="card in recentCards"
              :key="card.id"
              class="flex items-center gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer text-sm text-gray-600"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
              <span class="truncate flex-1">{{ card.title }}</span>
              <span class="text-xs text-gray-400">{{ card.author }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  SearchOutlined,
  FileTextOutlined,
  FileOutlined,
  IdcardOutlined,
} from '@ant-design/icons-vue'
import { useKnowledgeSearchStore } from '@/stores/knowledgeSearch'

const router = useRouter()
const { t } = useI18n()
const store = useKnowledgeSearchStore()

const searchQuery = ref('')
const loading = ref(false)

const recentSearches = computed(() => store.sessions.slice(0, 8).map((s) => s.title))
const recentFiles = ref([
  { id: 1, name: '2025年第一季度院感防控手册.pdf', date: '2小时前' },
  { id: 2, name: '急诊科排班表_3月.xlsx', date: '昨天' },
  { id: 3, name: '新员工入职培训材料.pptx', date: '3天前' },
])
const recentCards = ref([
  { id: 1, title: '心肺复苏操作流程', author: '急诊科' },
  { id: 2, title: '抗生素使用规范', author: '药剂科' },
  { id: 3, title: '门诊挂号须知', author: '门诊部' },
])

const handleSearch = async (query: string) => {
  if (!query.trim()) return

  loading.value = true
  try {
    const session = await store.createSession(query)
    router.push(`/knowledge-base/search/${session.id}`)
  } catch (error) {
    console.error('Failed to create search session:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  store.fetchSessions()
})
</script>

<style scoped>
.kb-search-input :deep(.ant-input-lg) {
  font-size: 1.125rem;
  padding-left: 1rem;
  padding-right: 1rem;
}
</style>
