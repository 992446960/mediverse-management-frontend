<template>
  <div class="users-page flex flex-1 overflow-hidden">
    <aside v-if="showTree" class="w-80 pr-4 flex flex-col shrink-0">
      <PageTree
        :title="treeTitle"
        :search-placeholder="treeSearchPlaceholder"
        :tree-data="treeData"
        :selected-key="selectedNodeKey"
        :loading="treeLoading"
        :empty-text="t('common.noData')"
        :fetch-data="loadTree"
        :refresh-title="t('common.refresh')"
        @node-click="onTreeSelect"
      />
    </aside>
    <section class="flex-1 flex flex-col min-h-0 min-w-0 pl-0" :class="{ 'pl-0': showTree }">
      <template v-if="hasSelection">
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
          >
            <template #roles="{ row }">
              <a-space :size="4" wrap>
                <a-tag v-for="r in row.roles as UserRole[]" :key="r">
                  {{ t(roleLabelKey(r)) }}
                </a-tag>
              </a-space>
            </template>
          </PageTable>
        </div>
      </template>
      <div
        v-else
        class="users-empty flex flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 min-h-[280px]"
      >
        <a-empty :description="t('user.selectOrgDeptFirst')" />
      </div>
      <UserForm
        v-model:open="formOpen"
        :initial-record="editingRecord"
        :view-only="viewOnly"
        :default-org-id="selectedOrgId ?? ''"
        :default-dept-id="selectedDeptId ?? ''"
        :assignable-roles="assignableRoles"
        @submit="handleFormSubmit"
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  EditOutlined,
  KeyOutlined,
  EyeOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons-vue'
import { PageTree } from '@/components/PageTree'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import UserForm from './components/UserForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useOrgDeptFromTree } from '@/composables/useOrgDeptFromTree'
import { getDepartmentsTree } from '@/api/departments'
import {
  getUsers,
  createUser,
  updateUser,
  resetPass,
} from '@/api/users'
import { confirmDelete } from '@/utils/confirm'
import type { PageHeadConfig } from '@/components/PageHead/types'
import type { PageFilterConfig } from '@/components/PageFilter/types'
import type { PageTableConfig, PageTableColumnConfig } from '@/components/PageTable/types'
import type { UserListItem } from '@/types/user'
import type { CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'
import type { OrgDeptTreeNode } from '@/types/department'
import type { TableTreeNode } from '@/components/PageTree/types'

const { t } = useI18n()
const authStore = useAuthStore()

const pageFilterRef = ref<InstanceType<typeof PageFilter> | null>(null)
const pageTableRef = ref<InstanceType<typeof PageTable> | null>(null)

const tableData = ref<UserListItem[]>([])
const loading = ref(false)
const total = ref(0)

/** 多角色按最高权限：sysadmin > org_admin > dept_admin > user */
const highestRole = computed<UserRole>(() => {
  if (authStore.isSysAdmin) return 'sysadmin'
  if (authStore.isOrgAdmin) return 'org_admin'
  if (authStore.isDeptAdmin) return 'dept_admin'
  return 'user'
})

const showTree = computed(() => highestRole.value === 'sysadmin' || highestRole.value === 'org_admin')

// ----- 左侧树 -----
const treeLoading = ref(false)
const rawTree = ref<OrgDeptTreeNode[]>([])
const deptIdToOrgId = ref<Map<string, string>>(new Map())
const orgIdToName = ref<Map<string, string>>(new Map())

const selectedOrgId = ref<string | null>(null)
const selectedDeptId = ref<string | null>(null)
const selectedOrgName = ref('')
const selectedNodeKey = ref('')

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  sysadmin: 'user.roleSysadmin',
  org_admin: 'user.roleOrgAdmin',
  dept_admin: 'user.roleDeptAdmin',
  user: 'user.roleUser',
}

function roleLabelKey(role: UserRole): string {
  return ROLE_LABEL_KEYS[role] ?? role
}

/** sysadmin：机构-科室二级树；org_admin：当前机构下科室一维列表 */
const treeData = computed<TableTreeNode[]>(() => {
  const list = rawTree.value.filter((n) => n.type === 'org')
  if (highestRole.value === 'org_admin' && authStore.currentOrgId) {
    const org = list.find((n) => n.id === authStore.currentOrgId)
    if (!org?.children?.length) return []
    return org.children.map((dept) => ({
      key: `dept_${dept.id}`,
      label: dept.name,
      icon: 'apartment' as const,
    }))
  }
  return list.map((org) => ({
    key: `org_${org.id}`,
    label: org.name,
    icon: 'bank' as const,
    children: org.children?.length
      ? org.children.map((dept) => ({
          key: `dept_${dept.id}`,
          label: dept.name,
          icon: 'apartment' as const,
        }))
      : undefined,
  }))
})

const treeTitle = computed(() => {
  if (highestRole.value === 'org_admin' && authStore.currentOrgId) {
    return orgIdToName.value.get(authStore.currentOrgId) ?? t('dept.allOrgs')
  }
  return t('dept.allOrgs')
})

const treeSearchPlaceholder = computed(() => {
  if (highestRole.value === 'org_admin') return t('dept.searchDeptName')
  return t('dept.searchOrgOrDept')
})

/** 列表筛选用：有树时用选中节点，无树（dept_admin）时用当前用户机构/科室 */
const effectiveOrgId = computed(() => {
  if (!showTree.value && authStore.currentOrgId) return authStore.currentOrgId
  return selectedOrgId.value
})
const effectiveDeptId = computed(() => {
  if (!showTree.value && authStore.currentDeptId) return authStore.currentDeptId
  return selectedDeptId.value
})

/** 角色编辑弹窗可分配角色（按当前用户权限） */
const assignableRoles = computed<UserRole[]>(() => {
  if (authStore.isSysAdmin) return ['sysadmin', 'org_admin', 'dept_admin', 'user']
  if (authStore.isOrgAdmin) return ['dept_admin', 'user']
  return ['user']
})

const { setTree: setOrgDeptTree, clearCache: clearOrgDeptCache } = useOrgDeptFromTree()

async function loadTree() {
  treeLoading.value = true
  try {
    const list = await getDepartmentsTree()
    rawTree.value = list
    setOrgDeptTree(list)
    const deptMap = new Map<string, string>()
    const orgNameMap = new Map<string, string>()
    list
      .filter((n) => n.type === 'org')
      .forEach((org) => {
        orgNameMap.set(org.id, org.name)
        org.children?.forEach((dept) => deptMap.set(dept.id, org.id))
      })
    deptIdToOrgId.value = deptMap
    orgIdToName.value = orgNameMap
  } finally {
    treeLoading.value = false
  }
}

function onTreeSelect(payload: { key: string; label: string; level: 'root' | 'branch' }) {
  const key = payload.key
  if (key.startsWith('org_')) {
    const id = key.replace(/^org_/, '')
    selectedOrgId.value = id
    selectedDeptId.value = null
    selectedOrgName.value = payload.label.replace(/\s*\([^)]*\)\s*$/, '').trim() || payload.label
  } else if (key.startsWith('dept_')) {
    const id = key.replace(/^dept_/, '')
    selectedDeptId.value = id
    selectedOrgId.value = deptIdToOrgId.value.get(id) ?? null
    selectedOrgName.value = selectedOrgId.value
      ? orgIdToName.value.get(selectedOrgId.value) || ''
      : ''
  }
  selectedNodeKey.value = key
}

/** 有树时需选中节点；无树（dept_admin）时直接展示本科室用户列表 */
const hasSelection = computed(
  () => showTree.value ? !!(selectedOrgId.value || selectedDeptId.value) : !!(effectiveOrgId.value || effectiveDeptId.value)
)

// ----- 右侧 PageHead / PageFilter / PageTable -----
const headConf = computed<PageHeadConfig>(() => ({
  title: t('menu.userManagement'),
  btns: [
    {
      text: t('user.addUser'),
      type: 'primary',
      icon: PlusOutlined,
      handle: openCreateForm,
      permission: ['sysadmin', 'org_admin', 'dept_admin'],
    },
  ],
}))

const filterConf = computed<PageFilterConfig>(() => ({
  filterForm: [
    {
      key: 'keyword',
      label: t('common.search'),
      type: 'input',
      ph: t('user.keywordPlaceholder'),
      col: 8,
      defaultValue: '',
    },
    {
      key: 'role',
      label: t('user.roles'),
      type: 'select',
      ph: t('common.all'),
      col: 6,
      options: [
        { label: t('common.all'), value: '' },
        { label: t('user.roleSysadmin'), value: 'sysadmin' },
        { label: t('user.roleOrgAdmin'), value: 'org_admin' },
        { label: t('user.roleDeptAdmin'), value: 'dept_admin' },
        { label: t('user.roleUser'), value: 'user' },
      ],
      clearable: true,
      defaultValue: '',
    },
    {
      key: 'status',
      label: t('user.status'),
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
  { label: t('user.username'), prop: 'username', width: 120, showOverflowTooltip: true },
  { label: t('user.realName'), prop: 'real_name', width: 100, showOverflowTooltip: true },
  { label: t('user.phone'), prop: 'phone', width: 160 },
  { label: t('user.email'), prop: 'email', width: 180, showOverflowTooltip: true },
  { label: t('user.org'), prop: 'org_name', width: 160, showOverflowTooltip: true },
  { label: t('user.dept'), prop: 'dept_name', width: 100, showOverflowTooltip: true },
  {
    label: t('user.roles'),
    type: 'slot',
    slotName: 'roles',
    width: 260,
  },
  {
    label: t('user.status'),
    prop: 'status',
    type: 'scope',
    scopeType: '_tag',
    width: 90,
    tagType: (row) => (row.status === 'active' ? 'success' : 'error'),
    tagText: (row) => (row.status === 'active' ? t('status.active') : t('status.inactive')),
  },
  {
    label: t('common.createdAt'),
    prop: 'created_at',
    width: 200,
    formatter: (row) => dayjs(row.created_at as string).format('YYYY-MM-DD HH:mm'),
  },
  {
    label: t('common.actions'),
    type: 'operation',
    width: 280,
    fixed: 'right',
    btns: [
      {
        text: t('common.detail'),
        icon: EyeOutlined,
        handle: openDetail as unknown as (row: Record<string, unknown>, index?: number) => void,
      },
      {
        text: t('common.edit'),
        icon: EditOutlined,
        handle: openEditForm as unknown as (row: Record<string, unknown>, index?: number) => void,
      },
      {
        text: t('common.more'),
        type: 'popover',
        moreList: [
          {
            text: t('user.resetPassword'),
            icon: KeyOutlined,
            color: 'warning',
            handle: openResetPasswordConfirm as unknown as (
              row: Record<string, unknown>,
              index?: number
            ) => void,
          },
          {
            text: t('status.inactive'),
            dynamicText: (row) =>
              (row.status === 'active' ? t('status.inactive') : t('status.active')),
            dynamicIcon: (row) => (row.status === 'active' ? StopOutlined : CheckCircleOutlined),
            dynamicColor: (row) => (row.status === 'active' ? 'danger' : 'success'),
            handle: handleToggleStatus as unknown as (
              row: Record<string, unknown>,
              index?: number
            ) => void,
          },
        ],
      },
    ],
  },
])

async function loadData() {
  const orgId = effectiveOrgId.value
  const deptId = effectiveDeptId.value
  if (!orgId && !deptId) {
    tableData.value = []
    total.value = 0
    return
  }

  const params = pageFilterRef.value?.filteParams ?? {}
  const page = pageTableRef.value?.currentPage ?? 1
  const pageSize = pageTableRef.value?.pageSize ?? 20
  const statusVal = params.status as string
  const status = statusVal === 'active' || statusVal === 'inactive' ? statusVal : undefined
  const roleVal = params.role as string
  const role = roleVal && ['sysadmin', 'org_admin', 'dept_admin', 'user'].includes(roleVal) ? roleVal as UserRole : undefined

  loading.value = true
  try {
    const result = await getUsers({
      page,
      page_size: pageSize,
      org_id: orgId ?? undefined,
      dept_id: deptId ?? undefined,
      keyword: (params.keyword as string)?.trim() || undefined,
      role,
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

watch(
  () => [selectedOrgId.value, selectedDeptId.value, effectiveOrgId.value, effectiveDeptId.value] as const,
  ([selOrg, selDept, effOrg, effDept]) => {
    const has = showTree.value ? !!(selOrg || selDept) : !!(effOrg || effDept)
    if (has) {
      loadData()
    } else {
      tableData.value = []
      total.value = 0
    }
  },
  { immediate: true }
)

// ----- 表单与操作 -----
const formOpen = ref(false)
const editingRecord = ref<UserListItem | null>(null)
const viewOnly = ref(false)

function openCreateForm() {
  editingRecord.value = null
  viewOnly.value = false
  formOpen.value = true
}

function openDetail(record: UserListItem) {
  editingRecord.value = record
  viewOnly.value = true
  formOpen.value = true
}

function openEditForm(record: UserListItem) {
  editingRecord.value = record
  viewOnly.value = false
  formOpen.value = true
}

async function handleFormSubmit(payload: CreateUserPayload | UpdateUserPayload) {
  try {
    if (editingRecord.value?.id) {
      await updateUser(editingRecord.value.id, payload as UpdateUserPayload)
      message.success(t('common.success'))
    } else {
      await createUser(payload as CreateUserPayload)
      message.success(t('common.success'))
    }
    refresh()
  } catch {
    // error already shown by api interceptor
  }
}

const DEFAULT_PASSWORD = '123456'

function openResetPasswordConfirm(record: UserListItem) {
  confirmDelete({
    title: t('user.resetPassword'),
    content: t('user.confirmResetPasswordToDefault', { name: record.real_name || record.username }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await resetPass(record.id)
        message.success(t('user.resetPasswordSuccessDefault'))
        navigator.clipboard.writeText(DEFAULT_PASSWORD).then(
          () => message.success(t('user.defaultPasswordCopy')),
          () => {}
        )
        refresh()
      } catch {
        // error already shown
      }
    },
  })
}

function handleToggleStatus(record: UserListItem) {
  const isActivate = record.status === 'inactive'
  confirmDelete({
    title: isActivate ? t('status.active') : t('status.inactive'),
    content: isActivate ? t('user.confirmActivate') : t('user.confirmDeactivate'),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await updateUser(record.id, { status: isActivate ? 'active' : 'inactive' })
        message.success(t('common.success'))
        refresh()
      } catch {
        // error already shown
      }
    },
  })
}

onMounted(() => {
  loadTree()
})

onBeforeUnmount(() => {
  clearOrgDeptCache()
})
</script>
