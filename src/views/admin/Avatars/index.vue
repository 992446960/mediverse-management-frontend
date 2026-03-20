<template>
  <div class="avatars-page flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
      <PageFilter
        ref="pageFilterRef"
        :filter-conf="filterConf"
        @fetch-table-data="onFilterFetch"
        @org-id-change="onFilterOrgIdChange"
      />
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
    <AvatarWizard v-model:open="wizardOpen" @success="handleWizardSuccess" />
    <AvatarEditModal
      v-model:open="editOpen"
      :avatar-id="editingId ?? undefined"
      @success="handleEditSuccess"
    />
    <AvatarDetailModal v-model:open="detailOpen" :avatar-id="detailAvatarId ?? undefined" />
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
  EyeOutlined,
} from '@ant-design/icons-vue'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import AvatarWizard from './components/AvatarWizard.vue'
import AvatarEditModal from './components/AvatarEditModal.vue'
import AvatarDetailModal from './components/AvatarDetailModal.vue'
import { useAuthStore } from '@/stores/auth'
import { getAvatars, updateAvatar, deleteAvatar } from '@/api/avatars'
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
const authStore = useAuthStore()

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

const filterConf = computed<PageFilterConfig>(() => {
  const showOrgFilter = !authStore.isOrgAdmin && !authStore.isDeptAdmin
  const showDeptFilter = !authStore.isDeptAdmin
  const filterForm: PageFilterConfig['filterForm'] = [
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
  ]
  if (showOrgFilter) {
    filterForm.push({
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
    })
  }
  if (showDeptFilter) {
    filterForm.push({
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
    })
  }
  filterForm.push({
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
    formatter: (row) => formatScope(row as unknown as Avatar),
  },
  {
    label: t('org.status'),
    prop: 'status',
    type: 'scope',
    scopeType: '_tag',
    width: 100,
    tagType: (row) => ((row as unknown as Avatar).status === 'active' ? 'success' : 'error'),
    tagText: (row) =>
      (row as unknown as Avatar).status === 'active' ? t('status.active') : t('status.inactive'),
  },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    width: 160,
    formatter: (row) =>
      dayjs((row as unknown as Avatar).created_at as string).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 300,
    fixed: 'right',
    btns: [
      {
        text: t('common.detail'),
        icon: EyeOutlined,
        handle: (row) => openDetail(row as unknown as Avatar),
      },
      {
        text: t('common.edit'),
        icon: EditOutlined,
        handle: (row) => openEditForm(row as unknown as Avatar),
      },
      {
        text: t('status.inactive'),
        dynamicText: (row) =>
          (row as unknown as Avatar).status === 'active'
            ? t('status.inactive')
            : t('status.active'),
        dynamicIcon: (row) =>
          (row as unknown as Avatar).status === 'active' ? PauseCircleOutlined : PlayCircleOutlined,
        dynamicColor: (row) =>
          (row as unknown as Avatar).status === 'active' ? 'warning' : 'success',
        handle: (row) => handleToggleStatus(row as unknown as Avatar),
      },
      {
        text: t('common.delete'),
        icon: DeleteOutlined,
        color: 'danger',
        handle: (row) => handleDelete(row as unknown as Avatar),
      },
    ],
  },
])

async function loadData() {
  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20
  const effectiveOrgId =
    authStore.isOrgAdmin || authStore.isDeptAdmin
      ? (authStore.currentOrgId ?? undefined)
      : (params.org_id as string) || undefined
  const effectiveDeptId = authStore.isDeptAdmin
    ? (authStore.currentDeptId ?? undefined)
    : (params.dept_id as string) || undefined

  if (
    effectiveOrgId &&
    deptListOrgId.value !== effectiveOrgId &&
    (authStore.isSysAdmin || authStore.isOrgAdmin)
  ) {
    deptListOrgId.value = effectiveOrgId
    const res = await getDepartments({ org_id: effectiveOrgId, page: 1, page_size: 200 })
    deptList.value = res.items
  }
  if (!effectiveOrgId && authStore.isSysAdmin) {
    deptListOrgId.value = null
    deptList.value = []
  }

  const typeVal = params.type as string
  const type =
    typeVal === 'general' || typeVal === 'specialist' || typeVal === 'expert' ? typeVal : undefined
  const statusVal = params.status as string
  const status = statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined

  loading.value = true
  try {
    const result = await getAvatars({
      page,
      page_size: pageSize,
      keyword: (params.keyword as string)?.trim() || undefined,
      type: type as AvatarType | undefined,
      org_id: effectiveOrgId,
      dept_id: effectiveDeptId,
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

/** 机构 id 有值且变化时请求该机构的科室列表（仅系统管理员有机构筛选时生效） */
async function onFilterOrgIdChange(orgId: string) {
  const id = orgId?.trim() || ''
  if (authStore.isOrgAdmin || authStore.isDeptAdmin) return
  if (id && deptListOrgId.value !== id) {
    deptListOrgId.value = id
    pageFilterRef.value?.setFilterField?.('dept_id', '')
    const res = await getDepartments({ org_id: id, page: 1, page_size: 200 })
    deptList.value = res.items
  }
  if (!id) {
    deptListOrgId.value = null
    deptList.value = []
  }
}

function onTableFetch() {
  loadData()
}

const wizardOpen = ref(false)
const editOpen = ref(false)
const editingId = ref<string | null>(null)
const detailOpen = ref(false)
const detailAvatarId = ref<string | null>(null)

function openWizard() {
  wizardOpen.value = true
}

function openEditForm(record: Avatar) {
  editingId.value = record.id
  editOpen.value = true
}

function openDetail(record: Avatar) {
  detailAvatarId.value = record.id
  detailOpen.value = true
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
      await updateAvatar(record.id, { status: nextStatus })
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
  if (authStore.isSysAdmin) {
    const res = await getOrganizations({ page: 1, page_size: 200 })
    orgList.value = res.items
  } else if (authStore.isOrgAdmin && authStore.currentOrgId) {
    const res = await getOrganizations({ page: 1, page_size: 200 })
    orgList.value = res.items.filter((o) => o.id === authStore.currentOrgId)
    const deptRes = await getDepartments({
      org_id: authStore.currentOrgId,
      page: 1,
      page_size: 200,
    })
    deptList.value = deptRes.items
    deptListOrgId.value = authStore.currentOrgId
  }
  loadData()
})
</script>
