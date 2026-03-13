<template>
  <div class="organizations-page flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
      <PageFilter ref="pageFilterRef" :filter-conf="filterConf" @fetch-table-data="onFilterFetch" />
    </div>
    <div class="app-container p-0 flex-1 flex flex-col min-h-0">
      <PageTable
        ref="pageTableRef"
        :table-conf="tableConf"
        :table-columns="tableColumns"
        :table-data="tableData"
        @fetch-table-data="onTableFetch"
      />
    </div>
    <OrgForm v-model:open="formOpen" :initial-record="editingRecord" @submit="handleFormSubmit" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
} from '@ant-design/icons-vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import OrgForm from './components/OrgForm.vue'
import {
  getOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  updateOrgStatus,
} from '@/api/organizations'
import { confirmDelete } from '@/utils/confirm'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import type { Organization, OrganizationForm } from '@/types/organization'

const { t } = useI18n()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const tableData = ref<Organization[]>([])
const loading = ref(false)
const total = ref(0)

const headConf = computed<PageHeadConfig>(() => ({
  title: t('org.title'),
  btns: [
    {
      text: t('org.addOrg'),
      type: 'primary',
      icon: PlusOutlined,
      handle: openCreateForm,
      permission: ['sysadmin'],
    },
  ],
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'name',
      label: t('org.name'),
      type: 'input',
      ph: t('org.namePlaceholder'),
      col: 6,
      defaultValue: '',
    },
    {
      key: 'status',
      label: t('org.status'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: [
        { label: t('common.all'), value: '' },
        { label: t('status.active'), value: 'active' },
        { label: t('status.inactive'), value: 'inactive' },
      ],
      clearable: true,
      defaultValue: '',
    },
  ],
  btns: [
    {
      text: t('common.search'),
      type: 'primary',
      icon: SearchOutlined,
      handle: () => {
        pageTableRef.value?.resetCurPage(1)
        loadData()
      },
    },
    {
      text: t('common.reset'),
      icon: ReloadOutlined,
      handle: () => {
        pageFilterRef.value?.filterFormReset()
        pageTableRef.value?.resetCurPage(1)
        loadData()
      },
    },
  ],
  btnsCol: 6,
}))

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
  emptyText: t('common.noData'),
}))

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  { label: t('org.name'), prop: 'name', width: 160, showOverflowTooltip: true },
  { label: t('org.code'), prop: 'code', width: 120 },
  { label: t('org.description'), prop: 'description', width: 200, showOverflowTooltip: true },
  {
    label: t('org.status'),
    prop: 'status',
    type: 'scope',
    scopeType: '_tag',
    width: 100,
    tagType: (row) => (row.status === 'active' ? 'success' : 'error'),
    tagText: (row) => (row.status === 'active' ? t('status.active') : t('status.inactive')),
  },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    width: 160,
    formatter: (row) => dayjs(row.created_at as string).format('YYYY-MM-DD HH:mm'),
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
        handle: openEditForm as unknown as (row: Record<string, unknown>, index?: number) => void,
      },
      {
        text: t('status.inactive'),
        dynamicText: (row) => (row.status === 'active' ? t('status.inactive') : t('status.active')),
        dynamicIcon: (row) => (row.status === 'active' ? PauseCircleOutlined : PlayCircleOutlined),
        dynamicColor: (row) => (row.status === 'active' ? 'warning' : 'success'),
        handle: handleToggleStatus as unknown as (
          row: Record<string, unknown>,
          index?: number
        ) => void,
      },
      {
        text: t('common.delete'),
        icon: DeleteOutlined,
        color: 'danger',
        handle: handleDelete as unknown as (row: Record<string, unknown>, index?: number) => void,
      },
    ],
  },
])

async function loadData() {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20

  const statusVal = params.status
  const status = statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  loading.value = true
  try {
    const result = await getOrganizations({
      page,
      page_size: pageSize,
      name: (params.name as string) || undefined,
      status,
    })
    tableData.value = result.items
    total.value = result.total
  } finally {
    loading.value = false
  }
}

function onFilterFetch() {
  pageTableRef.value?.resetCurPage(1)
  loadData()
}

function onTableFetch() {
  loadData()
}

function refresh() {
  loadData()
}

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

onMounted(loadData)
</script>
