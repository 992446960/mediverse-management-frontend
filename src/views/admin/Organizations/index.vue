<template>
  <div class="organizations-page flex flex-1 flex-col overflow-hidden">
    <div class="mb-4">
      <TableFilter
        v-model="filterState"
        :title="t('org.title')"
        :primary-action="{
          text: t('org.addOrg'),
          permission: ['sysadmin'],
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
      :title="t('org.title')"
      :subtitle="`(共 ${pagination.total} 条记录)`"
      :columns="columns as ColumnsType<Record<string, unknown>>"
      :data-source="data as unknown as Record<string, unknown>[]"
      :loading="loading"
      scroll-height="60vh"
      row-key="id"
      :scroll="{ x: 900 }"
      :pagination="paginationConfig"
      :toolbar="toolbarConfig"
      :empty-text="t('common.noData')"
      @change="onTableChange"
    />
    <OrgForm v-model:open="formOpen" :initial-record="editingRecord" @submit="handleFormSubmit" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { TableFilter } from '@/components/TableFilter'
import ProTable from '@/components/Table/ProTable.vue'
import OrgForm from './components/OrgForm.vue'
import { useTableData } from '@/composables/useTableData'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrgStatus,
} from '@/api/organizations'
import { confirmDelete } from '@/utils/confirm'
import type { TableFilterFieldConfig } from '@/components/TableFilter/types'
import type {
  ProTablePagination,
  ProTableToolItem,
  ProTableColumnExt,
  ProTableActionBtn,
} from '@/components/Table/types'
import type { Organization, OrganizationForm } from '@/types/organization'
import type { ColumnsType } from 'ant-design-vue/es/table'

const { t } = useI18n()

const filterState = ref<Record<string, string | number | undefined>>({
  name: '',
  status: '',
})

const filterFields = computed<TableFilterFieldConfig[]>(() => [
  {
    key: 'name',
    label: t('org.name') + ':',
    type: 'input',
    placeholder: t('org.namePlaceholder'),
    inputClass: 'w-64',
  },
  {
    key: 'status',
    label: t('org.status') + ':',
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('common.all'), value: '' },
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
  },
])

function getListParams(): { name?: string; status?: 'active' | 'inactive' } {
  const s = filterState.value.status as string
  const status = s === 'active' || s === 'inactive' ? s : undefined
  return {
    name: (filterState.value.name as string) || undefined,
    status,
  }
}

const { data, loading, pagination, handleTableChange, handleSearch, refresh } = useTableData({
  fetchFn: getOrganizations,
  defaultParams: { name: undefined, status: undefined },
  immediate: true,
})

function onFilterSearch() {
  handleSearch(getListParams())
}

function onFilterReset() {
  filterState.value = { name: '', status: '' }
  handleSearch(getListParams())
}

function onTableChange(p: { current: number; pageSize: number; total: number }) {
  handleTableChange({ current: p.current, pageSize: p.pageSize })
}

const paginationConfig = computed<ProTablePagination>(() => ({
  current: pagination.current,
  pageSize: pagination.pageSize,
  total: pagination.total,
  showSizeChanger: true,
  showQuickJumper: false,
  onChange: (page: number, pageSize: number) => {
    handleTableChange({ current: page, pageSize })
  },
}))

const toolbarConfig = computed<ProTableToolItem[]>(() => [
  { key: 'refresh', icon: 'reload', title: t('common.refresh'), handle: refresh },
])

const columns = computed<
  (ProTableColumnExt<Organization> & {
    title: string
    dataIndex?: string
    key: string
    ellipsis?: boolean
    width?: number
    fixed?: 'right'
  })[]
>(() => [
  { title: t('org.name'), dataIndex: 'name', key: 'name', ellipsis: true },
  { title: t('org.code'), dataIndex: 'code', key: 'code', width: 120 },
  { title: t('org.description'), dataIndex: 'description', key: 'description', ellipsis: true },
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
    width: 220,
    cellType: 'actions',
    btns: actionBtns.value,
  },
])

const actionBtns = computed<ProTableActionBtn<Organization>[]>(() => [
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
const editingRecord = ref<Organization | null>(null)

function openCreateForm() {
  editingRecord.value = null
  formOpen.value = true
}

function openEditForm(record: Organization) {
  editingRecord.value = record
  formOpen.value = true
}

async function handleFormSubmit(values: OrganizationForm) {
  try {
    if (editingRecord.value?.id) {
      await updateOrganization(editingRecord.value.id, values)
      message.success(t('common.success'))
    } else {
      await createOrganization(values)
      message.success(t('common.success'))
    }
    refresh()
  } catch {
    // error already shown by api interceptor
  }
}

function handleToggleStatus(record: Organization) {
  const nextStatus = record.status === 'active' ? 'inactive' : 'active'
  confirmDelete({
    title: t('common.confirmStatusTitle'),
    content: t('common.confirmStatusContent'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await updateOrgStatus(record.id, { status: nextStatus })
      message.success(t('common.success'))
      refresh()
    },
  })
}

function handleDelete(record: Organization) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteOrganization(record.id)
      message.success(t('common.success'))
      refresh()
    },
  })
}
</script>
