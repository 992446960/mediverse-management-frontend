<template>
  <a-modal
    :open="open"
    :title="t('knowledge.card.detailTitle')"
    width="min(960px, 94vw)"
    centered
    :footer="null"
    destroy-on-close
    :body-style="{
      minHeight: 'min(520px, calc(100vh - 180px))',
      maxHeight: 'calc(100vh - 160px)',
      overflowY: 'auto',
      paddingTop: '8px',
    }"
    wrap-class-name="knowledge-card-detail-modal"
    @update:open="onDetailOpenChange"
  >
    <a-spin :spinning="loading">
      <div v-if="card" class="card-viewer">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col gap-2">
            <h2 class="text-xl font-bold m-0">{{ card.title }}</h2>
            <a-space>
              <a-tag :color="getCardTypeConfig(card.type).color">{{
                getCardTypeConfig(card.type).label
              }}</a-tag>
              <a-tag :color="ONLINE_STATUS_CONFIG[card.online_status].color">{{
                ONLINE_STATUS_CONFIG[card.online_status].label
              }}</a-tag>
              <a-tag :color="AUDIT_STATUS_CONFIG[card.audit_status].color">{{
                AUDIT_STATUS_CONFIG[card.audit_status].label
              }}</a-tag>
            </a-space>
          </div>
          <div v-if="!readonlyPreview" class="flex flex-wrap items-center justify-end gap-2">
            <a-button type="default" @click="handleEditFromContent">
              <template #icon>
                <EditOutlined />
              </template>
              {{ t('common.edit') }}
            </a-button>
            <a-button
              :type="card.online_status === 'online' ? 'default' : 'primary'"
              @click="handleStatusToggle"
            >
              <template #icon>
                <CloudUploadOutlined v-if="card.online_status === 'offline'" />
                <CloudDownloadOutlined v-else />
              </template>
              {{
                card.online_status === 'online'
                  ? t('knowledge.card.offline')
                  : t('knowledge.card.online')
              }}
            </a-button>
            <a-popconfirm
              :title="t('knowledge.card.confirmDelete')"
              :ok-text="t('common.confirm')"
              :cancel-text="t('common.cancel')"
              @confirm="handleDelete"
            >
              <a-button danger>
                <template #icon>
                  <DeleteOutlined />
                </template>
                {{ t('common.delete') }}
              </a-button>
            </a-popconfirm>
          </div>
        </div>

        <!-- 知识库入口：仅正文 + 溯源，无 Tab、无上下线 -->
        <template v-if="readonlyPreview">
          <div
            class="p-4 bg-gray-50 rounded-lg min-h-[200px] max-h-[min(480px,calc(100vh-240px))] overflow-y-auto"
          >
            <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
            <div class="markdown-body" v-html="renderedContent"></div>
          </div>
          <div v-if="card.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
            <a-tag v-for="tag in card.tags" :key="tag" class="m-0"> #{{ tag }} </a-tag>
          </div>
          <div class="mt-6">
            <AssociatedFilesList
              :rows="sourceFileRows"
              :opening-id="openingSourceFileId"
              @open="openSourceFilePreview"
            />
          </div>
        </template>

        <a-tabs v-else v-model:active-key="activeTab">
          <a-tab-pane key="content" :tab="t('knowledge.card.tabContent')">
            <div
              class="p-4 bg-gray-50 rounded-lg min-h-[200px] max-h-[min(480px,calc(100vh-240px))] overflow-y-auto"
            >
              <!-- eslint-disable-next-line vue/no-v-html -- marked + DOMPurify -->
              <div class="markdown-body" v-html="renderedContent"></div>
            </div>
            <div v-if="card.tags?.length" class="mt-4 flex flex-wrap gap-1.5">
              <a-tag v-for="tag in card.tags" :key="tag" class="m-0"> #{{ tag }} </a-tag>
            </div>

            <div class="mt-6">
              <AssociatedFilesList
                :rows="sourceFileRows"
                :opening-id="openingSourceFileId"
                @open="openSourceFilePreview"
              />
            </div>
          </a-tab-pane>

          <a-tab-pane key="versions" :tab="t('knowledge.card.tabVersions')">
            <VersionTimeline
              :versions="versions"
              :current-version="card.version"
              @compare="handleCompareFromTimeline"
              @rollback="handleRollback"
            />
          </a-tab-pane>

          <a-tab-pane key="diff" :tab="t('knowledge.card.tabDiff')">
            <VersionDiffView
              :diff="diffResult"
              :from-version="diffFrom"
              :to-version="diffTo"
              :versions="versions"
              :loading="diffLoading"
              @change-versions="handleDiffVersionChange"
              @rollback-to="handleRollback"
            />
          </a-tab-pane>

          <a-tab-pane key="info" :tab="t('knowledge.card.tabInfo')">
            <div class="p-4 space-y-4">
              <div class="flex justify-between gap-3 border-b pb-2">
                <span class="text-gray-500 shrink-0">{{ t('knowledge.card.columnTitle') }}</span>
                <span class="font-medium text-(--color-text-base) text-right wrap-break-word">{{
                  card.title
                }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('knowledge.card.cardId') }}</span>
                <span class="font-mono">{{ card.id }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.createdBy') }}</span>
                <span>{{ card.created_by_name }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.createdAt') }}</span>
                <span>{{ dayjs(card.created_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('common.updatedAt') }}</span>
                <span>{{ dayjs(card.updated_at).format('YYYY-MM-DD HH:mm:ss') }}</span>
              </div>
              <div class="flex justify-between border-b pb-2">
                <span class="text-gray-500">{{ t('knowledge.card.referenceCount') }}</span>
                <span>{{ card.reference_count }} {{ t('knowledge.card.times') }}</span>
              </div>
              <div class="flex flex-col gap-2">
                <span class="text-gray-500">{{ t('knowledge.card.tagsLabel') }}</span>
                <div class="flex flex-wrap gap-1">
                  <a-tag v-for="tag in card.tags" :key="tag">#{{ tag }}</a-tag>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
      <a-empty v-else-if="!loading" :description="t('knowledge.card.notFound')" />
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import type {
  KnowledgeCard,
  KnowledgeCardVersion,
  OnlineStatus,
  OwnerType,
} from '@/types/knowledge'
import type { VersionDiffSegment } from '@/types/knowledge'
import { getCardTypeConfig, ONLINE_STATUS_CONFIG, AUDIT_STATUS_CONFIG } from '@/types/knowledge'
import { getFileOriginalUrl } from '@/types/knowledge'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import {
  getFileListItemById,
  getKnowledgeCardDetail,
  getKnowledgeCardVersions,
  getKnowledgeCardVersionDiff,
  toggleKnowledgeCardStatus,
  rollbackKnowledgeCard,
  deleteKnowledgeCard,
} from '@/api/knowledge'
import { formatFileSize } from '@/utils/formatFileSize'
import AssociatedFilesList from './AssociatedFilesList.vue'
import VersionTimeline from './VersionTimeline.vue'
import VersionDiffView from './VersionDiffView.vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import dayjs from 'dayjs'

const { t } = useI18n()
const router = useRouter()

/** 与 KnowledgeFiles / 知识库首页文件预览路由一致（个人/科室/机构） */
const PREVIEW_ROUTE_NAMES: Record<'personal' | 'dept' | 'org', string> = {
  personal: 'MyFilesPreview',
  dept: 'DeptFilesPreview',
  org: 'OrgFilesPreview',
}

const props = withDefaults(
  defineProps<{
    open: boolean
    cardId: string | null
    ownerType: OwnerType
    ownerId: string
    /** 知识库等只读场景：无上下线、仅正文与溯源，无版本/信息 Tab */
    readonlyPreview?: boolean
  }>(),
  {
    readonlyPreview: false,
  }
)

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  /** 上下线成功后通知父级就地更新列表行，不请求列表接口 */
  (e: 'status-changed', payload: { id: string; online_status: OnlineStatus }): void
  (e: 'edit', card: KnowledgeCard): void
  /** 删除成功后通知父级刷新列表 */
  (e: 'deleted', cardId: string): void
}>()

const activeTab = ref('content')
const loading = ref(false)
const openingSourceFileId = ref<string | null>(null)
const card = ref<KnowledgeCard | null>(null)
const versions = ref<KnowledgeCardVersion[]>([])

// 版本对比状态
const diffResult = ref<VersionDiffSegment[]>([])
const diffFrom = ref<number>(0)
const diffTo = ref<number>(0)
const diffLoading = ref(false)

const renderedContent = computed(() => {
  const content = card.value?.content || ''
  const html = marked.parse(content) as string
  return DOMPurify.sanitize(html)
})

function inferFileExtension(name: string | undefined): string {
  if (!name) return ''
  const m = name.match(/\.([^.]+)$/)
  const ext = m?.[1]
  return ext ? ext.toLowerCase() : ''
}

/** 关联文件类型角标（与 AssociatedFilesList 中 assets/icons 一致） */
function classifyThumbKind(ft: string): 'pdf' | 'doc' | 'xls' | 'ppt' | 'img' | 'txt' | 'default' {
  const e = ft.toLowerCase()
  if (e === 'pdf') return 'pdf'
  if (['doc', 'docx'].includes(e)) return 'doc'
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'xls'
  if (['ppt', 'pptx'].includes(e)) return 'ppt'
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(e)) return 'img'
  if (['txt', 'md', 'json', 'jsonl'].includes(e)) return 'txt'
  return 'default'
}

const sourceFileRows = computed(() => {
  const files = card.value?.source_files ?? []
  return files.map((s) => {
    const ft = (s.file_type ?? inferFileExtension(s.name)).toLowerCase()
    const thumbKind = classifyThumbKind(ft)
    const sizeLabel =
      typeof s.file_size === 'number' && s.file_size >= 0 ? formatFileSize(s.file_size) : '—'
    return { source: s, thumbKind, sizeLabel }
  })
})

const fetchCardDetails = async (id: string) => {
  loading.value = true
  try {
    const cardData = await getKnowledgeCardDetail(props.ownerType, props.ownerId, id)
    card.value = cardData
    if (props.readonlyPreview) {
      versions.value = []
    } else {
      versions.value = await getKnowledgeCardVersions(props.ownerType, props.ownerId, id)
    }
  } catch (err) {
    console.error('Fetch card failed:', err)
    message.error(t('knowledge.card.fetchDetailFailed'))
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (val && props.cardId) {
      card.value = null
      activeTab.value = 'content'
      diffResult.value = []
      diffFrom.value = 0
      diffTo.value = 0
      fetchCardDetails(props.cardId)
    }
  }
)

function onDetailOpenChange(val: boolean) {
  emit('update:open', val)
}

function handleEditFromContent() {
  if (!card.value) return
  emit('edit', card.value)
  emit('update:open', false)
}

async function openSourceFilePreview(item: KnowledgeCard['source_files'][number]) {
  if (!item.id) {
    message.warning(t('knowledge.missingFileId'))
    return
  }
  if (props.ownerType === 'avatar') {
    message.warning(t('knowledge.card.sourceFilePreviewUnsupported'))
    return
  }
  const routeName = PREVIEW_ROUTE_NAMES[props.ownerType]
  if (!routeName) return

  openingSourceFileId.value = item.id
  try {
    const file = await getFileListItemById(props.ownerType, props.ownerId, item.id)
    if (!file) {
      message.error(t('knowledge.card.sourceFileNotFoundInWorkspace'))
      return
    }
    if (!(getFileOriginalUrl(file) || file.parsed_file_url)) {
      message.warning(t('knowledge.previewNoUrlHint'))
      return
    }
    stashKnowledgePreviewFile(file, { ownerType: props.ownerType, ownerId: props.ownerId })
    emit('update:open', false)
    router.push({
      name: routeName,
      params: { id: file.id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- 与 KnowledgeFiles 预览一致
      state: { file } as any,
    })
  } finally {
    openingSourceFileId.value = null
  }
}

// ─── 版本对比 ───────────────────────────────────────────

async function loadDiff(from: number, to: number) {
  if (!props.cardId || from === to) return
  diffLoading.value = true
  try {
    const result = await getKnowledgeCardVersionDiff(
      props.ownerType,
      props.ownerId,
      props.cardId,
      from,
      to
    )
    diffResult.value = result.diff
  } catch (err) {
    console.error('Load diff failed:', err)
    message.error(t('knowledge.card.diffFailed'))
    diffResult.value = []
  } finally {
    diffLoading.value = false
  }
}

async function handleCompareFromTimeline(fromVersion: number, toVersion: number) {
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  activeTab.value = 'diff'
  await loadDiff(fromVersion, toVersion)
}

async function handleDiffVersionChange(fromVersion: number, toVersion: number) {
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  await loadDiff(fromVersion, toVersion)
}

// ─── 回滚 & 上下线 ─────────────────────────────────────

const handleRollback = async (version: string, targetVersion: number) => {
  if (!props.cardId) return
  try {
    const updated = await rollbackKnowledgeCard(
      props.ownerType,
      props.ownerId,
      props.cardId,
      targetVersion
    )
    card.value = updated
    versions.value = await getKnowledgeCardVersions(props.ownerType, props.ownerId, props.cardId)
    diffResult.value = []
    diffFrom.value = 0
    diffTo.value = 0
    message.success(t('knowledge.card.rollbackSuccess', { version }))
  } catch (err) {
    console.error('Rollback failed:', err)
    message.error(t('knowledge.card.rollbackFailed'))
  }
}

const handleStatusToggle = async () => {
  if (!card.value) return
  const newStatus = card.value.online_status === 'online' ? 'offline' : 'online'
  try {
    await toggleKnowledgeCardStatus(props.ownerType, props.ownerId, card.value.id, newStatus)
    card.value.online_status = newStatus
    message.success(
      newStatus === 'online'
        ? t('knowledge.card.onlineSuccess')
        : t('knowledge.card.offlineSuccess')
    )
    emit('status-changed', { id: card.value.id, online_status: newStatus })
  } catch (err) {
    console.error('Status toggle failed:', err)
    message.error(t('common.error'))
  }
}

const handleDelete = async () => {
  if (!card.value) return
  const cardId = card.value.id
  try {
    await deleteKnowledgeCard(props.ownerType, props.ownerId, cardId)
    message.success(t('knowledge.card.deleteSuccess'))
    emit('deleted', cardId)
    emit('update:open', false)
  } catch (err) {
    console.error('Delete card failed:', err)
    message.error(t('knowledge.card.deleteFailed'))
  }
}
</script>

<style scoped>
.markdown-body {
  line-height: 1.6;
}
.markdown-body :deep(h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}
.markdown-body :deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
}
.markdown-body :deep(h4) {
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}
.markdown-body :deep(p) {
  margin-bottom: 1rem;
}
.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}
.markdown-body :deep(li) {
  margin-bottom: 0.25rem;
}
.markdown-body :deep(blockquote) {
  border-left: 4px solid #dfe2e5;
  color: #6a737d;
  padding-left: 1rem;
  margin-left: 0;
  margin-bottom: 1rem;
}
.markdown-body :deep(code) {
  background-color: rgba(27, 31, 35, 0.05);
  border-radius: 3px;
  font-size: 85%;
  margin: 0;
  padding: 0.2em 0.4em;
}
</style>
