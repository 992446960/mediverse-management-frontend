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
        @toggle-status="handleToggleStatus"
        @delete="handleDelete"
      />
    </div>
    <TokenForm
      ref="tokenFormRef"
      v-model:open="formOpen"
      :org-options="orgOptions"
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
import { getApiTokens, createApiToken, updateApiTokenStatus, deleteApiToken } from '@/api/apiTokens'
import { getOrganizations } from '@/api/organizations'
import { confirmDelete } from '@/utils/confirm'
import type { ApiToken, CreateApiTokenParams } from '@/types/apiTokens'
import type { Organization } from '@/types/organization'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig } from '@/components/PageTable/types'

const { t } = useI18n()

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
      permission: ['sysadmin'],
    },
  ],
}))

const orgOptions = computed(() => [
  { label: t('common.all'), value: '' },
  ...orgList.value.map((o) => ({ label: o.name, value: o.id })),
])

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'name',
      label: t('apiToken.name'),
      type: 'input',
      ph: t('apiToken.namePlaceholder'),
      col: 6,
      defaultValue: '',
    },
    {
      key: 'org_id',
      label: t('apiToken.org'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: orgOptions.value,
      clearable: true,
      defaultValue: '',
    },
    {
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

async function loadData() {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20

  const name = (params.name as string)?.trim() || undefined
  const org_id = (params.org_id as string)?.trim() || undefined
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

function openCreateForm() {
  formOpen.value = true
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
  getOrganizations({ page: 1, page_size: 500 }).then((res) => {
    orgList.value = res.items
  })
  loadData()
})
</script>
