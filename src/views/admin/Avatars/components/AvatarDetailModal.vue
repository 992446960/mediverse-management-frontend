<template>
  <a-modal
    :open="open"
    :title="t('avatar.detailTitle')"
    width="820px"
    :footer="null"
    :destroy-on-close="true"
    @cancel="emit('update:open', false)"
  >
    <a-spin :spinning="loading">
      <template v-if="detail">
        <div class="flex items-start gap-4 mb-4">
          <div v-if="detail.avatar_url" class="shrink-0">
            <a-image
              :src="detail.avatar_url"
              :alt="detail.name"
              :width="72"
              class="rounded-lg overflow-hidden [&_.ant-image-img]:rounded-lg!"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="text-base font-medium text-(--color-text-base) dark:text-gray-100 m-0">
              {{ detail.name }}
            </div>
            <div class="mt-1 text-sm text-(--color-text-secondary)">
              {{ t('avatar.scopeDisplay', { scope: formatScope(detail) }) }}
            </div>
          </div>
        </div>

        <a-descriptions bordered :column="2" size="small" class="avatar-detail-desc">
          <a-descriptions-item :label="t('avatar.type')">
            <a-tag :color="AVATAR_TYPE_TAG_COLORS[detail.type]">
              {{ t(AVATAR_TYPE_LABEL_KEYS[detail.type]) }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="t('org.status')">
            <a-tag :color="detail.status === 'active' ? 'success' : 'error'">
              {{ detail.status === 'active' ? t('status.active') : t('status.inactive') }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item :label="t('avatar.bio')" :span="2">
            {{ detail.bio?.trim() || t('avatar.noBio') }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('avatar.greeting')" :span="2">
            {{ detail.greeting?.trim() || '—' }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('avatar.style')" :span="2">
            <span>{{ styleLabel(detail) }}</span>
          </a-descriptions-item>
          <a-descriptions-item :label="t('avatar.tags')" :span="2">
            <template v-if="detail.tags?.length">
              <a-tag v-for="tag in detail.tags" :key="tag" class="mb-1">{{ tag }}</a-tag>
            </template>
            <span v-else>—</span>
          </a-descriptions-item>
          <a-descriptions-item :label="t('common.createdAt')">
            {{ dayjs(detail.created_at).format('YYYY-MM-DD HH:mm') }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('common.updatedAt')">
            {{ dayjs(detail.updated_at).format('YYYY-MM-DD HH:mm') }}
          </a-descriptions-item>
          <a-descriptions-item :label="t('common.createdBy')" :span="2">
            {{ detail.created_by }}
          </a-descriptions-item>
        </a-descriptions>

        <div class="mt-6">
          <div class="text-sm font-medium text-(--color-text-base) dark:text-gray-100 mb-2">
            {{ t('avatar.knowledgeGrants') }}
          </div>
          <a-table
            v-if="grantRows.length"
            size="small"
            :pagination="false"
            row-key="id"
            :columns="grantColumns"
            :data-source="grantRows"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'granted_at'">
                {{ dayjs(record.granted_at).format('YYYY-MM-DD HH:mm') }}
              </template>
            </template>
          </a-table>
          <a-empty v-else :description="t('common.noData')" />
        </div>
      </template>
    </a-spin>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { getAvatarDetail } from '@/api/avatars'
import {
  AVATAR_TYPE_LABEL_KEYS,
  AVATAR_TYPE_TAG_COLORS,
  type AvatarDetail,
  type AvatarStyle,
} from '@/types/avatar'

const props = defineProps<{
  open: boolean
  avatarId?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const loading = ref(false)
const detail = ref<AvatarDetail | null>(null)

const STYLE_I18N: Record<AvatarStyle, string> = {
  formal: 'avatar.wizard.styleFormal',
  friendly: 'avatar.wizard.styleFriendly',
  concise: 'avatar.wizard.styleConcise',
  detailed: 'avatar.wizard.styleDetailed',
  custom: 'avatar.wizard.styleCustom',
}

const grantRows = computed(() => detail.value?.knowledge_grants ?? [])

const grantColumns = computed(() => [
  { title: t('avatar.grantScope'), key: 'scope_name', dataIndex: 'scope_name' },
  { title: t('avatar.scopeType'), key: 'scope_type', dataIndex: 'scope_type', width: 100 },
  { title: t('avatar.grantedBy'), key: 'granted_by_name', dataIndex: 'granted_by_name' },
  { title: t('avatar.grantedAt'), key: 'granted_at', dataIndex: 'granted_at', width: 160 },
])

function formatScope(record: AvatarDetail): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

function styleLabel(d: AvatarDetail): string {
  if (d.style === 'custom' && d.style_custom?.trim()) {
    return `${t(STYLE_I18N.custom)}：${d.style_custom.trim()}`
  }
  return t(STYLE_I18N[d.style] ?? STYLE_I18N.formal)
}

async function loadDetail(id: string) {
  loading.value = true
  detail.value = null
  try {
    detail.value = await getAvatarDetail(id)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (!val) return
    if (props.avatarId) loadDetail(props.avatarId)
  }
)
</script>

<style scoped>
.avatar-detail-desc :deep(.ant-descriptions-item-label) {
  width: 120px;
}
</style>
