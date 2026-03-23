<template>
  <div class="api-tokens-page flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
      <PageFilter ref="pageFilterRef" :filter-conf="filterConf" @fetch-table-data="onFilterFetch" />
    </div>
    <div class="app-container p-0 flex-1 flex flex-col min-h-0">
      <TokenTable
        ref="pageTableRef"
        :table-conf="tableConf"
        :table-data="tableData"
        @fetch-table-data="onTableFetch"
        @edit="openEditForm"
        @toggle-status="handleToggleStatus"
        @delete="handleDelete"
      />
    </div>
    <TokenEditForm
      v-model:open="editFormOpen"
      :initial-record="editingRecord"
      @submit="handleEditSubmit"
    />
    <TokenForm
      ref="tokenFormRef"
      v-model:open="formOpen"
      :org-options="tokenFormOrgOptions"
      :lock-org-to-current="authStore.isOrgAdmin || authStore.isDeptAdmin"
      :default-org-id="authStore.currentOrgId ?? ''"
      @submit="handleFormSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import { PlusOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import TokenTable from './components/TokenTable.vue'
import TokenForm from './components/TokenForm.vue'
import TokenEditForm from './components/TokenEditForm.vue'
import { useAuthStore } from '@/stores/auth'
import {
  getApiTokens,
  createApiToken,
  updateApiToken,
  updateApiTokenStatus,
  deleteApiToken,
} from '@/api/apiTokens'
import { getOrganizations } from '@/api/organizations'
import { confirmDelete } from '@/utils/confirm'
import type { ApiToken, CreateApiTokenParams, UpdateApiTokenParams } from '@/types/apiTokens'
import type { Organization } from '@/types/organization'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig } from '@/components/PageTable/types'

const { t } = useI18n()
const authStore = useAuthStore()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof TokenTable> | null>(null)
const tokenFormRef = ref<InstanceType<typeof TokenForm> | null>(null)

const tableData = ref<ApiToken[]>([])
const loading = ref(false)
const total = ref(0)
const orgList = ref<Organization[]>([])

const headConf = computed<PageHeadConfig>(() => ({
  title: t('apiToken.title'),
  btns: [
    {
      text: t('apiToken.addToken'),
      type: 'primary',
      icon: PlusOutlined,
      handle: openCreateForm,
      permission: ['sysadmin', 'org_admin'],
    },
  ],
}))

const orgOptions = computed(() => [
  { label: t('common.all'), value: '' },
  ...orgList.value.map((o) => ({ label: o.name, value: o.id })),
])

/** 新建 Token 表单用：不含「全部」，空值时展示 placeholder */
const tokenFormOrgOptions = computed(() =>
  orgList.value.map((o) => ({ label: o.name, value: o.id }))
)

const filterConf = computed<PageFilterConfig>(() => {
  const showOrgFilter = !authStore.isOrgAdmin && !authStore.isDeptAdmin
  const filterForm: PageFilterConfig['filterForm'] = [
    {
      key: 'name',
      label: t('apiToken.name'),
      type: 'input',
      ph: t('apiToken.namePlaceholder'),
      col: 6,
      defaultValue: '',
    },
  ]
  if (showOrgFilter) {
    filterForm.push({
      key: 'org_id',
      label: t('apiToken.org'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: orgOptions.value,
      clearable: true,
      defaultValue: '',
    })
  }
  filterForm.push({
    key: 'status',
    label: t('apiToken.status'),
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
  })
  return {
    filterForm,
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
  }
})

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
  emptyText: t('common.noData'),
}))

async function loadData() {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20

  const name = (params.name as string)?.trim() || undefined
  const org_id =
    authStore.isOrgAdmin || authStore.isDeptAdmin
      ? (authStore.currentOrgId ?? undefined)
      : (params.org_id as string)?.trim() || undefined
  const statusVal = params.status
  const status = statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  loading.value = true
  try {
    const result = await getApiTokens({
      page,
      page_size: pageSize,
      name,
      org_id,
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

const formOpen = ref(false)
const editFormOpen = ref(false)
const editingRecord = ref<ApiToken | null>(null)

function openCreateForm() {
  formOpen.value = true
}

function openEditForm(record: ApiToken) {
  editingRecord.value = record
  editFormOpen.value = true
}

async function handleEditSubmit(id: string, values: UpdateApiTokenParams) {
  try {
    await updateApiToken(id, values)
    message.success(t('apiToken.updateSuccess'))
    editFormOpen.value = false
    editingRecord.value = null
    loadData()
  } catch {
    // error already shown by api interceptor
  }
}

async function handleFormSubmit(values: CreateApiTokenParams) {
  try {
    const result = await createApiToken(values)
    tokenFormRef.value?.showCreatedResult(result)
    message.success(t('apiToken.createSuccess'))
    loadData()
  } catch {
    // error already shown by api interceptor
  }
}

function handleToggleStatus(record: ApiToken) {
  const nextStatus = record.status === 'active' ? 'inactive' : 'active'
  confirmDelete({
    title: t('apiToken.confirmStatus'),
    content: t('common.confirmStatusContent'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await updateApiTokenStatus(record.id, { status: nextStatus })
      message.success(t('common.success'))
      loadData()
    },
  })
}

function handleDelete(record: ApiToken) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('apiToken.confirmDelete'),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteApiToken(record.id)
      message.success(t('common.success'))
      loadData()
    },
  })
}

onMounted(() => {
  getOrganizations({ page: 1, page_size: 200 }).then((res) => {
    if (authStore.isOrgAdmin || authStore.isDeptAdmin) {
      orgList.value = authStore.currentOrgId
        ? res.items.filter((o) => o.id === authStore.currentOrgId)
        : []
    } else {
      orgList.value = res.items
    }
  })
  loadData()
})
</script>
