<template>
  <PageTable
    ref="pageTableRef"
    :table-conf="tableConf"
    :table-columns="tableColumns"
    :table-data="tableData"
    @fetch-table-data="$emit('fetch-table-data')"
  >
    <template #tokenCell="{ row }">
      <div class="flex items-center gap-2 min-w-0">
        <a-tooltip :title="visibleIds.has(row.id) ? row.token_hash : maskToken(row.token_hash)">
          <span class="font-mono text-sm truncate block min-w-0 max-w-[140px]">
            {{ visibleIds.has(row.id) ? row.token_hash : maskToken(row.token_hash) }}
          </span>
        </a-tooltip>
        <a-button
          type="text"
          size="small"
          class="shrink-0"
          :title="visibleIds.has(row.id) ? t('apiToken.hideToken') : t('apiToken.showToken')"
          @click="toggleVisibility(row.id)"
        >
          <template #icon>
            <EyeOutlined v-if="!visibleIds.has(row.id)" />
            <EyeInvisibleOutlined v-else />
          </template>
        </a-button>
        <a-button
          type="text"
          size="small"
          class="shrink-0"
          :title="t('apiToken.copy')"
          @click="copyToken(row)"
        >
          <template #icon>
            <CopyOutlined />
          </template>
        </a-button>
      </div>
    </template>
  </PageTable>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import {
  EyeOutlined,
  EyeInvisibleOutlined,
  CopyOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import PageTable from '@/components/PageTable/index.vue'
import { maskToken } from '../utils/tokenMask'
import type { ApiToken } from '@/types/apiTokens'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'

const { t } = useI18n()

defineProps<{
  tableConf: PageTableConfig
  tableData: ApiToken[]
}>()

const emit = defineEmits<{
  'fetch-table-data': []
  'toggle-status': [row: ApiToken]
  delete: [row: ApiToken]
}>()

const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)
/** 当前显示明文 token_hash 的行 id 集合 */
const visibleIds = ref<Set<string>>(new Set())

function toggleVisibility(id: string) {
  const next = new Set(visibleIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  visibleIds.value = next
}

function getDisplayToken(row: ApiToken): string {
  return visibleIds.value.has(row.id) ? row.token_hash : maskToken(row.token_hash)
}

async function copyToken(row: ApiToken) {
  const text = getDisplayToken(row)
  try {
    await navigator.clipboard.writeText(text)
    message.success(t('apiToken.copySuccess'))
  } catch {
    message.error(t('apiToken.copyFailed'))
  }
}

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  { label: t('apiToken.name'), prop: 'name', width: 160, showOverflowTooltip: true },
  {
    label: t('apiToken.token'),
    type: 'slot',
    slotName: 'tokenCell',
    width: 260,
  },
  { label: t('apiToken.org'), prop: 'org_name', width: 140, showOverflowTooltip: true },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    width: 160,
    formatter: (row) => dayjs((row as ApiToken).created_at).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: t('apiToken.lastUsedAt'),
    prop: 'last_used_at',
    width: 160,
    formatter: (row) => {
      const at = (row as ApiToken).last_used_at
      return at ? dayjs(at).format('YYYY-MM-DD HH:mm') : '—'
    },
  },
  {
    label: t('apiToken.status'),
    prop: 'status',
    type: 'scope',
    scopeType: '_tag',
    width: 100,
    tagType: (row) => ((row as ApiToken).status === 'active' ? 'success' : 'error'),
    tagText: (row) =>
      (row as ApiToken).status === 'active' ? t('status.active') : t('status.inactive'),
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 200,
    fixed: 'right',
    btns: [
      {
        text: t('status.inactive'),
        dynamicText: (row) =>
          (row as ApiToken).status === 'active' ? t('status.inactive') : t('status.active'),
        dynamicIcon: (row) =>
          (row as ApiToken).status === 'active' ? PauseCircleOutlined : PlayCircleOutlined,
        dynamicColor: (row) => ((row as ApiToken).status === 'active' ? 'warning' : 'success'),
        handle: (row) => emit('toggle-status', row as ApiToken),
      },
      {
        text: t('common.delete'),
        icon: DeleteOutlined,
        color: 'danger',
        handle: (row) => emit('delete', row as ApiToken),
      },
    ],
  },
])

defineExpose({
  get currentPage() {
    return pageTableRef.value?.currentPage ?? 1
  },
  get pageSize() {
    return pageTableRef.value?.pageSize ?? 20
  },
  resetCurPage(page?: number) {
    pageTableRef.value?.resetCurPage(page)
  },
})
</script>
