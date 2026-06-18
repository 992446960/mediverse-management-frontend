<template>
  <PageTable
    ref="pageTableRef"
    :table-conf="tableConf"
    :table-columns="tableColumns"
    :table-data="tableData"
    @fetch-table-data="$emit('fetch-table-data')"
  >
    <template #tokenCell="{ row }">
      <div class="token-cell">
        <a-tooltip :title="visibleIds.has(row.id) ? row.token_hash : maskToken(row.token_hash)">
          <span class="token-cell__text">
            {{ visibleIds.has(row.id) ? row.token_hash : maskToken(row.token_hash) }}
          </span>
        </a-tooltip>
        <div class="token-cell__actions">
          <a-button
            type="text"
            size="small"
            class="token-cell__button"
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
            class="token-cell__button"
            :title="t('apiToken.copy')"
            @click="copyToken(row)"
          >
            <template #icon>
              <CopyOutlined />
            </template>
          </a-button>
        </div>
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
  EditOutlined,
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
  edit: [row: ApiToken]
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
    prop: 'token_hash',
    _id: 'token_hash',
    type: 'slot',
    slotName: 'tokenCell',
    width: 260,
    resizable: true,
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
    width: 260,
    fixed: 'right',
    btns: [
      {
        text: t('common.edit'),
        icon: EditOutlined,
        handle: (row) => emit('edit', row as ApiToken),
      },
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

<style scoped lang="scss">
.token-cell {
  display: flex;
  width: 100%;
  min-width: 0;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.token-cell__text {
  display: block;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 13px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.token-cell__actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.token-cell__button {
  display: inline-flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  padding: 0;
}
</style>
