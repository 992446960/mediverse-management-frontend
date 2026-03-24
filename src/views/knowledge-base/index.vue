<template>
  <div
    class="kb-home h-full flex flex-col items-center justify-center bg-(--color-bg-container) p-8"
  >
    <div class="w-full max-w-5xl space-y-8">
      <div class="text-center space-y-2">
        <h1 class="text-3xl font-bold text-(--color-text-base)">
          {{ t('knowledgeSearch.title') }}
        </h1>
        <p class="text-(--color-text-secondary)">{{ t('knowledgeSearch.subtitle') }}</p>
      </div>

      <!-- Search Box -->
      <div class="relative">
        <a-input-search
          v-model:value="searchQuery"
          :placeholder="t('knowledgeSearch.searchPlaceholder')"
          size="large"
          class="kb-search-input"
          @search="handleSearch"
        >
          <template #enterButton>
            <a-button type="primary" class="kb-search-btn">
              <SearchOutlined /> {{ t('knowledgeSearch.searchButton') }}
            </a-button>
          </template>
        </a-input-search>
      </div>

      <!-- Recent Searches（全量 history + 清空 DELETE chat/sessions/kb-search/by-user） -->
      <div v-if="recentLoading || recentItems.length > 0" class="space-y-2">
        <div class="flex items-center justify-between gap-2">
          <div class="text-sm text-(--color-text-secondary) font-medium">
            {{ t('knowledgeSearch.recentSearches') }}:
          </div>
          <a-button
            v-if="!recentLoading && recentItems.length > 0"
            type="link"
            size="small"
            class="shrink-0 px-0 h-auto text-(--color-text-secondary) hover:text-primary"
            @click="handleClearAllRecent"
          >
            {{ t('knowledgeSearch.clearRecentSearches') }}
          </a-button>
        </div>
        <div v-if="recentLoading" class="py-2 flex justify-center">
          <a-spin size="small" />
        </div>
        <div v-else class="flex flex-wrap gap-2">
          <a-tag
            v-for="item in recentItems"
            :key="item.id"
            closable
            class="cursor-pointer hover:text-primary hover:border-primary transition-colors"
            @click.self="handleSearch(item.query)"
            @close="handleRemoveRecent(item.id)"
          >
            {{ item.query }}
          </a-tag>
        </div>
      </div>

      <!-- 最新文件 / 最新知识卡（按 has_*_avatar + owner_id） -->
      <div class="pt-8 border-t border-(--color-border) space-y-10">
        <template v-if="!hasAnyWorkbench">
          <a-result
            status="info"
            :title="t('knowledgeSearch.homeNoWorkbenchTitle')"
            :sub-title="t('knowledgeSearch.homeNoWorkbenchSubtitle')"
          />
        </template>
        <template v-else>
          <div v-if="kbRecommendLoading" class="flex justify-center py-12">
            <a-spin />
          </div>
          <template v-else>
            <!-- 仅一个工作台：左最新文件、右最新知识卡（大屏并排） -->
            <div
              v-if="visibleScopes.length === 1"
              class="grid grid-cols-1 lg:grid-cols-2 gap-6 gap-y-8 items-start"
            >
              <section class="space-y-4 min-w-0">
                <h2
                  class="text-base font-semibold text-(--color-text-base) flex items-center gap-2 m-0 pb-3"
                >
                  <FileTextOutlined class="text-primary" />
                  {{ t('knowledgeSearch.homeRecentFilesSection') }}
                </h2>
                <div
                  v-for="s in visibleScopes"
                  :key="'files-' + s.scope"
                  class="rounded-xl border border-(--color-border) bg-(--color-bg-container) p-4 space-y-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-medium text-(--color-text-base) m-0 leading-snug">
                      {{ t(FILES_TITLE_KEYS[s.scope]) }}
                    </h3>
                    <a-button
                      v-if="showFilesViewAll(s.scope)"
                      type="link"
                      size="small"
                      class="shrink-0 px-0! h-auto"
                      @click="goFilesList(s.scope)"
                    >
                      {{ t('knowledgeSearch.viewAll') }}
                    </a-button>
                  </div>
                  <p
                    v-if="filesErrorScope[s.scope]"
                    class="text-xs text-(--color-text-tertiary) m-0"
                  >
                    {{ t('knowledgeSearch.homeColumnLoadFailed') }}
                  </p>
                  <p
                    v-else-if="(filesByScope[s.scope] ?? []).length === 0"
                    class="text-xs text-(--color-text-tertiary) m-0"
                  >
                    {{ t('knowledgeSearch.homeColumnEmpty') }}
                  </p>
                  <ul v-else class="space-y-2 m-0 p-0 list-none">
                    <li
                      v-for="file in filesByScope[s.scope]"
                      :key="file.id"
                      role="button"
                      tabindex="0"
                      class="flex items-center gap-2 min-w-0 text-sm text-(--color-text-base) cursor-pointer rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-(--color-bg-layout)"
                      @click="openFilePreview(file, s)"
                      @keydown="(e) => handleKbRowKeydown(e, () => openFilePreview(file, s))"
                    >
                      <FileOutlined class="shrink-0 text-(--color-text-tertiary)" />
                      <span class="truncate flex-1 min-w-0">{{ file.file_name }}</span>
                      <span
                        class="text-xs text-(--color-text-tertiary) shrink-0 text-right max-w-[45%]"
                      >
                        {{
                          t('knowledgeSearch.homeRelativeUpdated', {
                            time: formatRelativeFromNow(file.updated_at),
                          })
                        }}
                      </span>
                    </li>
                  </ul>
                </div>
              </section>

              <section class="space-y-4 min-w-0">
                <h2
                  class="text-base font-semibold text-(--color-text-base) flex items-center gap-2 m-0 pb-3"
                >
                  <IdcardOutlined class="text-primary" />
                  {{ t('knowledgeSearch.homeRecentCardsSection') }}
                </h2>
                <div
                  v-for="s in visibleScopes"
                  :key="'cards-' + s.scope"
                  class="rounded-xl border border-(--color-border) bg-(--color-bg-container) p-4 space-y-3"
                >
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-medium text-(--color-text-base) m-0 leading-snug">
                      {{ t(CARDS_TITLE_KEYS[s.scope]) }}
                    </h3>
                    <a-button
                      v-if="showCardsViewAll(s.scope)"
                      type="link"
                      size="small"
                      class="shrink-0 px-0! h-auto"
                      @click="goCardsList(s.scope)"
                    >
                      {{ t('knowledgeSearch.viewAll') }}
                    </a-button>
                  </div>
                  <p
                    v-if="cardsErrorScope[s.scope]"
                    class="text-xs text-(--color-text-tertiary) m-0"
                  >
                    {{ t('knowledgeSearch.homeColumnLoadFailed') }}
                  </p>
                  <p
                    v-else-if="(cardsByScope[s.scope] ?? []).length === 0"
                    class="text-xs text-(--color-text-tertiary) m-0"
                  >
                    {{ t('knowledgeSearch.homeColumnEmpty') }}
                  </p>
                  <ul v-else class="space-y-2 m-0 p-0 list-none">
                    <li
                      v-for="card in cardsByScope[s.scope]"
                      :key="card.id"
                      role="button"
                      tabindex="0"
                      class="flex items-center gap-2 min-w-0 text-sm text-(--color-text-base) cursor-pointer rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-(--color-bg-layout)"
                      @click="openCardDetail(card, s)"
                      @keydown="(e) => handleKbRowKeydown(e, () => openCardDetail(card, s))"
                    >
                      <span
                        class="w-1.5 h-1.5 rounded-full shrink-0 bg-success"
                        aria-hidden="true"
                      />
                      <span class="truncate flex-1 min-w-0">{{ card.title }}</span>
                      <span
                        class="text-xs text-(--color-text-tertiary) shrink-0 text-right max-w-[45%]"
                      >
                        {{
                          t('knowledgeSearch.homeRelativeUpdated', {
                            time: formatRelativeFromNow(card.updated_at),
                          })
                        }}
                      </span>
                    </li>
                  </ul>
                </div>
              </section>
            </div>

            <!-- 多个工作台：先整块最新文件，再整块最新知识卡 -->
            <div v-else class="space-y-10">
              <section class="space-y-4">
                <h2
                  class="text-base font-semibold text-(--color-text-base) flex items-center gap-2 m-0 pb-3"
                >
                  <FileTextOutlined class="text-primary" />
                  {{ t('knowledgeSearch.homeRecentFilesSection') }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div
                    v-for="s in visibleScopes"
                    :key="'files-' + s.scope"
                    class="rounded-xl border border-(--color-border) bg-(--color-bg-container) p-4 space-y-3"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-sm font-medium text-(--color-text-base) m-0 leading-snug">
                        {{ t(FILES_TITLE_KEYS[s.scope]) }}
                      </h3>
                      <a-button
                        v-if="showFilesViewAll(s.scope)"
                        type="link"
                        size="small"
                        class="shrink-0 px-0! h-auto"
                        @click="goFilesList(s.scope)"
                      >
                        {{ t('knowledgeSearch.viewAll') }}
                      </a-button>
                    </div>
                    <p
                      v-if="filesErrorScope[s.scope]"
                      class="text-xs text-(--color-text-tertiary) m-0"
                    >
                      {{ t('knowledgeSearch.homeColumnLoadFailed') }}
                    </p>
                    <p
                      v-else-if="(filesByScope[s.scope] ?? []).length === 0"
                      class="text-xs text-(--color-text-tertiary) m-0"
                    >
                      {{ t('knowledgeSearch.homeColumnEmpty') }}
                    </p>
                    <ul v-else class="space-y-2 m-0 p-0 list-none">
                      <li
                        v-for="file in filesByScope[s.scope]"
                        :key="file.id"
                        role="button"
                        tabindex="0"
                        class="flex items-center gap-2 min-w-0 text-sm text-(--color-text-base) cursor-pointer rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-(--color-bg-layout)"
                        @click="openFilePreview(file, s)"
                        @keydown="(e) => handleKbRowKeydown(e, () => openFilePreview(file, s))"
                      >
                        <FileOutlined class="shrink-0 text-(--color-text-tertiary)" />
                        <span class="truncate flex-1 min-w-0">{{ file.file_name }}</span>
                        <span
                          class="text-xs text-(--color-text-tertiary) shrink-0 text-right max-w-[45%]"
                        >
                          {{
                            t('knowledgeSearch.homeRelativeUpdated', {
                              time: formatRelativeFromNow(file.updated_at),
                            })
                          }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              <section class="space-y-4">
                <h2
                  class="text-base font-semibold text-(--color-text-base) flex items-center gap-2 m-0 pb-3"
                >
                  <IdcardOutlined class="text-primary" />
                  {{ t('knowledgeSearch.homeRecentCardsSection') }}
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div
                    v-for="s in visibleScopes"
                    :key="'cards-' + s.scope"
                    class="rounded-xl border border-(--color-border) bg-(--color-bg-container) p-4 space-y-3"
                  >
                    <div class="flex items-start justify-between gap-2">
                      <h3 class="text-sm font-medium text-(--color-text-base) m-0 leading-snug">
                        {{ t(CARDS_TITLE_KEYS[s.scope]) }}
                      </h3>
                      <a-button
                        v-if="showCardsViewAll(s.scope)"
                        type="link"
                        size="small"
                        class="shrink-0 px-0! h-auto"
                        @click="goCardsList(s.scope)"
                      >
                        {{ t('knowledgeSearch.viewAll') }}
                      </a-button>
                    </div>
                    <p
                      v-if="cardsErrorScope[s.scope]"
                      class="text-xs text-(--color-text-tertiary) m-0"
                    >
                      {{ t('knowledgeSearch.homeColumnLoadFailed') }}
                    </p>
                    <p
                      v-else-if="(cardsByScope[s.scope] ?? []).length === 0"
                      class="text-xs text-(--color-text-tertiary) m-0"
                    >
                      {{ t('knowledgeSearch.homeColumnEmpty') }}
                    </p>
                    <ul v-else class="space-y-2 m-0 p-0 list-none">
                      <li
                        v-for="card in cardsByScope[s.scope]"
                        :key="card.id"
                        role="button"
                        tabindex="0"
                        class="flex items-center gap-2 min-w-0 text-sm text-(--color-text-base) cursor-pointer rounded-md -mx-1 px-1 py-0.5 transition-colors hover:bg-(--color-bg-layout)"
                        @click="openCardDetail(card, s)"
                        @keydown="(e) => handleKbRowKeydown(e, () => openCardDetail(card, s))"
                      >
                        <span
                          class="w-1.5 h-1.5 rounded-full shrink-0 bg-success"
                          aria-hidden="true"
                        />
                        <span class="truncate flex-1 min-w-0">{{ card.title }}</span>
                        <span
                          class="text-xs text-(--color-text-tertiary) shrink-0 text-right max-w-[45%]"
                        >
                          {{
                            t('knowledgeSearch.homeRelativeUpdated', {
                              time: formatRelativeFromNow(card.updated_at),
                            })
                          }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </template>
        </template>
      </div>
    </div>
    <KnowledgeCardViewer
      v-model:open="cardViewerOpen"
      :card-id="cardViewerCardId"
      :owner-type="cardViewerOwnerType"
      :owner-id="cardViewerOwnerId"
      readonly-preview
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  SearchOutlined,
  FileTextOutlined,
  FileOutlined,
  IdcardOutlined,
} from '@ant-design/icons-vue'
import type { HistoryItem } from '@/api/knowledgeSearch'
import { knowledgeSearchApi } from '@/api/knowledgeSearch'
import { deleteChatSession, deleteKbSearchSessionsByUser } from '@/api/sessions'
import { useKnowledgeSearchStore } from '@/stores/knowledgeSearch'
import { confirmDelete } from '@/utils/confirm'
import {
  useKbHomeRecommendations,
  type KbHomeScope,
  type KbHomeVisibleScope,
} from '@/composables/useKbHomeRecommendations'
import { formatRelativeFromNow } from '@/utils/formatRelativeFromNow'
import KnowledgeCardViewer from '@/components/KnowledgeCardViewer/index.vue'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import type { FileListItem, KnowledgeCard, OwnerType } from '@/types/knowledge'
import { getFileOriginalUrl } from '@/types/knowledge'

const FILES_TITLE_KEYS: Record<KbHomeScope, string> = {
  personal: 'knowledgeSearch.homeFilesPersonal',
  dept: 'knowledgeSearch.homeFilesDept',
  org: 'knowledgeSearch.homeFilesOrg',
}

const CARDS_TITLE_KEYS: Record<KbHomeScope, string> = {
  personal: 'knowledgeSearch.homeCardsPersonal',
  dept: 'knowledgeSearch.homeCardsDept',
  org: 'knowledgeSearch.homeCardsOrg',
}

const FILES_ROUTE: Record<KbHomeScope, 'MyFiles' | 'DeptFiles' | 'OrgFiles'> = {
  personal: 'MyFiles',
  dept: 'DeptFiles',
  org: 'OrgFiles',
}

const CARDS_ROUTE: Record<
  KbHomeScope,
  'MyKnowledgeCards' | 'DeptKnowledgeCards' | 'OrgKnowledgeCards'
> = {
  personal: 'MyKnowledgeCards',
  dept: 'DeptKnowledgeCards',
  org: 'OrgKnowledgeCards',
}

const PREVIEW_ROUTE_NAMES: Record<
  KbHomeScope,
  'MyFilesPreview' | 'DeptFilesPreview' | 'OrgFilesPreview'
> = {
  personal: 'MyFilesPreview',
  dept: 'DeptFilesPreview',
  org: 'OrgFilesPreview',
}

const cardViewerOpen = ref(false)
const cardViewerCardId = ref<string | null>(null)
const cardViewerOwnerType = ref<OwnerType>('personal')
const cardViewerOwnerId = ref('')

const router = useRouter()
const { t } = useI18n()
const store = useKnowledgeSearchStore()

const {
  visibleScopes,
  hasAnyWorkbench,
  filesByScope,
  cardsByScope,
  filesErrorScope,
  cardsErrorScope,
  loading: kbRecommendLoading,
} = useKbHomeRecommendations()

const searchQuery = ref('')
const recentLoading = ref(false)
const recentItems = ref<HistoryItem[]>([])

function showFilesViewAll(scope: KbHomeScope) {
  return !filesErrorScope.value[scope] && (filesByScope.value[scope]?.length ?? 0) > 0
}

function showCardsViewAll(scope: KbHomeScope) {
  return !cardsErrorScope.value[scope] && (cardsByScope.value[scope]?.length ?? 0) > 0
}

function goFilesList(scope: KbHomeScope) {
  router.push({ name: FILES_ROUTE[scope] })
}

function goCardsList(scope: KbHomeScope) {
  router.push({ name: CARDS_ROUTE[scope] })
}

function handleKbRowKeydown(e: KeyboardEvent, fn: () => void) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    fn()
  }
}

function openFilePreview(file: FileListItem, scopeCtx: KbHomeVisibleScope) {
  if (!(getFileOriginalUrl(file) || file.parsed_file_url)) {
    message.warning(t('knowledge.previewNoUrlHint'))
    return
  }
  stashKnowledgePreviewFile(file)
  router.push({
    name: PREVIEW_ROUTE_NAMES[scopeCtx.scope],
    params: { id: file.id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 KnowledgeFiles 预览一致
    state: { file } as any,
  })
}

function openCardDetail(card: KnowledgeCard, scopeCtx: KbHomeVisibleScope) {
  cardViewerCardId.value = card.id
  cardViewerOwnerType.value = scopeCtx.ownerType
  cardViewerOwnerId.value = scopeCtx.ownerId
  cardViewerOpen.value = true
}

const fetchRecentHistory = async () => {
  recentLoading.value = true
  try {
    const list = await knowledgeSearchApi.getHistory()
    recentItems.value = Array.isArray(list) ? list : []
  } catch {
    message.error(t('knowledgeSearch.recentHistoryLoadFailed'))
    recentItems.value = []
  } finally {
    recentLoading.value = false
  }
}

const handleClearAllRecent = () => {
  confirmDelete({
    title: t('knowledgeSearch.clearRecentSearchesTitle'),
    content: t('knowledgeSearch.clearRecentSearchesConfirm'),
    okText: t('knowledgeSearch.clearRecentSearches'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await deleteKbSearchSessionsByUser()
        recentItems.value = []
        store.clearAllLocalState()
        await store.fetchSessions()
        message.success(t('knowledgeSearch.clearRecentSearchesSuccess'))
      } catch {
        message.error(t('knowledgeSearch.clearRecentSearchesFailed'))
      }
    },
  })
}

const handleSearch = (query: string) => {
  const q = query.trim()
  if (!q) return
  router.push({ name: 'KnowledgeBaseSearchNew', query: { q } })
}

const handleRemoveRecent = async (sessionId: string) => {
  try {
    await deleteChatSession(sessionId)
    await store.deleteSession(sessionId)
    await fetchRecentHistory()
  } catch {
    message.error(t('knowledgeSearch.recentHistoryDeleteFailed'))
  }
}

onMounted(() => {
  fetchRecentHistory()
})
</script>

<style scoped>
.kb-search-input :deep(.ant-input-wrapper) {
  display: flex;
  align-items: stretch;
}

.kb-search-input :deep(.ant-input-lg) {
  font-size: 1.125rem;
  padding-left: 1rem;
  padding-right: 1rem;
}

.kb-search-input :deep(.ant-input-group-addon) {
  padding: 0;
  border: none;
  background: transparent;
  display: flex;
}

.kb-search-btn {
  height: 100%;
  margin-left: -1px;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
