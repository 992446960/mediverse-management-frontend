<template>
  <a-modal
    :open="open"
    :title="t('knowledge.card.detailTitle')"
    width="max(960px, 70vw)"
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
    <div v-if="loading && !card" class="knowledge-card-detail-loading">
      <a-spin />
    </div>
    <template v-else>
      <div v-if="card" class="card-viewer">
        <div class="flex items-center justify-between mb-6">
          <div class="flex flex-col gap-2">
            <h2 class="text-xl font-bold m-0">{{ card.title }}</h2>
            <a-space>
              <a-tag :color="getLocalizedCardTypeConfig(card.type).color">{{
                getLocalizedCardTypeConfig(card.type).label
              }}</a-tag>
              <a-tag :color="getLocalizedOnlineStatusConfig(card.online_status).color">{{
                getLocalizedOnlineStatusConfig(card.online_status).label
              }}</a-tag>
              <a-tag :color="getLocalizedAuditStatusConfig(card.audit_status).color">{{
                getLocalizedAuditStatusConfig(card.audit_status).label
              }}</a-tag>
            </a-space>
          </div>
          <div v-if="!readonlyPreview" class="flex flex-wrap items-center justify-end gap-2">
            <a-button
              type="default"
              :disabled="isCardOperationDisabled"
              @click="handleEditFromContent"
            >
              <template #icon>
                <EditOutlined />
              </template>
              {{ t('common.edit') }}
            </a-button>
            <a-tooltip
              v-if="
                isCardOperationDisabled ||
                (card.online_status === 'offline' && !canPublishKnowledgeCard(card.audit_status))
              "
              :title="
                isCardOperationDisabled
                  ? t('knowledge.card.creatingBlocked')
                  : t('knowledge.card.onlineBlockedByAudit')
              "
            >
              <a-button type="primary" disabled>
                <template #icon>
                  <CloudUploadOutlined />
                </template>
                {{
                  isCardOperationDisabled
                    ? getLocalizedOnlineStatusConfig(card.online_status).label
                    : t('knowledge.card.online')
                }}
              </a-button>
            </a-tooltip>
            <a-button
              v-else
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
              <a-button danger :disabled="isCardOperationDisabled">
                <template #icon>
                  <DeleteOutlined />
                </template>
                {{ t('common.delete') }}
              </a-button>
            </a-popconfirm>
            <template v-if="card.audit_status === 'pending'">
              <a-divider type="vertical" />
              <a-button
                type="primary"
                :loading="auditLoading"
                :disabled="isCardOperationDisabled"
                class="!bg-green-600 !border-green-600 hover:!bg-green-500"
                @click="handleAuditAction('approved')"
              >
                <template #icon>
                  <CheckOutlined />
                </template>
                {{ t('knowledge.card.auditApprove') }}
              </a-button>
              <a-button
                danger
                :loading="auditLoading"
                :disabled="isCardOperationDisabled"
                @click="handleAuditAction('rejected')"
              >
                <template #icon>
                  <CloseOutlined />
                </template>
                {{ t('knowledge.card.auditReject') }}
              </a-button>
            </template>
          </div>
        </div>

        <!-- 知识库入口：仅正文 + 溯源，无 Tab、无上下线 -->
        <CardContentBody
          v-if="readonlyPreview"
          v-bind="contentBodyBindings"
          @open="openSourceFilePreview"
        />

        <a-tabs v-else v-model:active-key="activeTab">
          <a-tab-pane key="content" :tab="t('knowledge.card.tabContent')">
            <CardContentBody v-bind="contentBodyBindings" @open="openSourceFilePreview" />
          </a-tab-pane>

          <a-tab-pane key="versions" :tab="t('knowledge.card.tabVersions')">
            <VersionTimeline
              :versions="versions"
              :current-version-key="currentVersionKey"
              :rollback-loading="rollbackLoading"
              :rollback-success-key="rollbackSuccessKey"
              :operation-disabled="isCardOperationDisabled"
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
              :current-version-key="currentVersionKey"
              :loading="diffLoading"
              :rollback-loading="rollbackLoading"
              :rollback-success-key="rollbackSuccessKey"
              :operation-disabled="isCardOperationDisabled"
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
              <div
                v-if="card.audit_status === 'rejected' && card.audit_reject_reason"
                class="flex flex-col gap-2 border-b pb-2"
              >
                <span class="text-gray-500">{{ t('knowledge.card.auditRejectReason') }}</span>
                <span class="text-red-500">{{ card.audit_reject_reason }}</span>
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
      <a-empty v-else :description="t('knowledge.card.notFound')" />
    </template>
  </a-modal>

  <KnowledgeCardStatusConfirmModal
    v-model:open="statusConfirmOpen"
    :target-status="statusConfirmTargetStatus"
    :confirm-loading="statusConfirmLoading"
    @confirm="handleStatusConfirm"
  />

  <KnowledgeCardAuditModal
    v-model:open="auditModalOpen"
    :action="auditAction"
    :confirm-loading="auditLoading"
    @confirm="handleAuditConfirm"
  />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import {
  CloudUploadOutlined,
  CloudDownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import type {
  KnowledgeCard,
  KnowledgeCardVersion,
  OnlineStatus,
  AuditStatus,
  OwnerType,
} from '@/types/knowledge'
import type { VersionDiffSegment } from '@/types/knowledge'
import {
  canOperateKnowledgeCard,
  canPublishKnowledgeCard,
  getAuditStatusConfig,
  getCardTypeConfig,
  getOnlineStatusConfig,
} from '@/types/knowledge'
import { getFileOriginalUrl } from '@/types/knowledge'
import { stashKnowledgePreviewFile } from '@/utils/knowledgePreviewStash'
import {
  buildKnowledgeCardVersionOptions,
  canCompareKnowledgeCardVersions,
  canRollbackKnowledgeCardVersion,
  resolveKnowledgeCardCurrentVersionKey,
} from '@/utils/knowledgeCardVersion'
import {
  getFileListItemById,
  getKnowledgeCardDetail,
  getKnowledgeCardVersions,
  getKnowledgeCardVersionDiff,
  toggleKnowledgeCardStatus,
  rollbackKnowledgeCard,
  deleteKnowledgeCard,
  auditKnowledgeCard,
} from '@/api/knowledge'
import { formatFileSize } from '@/utils/formatFileSize'
import CardContentBody from './CardContentBody.vue'
import VersionTimeline from './VersionTimeline.vue'
import VersionDiffView from './VersionDiffView.vue'
import KnowledgeCardStatusConfirmModal from '../KnowledgeCardStatusConfirmModal.vue'
import KnowledgeCardAuditModal from '../KnowledgeCardAuditModal.vue'
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

type ToggleOnlineStatus = Extract<OnlineStatus, 'online' | 'offline'>

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  /** 上下线成功后通知父级就地更新列表行，不请求列表接口 */
  (e: 'status-changed', payload: { id: string; online_status: OnlineStatus }): void
  (e: 'edit', card: KnowledgeCard): void
  /** 删除成功后通知父级刷新列表 */
  (e: 'deleted', cardId: string): void
  /** 审核状态变更后通知父级更新列表行 */
  (e: 'audit-changed', payload: { id: string; audit_status: AuditStatus }): void
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
const rollbackLoading = ref(false)
const rollbackSuccessKey = ref(0)
const statusConfirmOpen = ref(false)
const statusConfirmLoading = ref(false)
const statusConfirmTargetStatus = ref<ToggleOnlineStatus>('offline')
const auditModalOpen = ref(false)
const auditLoading = ref(false)
const auditAction = ref<'approved' | 'rejected'>('approved')
const currentVersionKey = computed(() =>
  card.value ? resolveKnowledgeCardCurrentVersionKey(card.value, versions.value) : null
)
const validVersionKeys = computed(() =>
  buildKnowledgeCardVersionOptions(versions.value).map((option) => option.value)
)
const isCardOperationDisabled = computed(
  () => !!card.value && !canOperateKnowledgeCard(card.value.online_status)
)
const translateKnowledgeConfig = (key: string) => t(key)
const getLocalizedCardTypeConfig = (type: string) =>
  getCardTypeConfig(type, translateKnowledgeConfig)
const getLocalizedOnlineStatusConfig = (status: string) =>
  getOnlineStatusConfig(status, translateKnowledgeConfig)
const getLocalizedAuditStatusConfig = (status: AuditStatus) =>
  getAuditStatusConfig(status, translateKnowledgeConfig)

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

const contentBodyBindings = computed(() => ({
  jsonContent: card.value!.json_content,
  mdContent: card.value!.md_content || '',
  tags: card.value!.tags,
  sourceFileRows: sourceFileRows.value,
  openingId: openingSourceFileId.value,
}))

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
  if (!canOperateKnowledgeCard(card.value.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
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
    })
  } finally {
    openingSourceFileId.value = null
  }
}

// ─── 版本对比 ───────────────────────────────────────────

async function loadDiff(from: number, to: number) {
  if (!props.cardId || !canCompareKnowledgeCardVersions(from, to, validVersionKeys.value)) {
    diffResult.value = []
    return
  }
  diffResult.value = []
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
    diffResult.value = []
  } finally {
    diffLoading.value = false
  }
}

async function handleCompareFromTimeline(fromVersion: number, toVersion: number) {
  if (!canCompareKnowledgeCardVersions(fromVersion, toVersion, validVersionKeys.value)) return
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  activeTab.value = 'diff'
  await loadDiff(fromVersion, toVersion)
}

async function handleDiffVersionChange(fromVersion: number, toVersion: number) {
  if (!canCompareKnowledgeCardVersions(fromVersion, toVersion, validVersionKeys.value)) {
    diffResult.value = []
    diffFrom.value = 0
    diffTo.value = 0
    return
  }
  diffFrom.value = fromVersion
  diffTo.value = toVersion
  await loadDiff(fromVersion, toVersion)
}

// ─── 回滚 & 上下线 ─────────────────────────────────────

const handleRollback = async (version: string, targetVersion: number, reason?: string) => {
  if (!props.cardId || rollbackLoading.value) return
  if (!card.value || !canOperateKnowledgeCard(card.value.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  if (
    !canRollbackKnowledgeCardVersion(targetVersion, currentVersionKey.value, validVersionKeys.value)
  ) {
    message.warning(t('knowledge.card.rollbackInvalidVersion'))
    return
  }
  rollbackLoading.value = true
  try {
    const updated = await rollbackKnowledgeCard(
      props.ownerType,
      props.ownerId,
      props.cardId,
      reason
    )
    card.value = updated
    versions.value = await getKnowledgeCardVersions(props.ownerType, props.ownerId, props.cardId)
    diffResult.value = []
    diffFrom.value = 0
    diffTo.value = 0
    rollbackSuccessKey.value += 1
    message.success(t('knowledge.card.rollbackSuccess', { version }))
  } catch (err) {
    console.error('Rollback failed:', err)
  } finally {
    rollbackLoading.value = false
  }
}

const handleStatusToggle = async () => {
  if (!card.value) return
  if (!canOperateKnowledgeCard(card.value.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  const newStatus = card.value.online_status === 'online' ? 'offline' : 'online'

  if (newStatus === 'online' && !canPublishKnowledgeCard(card.value.audit_status)) {
    message.warning(t('knowledge.card.onlineBlockedByAudit'))
    return
  }

  statusConfirmTargetStatus.value = newStatus
  statusConfirmOpen.value = true
}

const doStatusToggle = async (newStatus: 'online' | 'offline', note?: string) => {
  if (!card.value) return false
  try {
    await toggleKnowledgeCardStatus(props.ownerType, props.ownerId, card.value.id, newStatus, note)
    card.value.online_status = newStatus
    message.success(
      newStatus === 'online'
        ? t('knowledge.card.onlineSuccess')
        : t('knowledge.card.offlineSuccess')
    )
    emit('status-changed', { id: card.value.id, online_status: newStatus })
    return true
  } catch (err) {
    console.error('Status toggle failed:', err)
    return false
  }
}

const handleStatusConfirm = async (note?: string) => {
  statusConfirmLoading.value = true
  const ok = await doStatusToggle(
    statusConfirmTargetStatus.value,
    statusConfirmTargetStatus.value === 'offline' ? note : undefined
  )
  statusConfirmLoading.value = false
  if (ok) statusConfirmOpen.value = false
}

const handleAuditAction = (action: 'approved' | 'rejected') => {
  if (!card.value) return
  if (!canOperateKnowledgeCard(card.value.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  auditAction.value = action
  auditModalOpen.value = true
}

const handleAuditConfirm = async (reason?: string) => {
  if (!card.value) return
  auditLoading.value = true
  try {
    const updated = await auditKnowledgeCard(
      props.ownerType,
      props.ownerId,
      card.value.id,
      auditAction.value,
      reason
    )
    card.value = updated
    message.success(t('knowledge.card.auditSuccess'))
    emit('audit-changed', { id: card.value.id, audit_status: auditAction.value })
    auditModalOpen.value = false
  } catch (err) {
    console.error('Audit failed:', err)
  } finally {
    auditLoading.value = false
  }
}

const handleDelete = async () => {
  if (!card.value) return
  if (!canOperateKnowledgeCard(card.value.online_status)) {
    message.warning(t('knowledge.card.creatingBlocked'))
    return
  }
  const cardId = card.value.id
  try {
    await deleteKnowledgeCard(props.ownerType, props.ownerId, cardId)
    message.success(t('knowledge.card.deleteSuccess'))
    emit('deleted', cardId)
    emit('update:open', false)
  } catch (err) {
    console.error('Delete card failed:', err)
  }
}
</script>

<style scoped>
.knowledge-card-detail-loading {
  display: flex;
  min-height: min(520px, calc(100vh - 180px));
  align-items: center;
  justify-content: center;
}
</style>
