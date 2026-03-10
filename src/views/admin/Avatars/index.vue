<template>
  <div class="avatars-page flex flex-1 flex-col overflow-hidden">
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
    <AvatarWizard
      v-model:open="wizardOpen"
      @success="handleWizardSuccess"
    />
    <AvatarEditModal
      v-model:open="editOpen"
      :avatar-id="editingId ?? undefined"
      @success="handleEditSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
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
import AvatarWizard from './components/AvatarWizard.vue'
import AvatarEditModal from './components/AvatarEditModal.vue'
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
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'

const { t } = useI18n()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const tableData = ref<Avatar[]>([])
const loading = ref(false)
const total = ref(0)

const orgList = ref<Organization[]>([])
const deptList = ref<Department[]>([])
/** 当前已加载科室的机构 ID，用于在 loadData 时按需刷新 deptList */
const deptListOrgId = ref<string | null>(null)

const headConf = computed<PageHeadConfig>(() => ({
  title: t('menu.avatarManagement'),
  btns: [
    {
      text: t('avatar.addAvatar'),
      type: 'primary',
      icon: PlusOutlined,
      handle: openWizard,
      permission: ['sysadmin', 'org_admin', 'dept_admin'],
    },
  ],
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'keyword',
      label: t('avatar.name'),
      type: 'input',
      ph: t('avatar.name'),
      col: 8,
      defaultValue: '',
    },
    {
      key: 'type',
      label: t('avatar.type'),
      type: 'select',
      ph: t('common.all'),
      col: 4,
      options: [
        { label: t('common.all'), value: '' },
        ...AVATAR_TYPE_VALUES.map((v) => ({ label: t(AVATAR_TYPE_LABEL_KEYS[v]), value: v })),
      ],
      clearable: true,
      defaultValue: '',
    },
    {
      key: 'org_id',
      label: t('avatar.org'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: [
        { label: t('common.all'), value: '' },
        ...orgList.value.map((o) => ({ label: o.name, value: o.id })),
      ],
      clearable: true,
      defaultValue: '',
    },
    {
      key: 'dept_id',
      label: t('avatar.dept'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: [
        { label: t('common.all'), value: '' },
        ...deptList.value.map((d) => ({ label: d.name, value: d.id })),
      ],
      clearable: true,
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

function formatScope(record: Avatar): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

const tableConf = computed<PageTableConfig>(() => ({
  isLoading: loading.value,
  total: total.value,
  updateTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
  rowKey: 'id',
  emptyText: t('common.noData'),
}))

const tableColumns = computed<PageTableColumnConfig[]>(() => [
  {
    label: t('avatar.name'),
    prop: 'name',
    width: 140,
    showOverflowTooltip: true,
  },
  {
    label: t('avatar.type'),
    prop: 'type',
    type: 'scope',
    scopeType: '_tag',
    width: 90,
    tagType: (row) => AVATAR_TYPE_TAG_COLORS[row.type as AvatarType] ?? 'default',
    tagText: (row) => t(AVATAR_TYPE_LABEL_KEYS[row.type as AvatarType]),
  },
  {
    label: t('avatar.scope'),
    prop: 'scope',
    width: 220,
    showOverflowTooltip: true,
    formatter: (row) => formatScope(row as Avatar),
  },
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
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20
  const orgId = (params.org_id as string) || undefined

  if (orgId && deptListOrgId.value !== orgId) {
    deptListOrgId.value = orgId
    const res = await getDepartments({ org_id: orgId, page: 1, page_size: 500 })
    deptList.value = res.items
  }
  if (!orgId) {
    deptListOrgId.value = null
    deptList.value = []
  }

  const typeVal = params.type as string
  const type =
    typeVal === 'general' || typeVal === 'specialist' || typeVal === 'expert'
      ? typeVal
      : undefined
  const statusVal = params.status as string
  const status =
    statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  loading.value = true
  try {
    const result = await getAvatars({
      page,
      page_size: pageSize,
      keyword: (params.keyword as string)?.trim() || undefined,
      type: type as AvatarType | undefined,
      org_id: (params.org_id as string) || undefined,
      dept_id: (params.dept_id as string) || undefined,
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
  loadData()
}

function handleEditSuccess() {
  editOpen.value = false
  editingId.value = null
  loadData()
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
      loadData()
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
      loadData()
    },
  })
}

onMounted(async () => {
  const res = await getOrganizations({ page: 1, page_size: 500 })
  orgList.value = res.items
  loadData()
})
</script>
