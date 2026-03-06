<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 1000 }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'type'">
        <a-tag :color="getTypeTagColor(record.type)">
          {{ t(getTypeLabelKey(record.type)) }}
        </a-tag>
      </template>
      <template v-else-if="column.key === 'scope'">
        {{ formatScope(record) }}
      </template>
      <template v-else-if="column.key === 'status'">
        <a-badge :status="getStatusBadgeStatus(record.status)" :text="t(getStatusLabelKey(record.status))" />
      </template>
      <template v-else-if="column.key === 'created_at'">
        {{ formatDate(record.created_at) }}
      </template>
      <template v-else-if="column.key === 'actions'">
        <a-space>
          <a-button type="link" size="small" @click="emit('edit', record)">
            {{ t('common.edit') }}
          </a-button>
          <a-button type="link" size="small" @click="emit('toggleStatus', record)">
            {{ record.status === 'active' ? t('status.inactive') : t('status.active') }}
          </a-button>
          <a-button type="link" size="small" danger @click="emit('delete', record)">
            {{ t('common.delete') }}
          </a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { getStatusColor, getStatusLabelKey } from '@/utils/status'
import type { Avatar, AvatarType } from '@/types/avatar'
import { AVATAR_TYPE_LABEL_KEYS, AVATAR_TYPE_TAG_COLORS } from '@/types/avatar'

const { t } = useI18n()

interface Props {
  dataSource: Avatar[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [record: Avatar]
  toggleStatus: [record: Avatar]
  delete: [record: Avatar]
}>()

function getTypeTagColor(type: AvatarType): string {
  return AVATAR_TYPE_TAG_COLORS[type] ?? 'default'
}

function getTypeLabelKey(type: AvatarType): string {
  return AVATAR_TYPE_LABEL_KEYS[type] ?? 'avatar.type'
}

function formatScope(record: Avatar): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

function getStatusBadgeStatus(status: 'active' | 'inactive'): 'success' | 'default' {
  const color = getStatusColor(status)
  return color === 'green' ? 'success' : 'default'
}

function formatDate(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

const columns = computed(() => [
  { title: t('avatar.name'), dataIndex: 'name', key: 'name', ellipsis: true, width: 140 },
  { title: t('avatar.type'), dataIndex: 'type', key: 'type', width: 90 },
  { title: t('avatar.scope'), key: 'scope', ellipsis: true, width: 220 },
  { title: t('org.status'), dataIndex: 'status', key: 'status', width: 100 },
  { title: t('common.createdAt'), dataIndex: 'created_at', key: 'created_at', width: 160 },
  { title: t('common.actions'), key: 'actions', fixed: 'right', width: 220 },
])
</script>
