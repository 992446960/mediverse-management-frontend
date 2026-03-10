<template>
  <div class="departments-page flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-col shrink-0">
      <PageTree
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
        <div class="app-container p-4 mb-4">
          <PageHead :head-conf="headConf" />
          <PageFilter
            ref="pageFilterRef"
            :filter-conf="filterConf"
            @fetch-table-data="onFilterFetch"
          />
        </div>
        <div class="app-container p-0 flex-1 flex flex-col min-h-0">
          <PageTable
            ref="pageTableRef"
            :table-conf="tableConf"
            :table-columns="tableColumns"
            :table-data="tableData as unknown as Record<string, unknown>[]"
            @fetch-table-data="onTableFetch"
          />
        </div>
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
import { PageTree } from '@/components/PageTree'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import DeptForm from './components/DeptForm.vue'
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
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import type { Organization } from '@/types/organization'
import type { Department, DepartmentForm } from '@/types/department'
import type { TableTreeNode } from '@/components/PageTree/types'

const { t } = useI18n()
const authStore = useAuthStore()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const tableData = ref<Department[]>([])
const loading = ref(false)
const total = ref(0)

// ----- 左侧树（保持不变） -----
const treeLoading = ref(false)
const organizationsList = ref<Organization[]>([])
const selectedOrgId = ref<string | null>(null)
const selectedOrgName = ref<string>('')
const selectedOrgKey = ref<string>('')

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

function onTreeSelect(payload: { key: string; label: string; level: 'root' | 'branch' }) {
  if (!payload.key.startsWith('org_')) return
  selectedOrgId.value = payload.key.replace(/^org_/, '')
  selectedOrgName.value = payload.label.replace(/\s*\([^)]*\)\s*$/, '').trim() || payload.label
  selectedOrgKey.value = payload.key
}

// ----- 右侧 PageHead / PageFilter / PageTable -----
const headConf = computed<PageHeadConfig>(() => ({
  title: t('dept.title'),
  btns: [
    {
      text: t('dept.addDept'),
      type: 'primary',
      icon: PlusOutlined,
      handle: openCreateForm,
      permission: ['sysadmin', 'org_admin'],
    },
  ],
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'name',
      label: t('dept.name'),
      type: 'input',
      ph: t('dept.namePlaceholder'),
      col: 8,
      defaultValue: '',
    },
    {
      key: 'status',
      label: t('dept.status'),
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
  { label: t('dept.name'), prop: 'name', width: 160, showOverflowTooltip: true },
  { label: t('dept.code'), prop: 'code', width: 120 },
  { label: t('dept.branch'), prop: 'org_name', width: 180, showOverflowTooltip: true },
  {
    label: t('dept.status'),
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
        dynamicText: (row) =>
          row.status === 'active' ? t('status.inactive') : t('status.active'),
        dynamicIcon: (row) =>
          row.status === 'active' ? PauseCircleOutlined : PlayCircleOutlined,
        dynamicColor: (row) =>
          row.status === 'active' ? 'warning' : 'success',
        handle: handleToggleStatus as unknown as (row: Record<string, unknown>, index?: number) => void,
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
  const orgId = selectedOrgId.value
  if (!orgId) {
    tableData.value = []
    total.value = 0
    return
  }

  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20

  const statusVal = params.status
  const status =
    statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  loading.value = true
  try {
    const result = await getDepartments({
      page,
      page_size: pageSize,
      org_id: orgId,
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

watch(selectedOrgId, (id) => {
  if (id) {
    loadData()
  } else {
    tableData.value = []
    total.value = 0
  }
})

// ----- 表单与操作 -----
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
