<template>
  <div class="avatars-page flex flex-1 flex-col overflow-hidden">
    <section class="flex-1 flex flex-col min-h-0 min-w-0">
      <div class="mb-4">
        <TableFilter
          v-model="filterState"
          :title="t('menu.avatarManagement')"
          :primary-action="{
            text: t('avatar.addAvatar'),
            permission: ['sysadmin', 'org_admin', 'dept_admin'],
          }"
          :fields="filterFields"
          :search-text="t('common.search')"
          :reset-text="t('common.reset')"
          @search="onFilterSearch"
          @reset="onFilterReset"
          @primary-action="openWizard"
        >
          <template #primaryActionIcon>
            <PlusOutlined />
          </template>
        </TableFilter>
      </div>
      <ProTable
        :title="t('menu.avatarManagement')"
        :subtitle="`(共 ${pagination.total} 条记录)`"
        :columns="columns as ColumnsType<Record<string, unknown>>"
        :data-source="data as unknown as Record<string, unknown>[]"
        :loading="loading"
        row-key="id"
        :scroll="{ x: 1000 }"
        :pagination="paginationConfig"
        :toolbar="toolbarConfig"
        :empty-text="t('common.noData')"
        @change="onTableChange"
        @refresh="refresh"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'scope'">
            {{ formatScope(record as Avatar) }}
          </template>
          <template v-else>
            {{ getCellValue(record as Record<string, unknown>, column as { dataIndex?: string | string[] }) }}
          </template>
        </template>
      </ProTable>
      <AvatarWizard
        v-model:open="wizardOpen"
        @success="handleWizardSuccess"
      />
      <AvatarEditModal
        v-model:open="editOpen"
        :avatar-id="editingId ?? undefined"
        @success="handleEditSuccess"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { TableFilter } from '@/components/TableFilter'
import { ProTable } from '@/components/Table'
import AvatarWizard from './components/AvatarWizard.vue'
import AvatarEditModal from './components/AvatarEditModal.vue'
import { useTableData } from '@/composables/useTableData'
import { getAvatars, updateAvatarStatus, deleteAvatar } from '@/api/avatars'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import { confirmDelete } from '@/utils/confirm'
import {
  AVATAR_TYPE_VALUES,
  AVATAR_TYPE_LABEL_KEYS,
  AVATAR_TYPE_TAG_COLORS,
  type Avatar,
  type AvatarType,
} from '@/types/avatar'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'
import type { TableFilterFieldConfig } from '@/components/TableFilter/types'
import type {
  ProTablePagination,
  ProTableToolItem,
  ProTableColumnExt,
  ProTableActionBtn,
} from '@/components/Table/types'
import type { ColumnsType } from 'ant-design-vue/es/table'

const { t } = useI18n()

function getCellValue(
  record: Record<string, unknown>,
  column: { dataIndex?: string | string[] },
): string {
  const d = column.dataIndex
  if (d == null) return ''
  const key = Array.isArray(d) ? d.join('.') : d
  const v = record[key]
  return v != null ? String(v) : ''
}

function formatScope(record: Avatar): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

type AvatarStatus = 'active' | 'inactive'

interface AvatarFilterState {
  keyword?: string
  type?: '' | AvatarType
  org_id?: string
  dept_id?: string
  status?: '' | AvatarStatus
}

const filterState = ref<AvatarFilterState>({
  keyword: '',
  type: '',
  org_id: '',
  dept_id: '',
  status: '',
})

const orgList = ref<Organization[]>([])
const deptList = ref<Department[]>([])

watch(
  () => filterState.value.org_id,
  async (orgId) => {
    filterState.value.dept_id = ''
    deptList.value = []
    if (!orgId) return
    const res = await getDepartments({ org_id: orgId, page: 1, page_size: 500 })
    deptList.value = res.items
  },
)

const filterFields = computed<TableFilterFieldConfig[]>(() => [
  {
    key: 'keyword',
    label: t('avatar.name') + ':',
    type: 'input',
    placeholder: t('avatar.name'),
    inputClass: 'w-64',
  },
  {
    key: 'type',
    label: t('avatar.type') + ':',
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('dept.allStatus').replace(t('dept.status'), '').trim() || '全部', value: '' },
      ...AVATAR_TYPE_VALUES.map((v) => ({ label: t(AVATAR_TYPE_LABEL_KEYS[v]), value: v })),
    ],
  },
  {
    key: 'org_id',
    label: t('avatar.org') + ':',
    type: 'select',
    inputClass: 'min-w-[160px]',
    options: [
      { label: t('dept.allStatus').replace(t('dept.status'), '').trim() || '全部', value: '' },
      ...orgList.value.map(o => ({ label: o.name, value: o.id })),
    ],
  },
  {
    key: 'dept_id',
    label: t('avatar.dept') + ':',
    type: 'select',
    inputClass: 'min-w-[160px]',
    options: [
      { label: t('dept.allStatus').replace(t('dept.status'), '').trim() || '全部', value: '' },
      ...deptList.value.map(d => ({ label: d.name, value: d.id })),
    ],
  },
  {
    key: 'status',
    label: t('org.status') + ':',
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('dept.allStatus').replace(t('dept.status'), '').trim() || '全部', value: '' },
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
  },
])

function getListParams(): {
  keyword?: string
  type?: AvatarType
  org_id?: string
  dept_id?: string
  status?: AvatarStatus
} {
  const typeVal = filterState.value.type
  const type = typeVal === 'general' || typeVal === 'specialist' || typeVal === 'expert'
    ? typeVal
    : undefined

  const statusVal = filterState.value.status
  const status = statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  return {
    keyword: filterState.value.keyword?.trim() || undefined,
    type,
    org_id: filterState.value.org_id || undefined,
    dept_id: filterState.value.dept_id || undefined,
    status,
  }
}

const {
  data,
  loading,
  pagination,
  handleTableChange,
  handleSearch,
  refresh,
} = useTableData({
  fetchFn: getAvatars,
  defaultParams: { keyword: undefined, type: undefined, org_id: undefined },
  immediate: true,
})

function onFilterSearch() {
  handleSearch(getListParams())
}

function onFilterReset() {
  filterState.value = { keyword: '', type: '', org_id: '', dept_id: '', status: '' }
  handleSearch(getListParams())
}

function onTableChange(p: { current: number; pageSize: number; total: number }) {
  handleTableChange({ current: p.current, pageSize: p.pageSize })
}

const paginationConfig = computed<ProTablePagination>(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  onChange: (page: number, pageSize: number) => {
    handleTableChange({ current: page, pageSize })
  },
}))

const toolbarConfig = computed<ProTableToolItem[]>(() => [
  { key: 'refresh', icon: 'reload', title: t('common.refresh'), handle: refresh },
])

const columns = computed<
  (ProTableColumnExt<Avatar> & {
    title: string
    dataIndex?: string
    key: string
  })[]
>(() => [
  {
    title: t('avatar.name'),
    dataIndex: 'name',
    key: 'name',
    ellipsis: true,
    width: 140,
  },
  {
    title: t('avatar.type'),
    dataIndex: 'type',
    key: 'type',
    width: 90,
    cellType: 'tag',
    tagType: (record) => AVATAR_TYPE_TAG_COLORS[record.type] ?? 'default',
    tagText: (record) => t(AVATAR_TYPE_LABEL_KEYS[record.type]),
  },
  { title: t('avatar.scope'), key: 'scope', ellipsis: true, width: 220 },
  {
    title: t('org.status'),
    dataIndex: 'status',
    key: 'status',
    width: 100,
    cellType: 'status',
    statusLabels: { active: t('status.active'), inactive: t('status.inactive') },
    activeValue: 'active',
  },
  {
    title: t('common.createdAt'),
    dataIndex: 'created_at',
    key: 'created_at',
    width: 160,
    cellType: 'date',
    dateFormat: 'YYYY-MM-DD HH:mm',
  },
  {
    title: t('common.actions'),
    key: 'actions',
    fixed: 'right',
    width: 300,
    cellType: 'actions',
    btns: actionBtns.value,
  },
])

const actionBtns = computed<ProTableActionBtn<Avatar>[]>(() => [
  { text: t('common.edit'), handle: openEditForm },
  {
    text: t('status.inactive'),
    dynamicText: (record) =>
      record.status === 'active' ? t('status.inactive') : t('status.active'),
    handle: handleToggleStatus,
  },
  {
    text: t('common.delete'),
    handle: handleDelete,
    danger: true,
  },
])

const wizardOpen = ref(false)
const editOpen = ref(false)
const editingId = ref<string | null>(null)

function openWizard() {
  wizardOpen.value = true
}

function openEditForm(record: Avatar) {
  editingId.value = record.id
  editOpen.value = true
}

function handleWizardSuccess() {
  wizardOpen.value = false
  refresh()
}

function handleEditSuccess() {
  editOpen.value = false
  editingId.value = null
  refresh()
}

function handleToggleStatus(record: Avatar) {
  const nextStatus = record.status === 'active' ? 'inactive' : 'active'
  confirmDelete({
    title: t('common.confirmStatusTitle'),
    content: t('avatar.confirmStatusContent'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await updateAvatarStatus(record.id, { status: nextStatus })
      message.success(t('common.success'))
      refresh()
    },
  })
}

function handleDelete(record: Avatar) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteAvatar(record.id)
      message.success(t('common.success'))
      refresh()
    },
  })
}

onMounted(() => {
  getOrganizations({ page: 1, page_size: 500 }).then((res) => {
    orgList.value = res.items
  })
})
</script>
