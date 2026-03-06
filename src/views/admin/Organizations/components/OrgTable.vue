<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 900 }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'status'">
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
import type { Organization } from '@/types/organization'

const { t } = useI18n()

interface Props {
  dataSource: Organization[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [record: Organization]
  toggleStatus: [record: Organization]
  delete: [record: Organization]
}>()

const columns = computed(() => [
  { title: t('org.name'), dataIndex: 'name', key: 'name', ellipsis: true },
  { title: t('org.code'), dataIndex: 'code', key: 'code', width: 120 },
  { title: t('org.description'), dataIndex: 'description', key: 'description', ellipsis: true },
  { title: t('org.status'), dataIndex: 'status', key: 'status', width: 100 },
  { title: t('common.createdAt'), dataIndex: 'created_at', key: 'created_at', width: 160 },
  { title: t('common.actions'), key: 'actions', fixed: 'right', width: 220 },
])

function getStatusBadgeStatus(status: 'active' | 'inactive'): 'success' | 'default' {
  const color = getStatusColor(status)
  return color === 'green' ? 'success' : 'default'
}

function formatDate(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}
</script>
