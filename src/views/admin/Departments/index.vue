<template>
  <div class="departments-page flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-colshrink-0 bg-slate-100 dark:bg-slate-950">
      <TableTree
        :title="t('dept.allOrgs')"
        :search-placeholder="t('dept.searchOrg')"
        :tree-data="treeData"
        :selected-key="selectedOrgKey"
        :loading="treeLoading"
        :empty-text="t('common.noData')"
        :fetch-data="loadTree"
        :refresh-title="t('common.refresh')"
        @node-click="onTreeSelect"
      />
    </aside>
    <section class="flex-1 flex flex-col min-h-0 min-w-0 pl-0">
      <template v-if="selectedOrgId">
        <div class="mb-4">
          <TableFilter
            v-model="filterState"
            :title="t('dept.title')"
            :primary-action="{
              text: t('dept.addDept'),
              permission: ['sysadmin', 'org_admin'],
            }"
            :fields="filterFields"
            :search-text="t('common.search')"
            :reset-text="t('common.reset')"
            @search="onFilterSearch"
            @reset="onFilterReset"
            @primary-action="openCreateForm"
          >
            <template #primaryActionIcon>
              <PlusOutlined />
            </template>
          </TableFilter>
        </div>
        <ProTable
          :title="`${selectedOrgName} - ${t('dept.deptList')}`"
          :subtitle="`(共 ${pagination.total} 条记录)`"
          :columns="columns as ColumnsType<Record<string, unknown>>"
          :data-source="data as unknown as Record<string, unknown>[]"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 900 }"
          :pagination="paginationConfig"
          :toolbar="toolbarConfig"
          :empty-text="t('common.noData')"
          @change="onTableChange"
          @refresh="refresh"
        />
      </template>
      <div
        v-else
        class="departments-empty flex flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[280px]"
      >
        <a-empty :description="t('dept.selectOrgFirst')" />
      </div>
      <DeptForm
        v-model:open="formOpen"
        :initial-record="editingRecord"
        :default-org-id="selectedOrgId ?? ''"
        :default-org-name="selectedOrgName"
        @submit="handleFormSubmit"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { TableTree } from '@/components/TableTree'
import { TableFilter } from '@/components/TableFilter'
import { ProTable } from '@/components/Table'
import DeptForm from './components/DeptForm.vue'
import { useTableData } from '@/composables/useTableData'
import { useAuthStore } from '@/stores/auth'
import { getOrganizations } from '@/api/organizations'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  updateDeptStatus,
} from '@/api/departments'
import { confirmDelete } from '@/utils/confirm'
import type { Organization } from '@/types/organization'
import type { Department, DepartmentForm } from '@/types/department'
import type { TableTreeNode } from '@/components/TableTree/types'
import type { TableFilterFieldConfig } from '@/components/TableFilter/types'
import type {
  ProTablePagination,
  ProTableToolItem,
  ProTableColumnExt,
  ProTableActionBtn,
} from '@/components/Table/types'
import type { ColumnsType } from 'ant-design-vue/es/table'

const { t } = useI18n()
const authStore = useAuthStore()

const treeLoading = ref(false)
const organizationsList = ref<Organization[]>([])
const selectedOrgId = ref<string | null>(null)
const selectedOrgName = ref<string>('')
const selectedOrgKey = ref<string>('')

/** 将 GET /organizations 的 items 转为 TableTree 所需的一级结构（无 children） */
const treeData = computed<TableTreeNode[]>(() => {
  let list = organizationsList.value
  if (authStore.isOrgAdmin && authStore.currentOrgId) {
    list = list.filter((o) => o.id === authStore.currentOrgId)
  }
  return list.map((org) => ({
    key: `org_${org.id}`,
    label: org.code ? `${org.name} (${org.code})` : org.name,
    icon: 'bank',
    children: undefined,
  }))
})

async function loadTree() {
  treeLoading.value = true
  try {
    const res = await getOrganizations({ page: 1, page_size: 500 })
    organizationsList.value = res?.items ?? []
  } finally {
    treeLoading.value = false
  }
}

const filterState = ref<Record<string, string | number | undefined>>({
  name: '',
  status: '',
})

const filterFields = computed<TableFilterFieldConfig[]>(() => [
  {
    key: 'name',
    label: t('dept.name') + ':',
    type: 'input',
    placeholder: t('dept.namePlaceholder'),
    inputClass: 'w-64',
  },
  {
    key: 'status',
    label: t('dept.status') + ':',
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('dept.allStatus'), value: '' },
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
  },
])

function getListParams(): { org_id?: string; name?: string; status?: 'active' | 'inactive' } {
  const s = filterState.value.status as string
  const status = s === 'active' || s === 'inactive' ? s : undefined
  return {
    org_id: selectedOrgId.value ?? undefined,
    name: (filterState.value.name as string) || undefined,
    status,
  }
}

const { data, loading, pagination, handleTableChange, handleSearch, refresh } = useTableData({
  fetchFn: getDepartments,
  defaultParams: { org_id: undefined, name: undefined, status: undefined },
  immediate: false,
})

function onFilterSearch() {
  handleSearch(getListParams())
}

function onFilterReset() {
  filterState.value = { name: '', status: '' }
  handleSearch(getListParams())
}

watch(selectedOrgId, (id) => {
  if (id) {
    handleSearch(getListParams())
  } else {
    data.value = []
    pagination.current = 1
    pagination.total = 0
  }
})

function onTreeSelect(payload: { key: string; label: string; level: 'root' | 'branch' }) {
  if (!payload.key.startsWith('org_')) return
  selectedOrgId.value = payload.key.replace(/^org_/, '')
  selectedOrgName.value = payload.label.replace(/\s*\([^)]*\)\s*$/, '').trim() || payload.label
  selectedOrgKey.value = payload.key
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
  (ProTableColumnExt<Department> & {
    title: string
    dataIndex?: string
    key: string
    ellipsis?: boolean
    width?: number
    fixed?: 'right'
  })[]
>(() => [
  { title: t('dept.name'), dataIndex: 'name', key: 'name', ellipsis: true },
  { title: t('dept.code'), dataIndex: 'code', key: 'code', width: 140 },
  { title: t('dept.branch'), dataIndex: 'org_name', key: 'org_name', ellipsis: true, width: 180 },
  {
    title: t('dept.status'),
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

const actionBtns = computed<ProTableActionBtn<Department>[]>(() => [
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

const formOpen = ref(false)
const editingRecord = ref<Department | null>(null)

function openCreateForm() {
  editingRecord.value = null
  formOpen.value = true
}

function openEditForm(record: Department) {
  editingRecord.value = record
  formOpen.value = true
}

async function handleFormSubmit(values: DepartmentForm) {
  try {
    if (editingRecord.value?.id) {
      await updateDepartment(editingRecord.value.id, values)
      message.success(t('common.success'))
    } else {
      await createDepartment(values)
      message.success(t('common.success'))
    }
    refresh()
  } catch {
    // error already shown by api interceptor
  }
}

function handleToggleStatus(record: Department) {
  const nextStatus = record.status === 'active' ? 'inactive' : 'active'
  confirmDelete({
    title: t('common.confirmStatusTitle'),
    content: t('dept.confirmStatusContent'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await updateDeptStatus(record.id, { status: nextStatus })
      message.success(t('common.success'))
      refresh()
    },
  })
}

function handleDelete(record: Department) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteDepartment(record.id)
      message.success(t('common.success'))
      refresh()
    },
  })
}

onMounted(loadTree)
</script>
