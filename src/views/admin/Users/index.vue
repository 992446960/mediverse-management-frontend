<template>
  <div class="users-page flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-col shrink-0">
      <PageTree
        :title="t('dept.allOrgs')"
        :search-placeholder="t('dept.searchOrg')"
        :tree-data="treeData"
        :selected-key="selectedNodeKey"
        :loading="treeLoading"
        :empty-text="t('common.noData')"
        :fetch-data="loadTree"
        :refresh-title="t('common.refresh')"
        @node-click="onTreeSelect"
      />
    </aside>
    <section class="flex-1 flex flex-col min-h-0 min-w-0 pl-0">
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
        @submit="handleFormSubmit"
      />
      <RoleEditor
        v-model:open="roleEditorOpen"
        :roles="roleEditorUser?.roles ?? []"
        @submit="handleRoleSubmit"
      />
      <a-modal
        v-model:open="tempPasswordModalOpen"
        :title="t('user.tempPasswordTitle')"
        :footer="null"
      >
        <p class="mb-2">{{ t('user.tempPasswordTip') }}</p>
        <a-input-password v-model:value="tempPassword" readonly class="mb-2" />
      </a-modal>
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
  DeleteOutlined,
  TeamOutlined,
  KeyOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import { PageTree } from '@/components/PageTree'
import PageHead from '@/components/PageHead/index.vue'
import PageFilter from '@/components/PageFilter/index.vue'
import PageTable from '@/components/PageTable/index.vue'
import UserForm from './components/UserForm.vue'
import RoleEditor from './components/RoleEditor.vue'
import { useAuthStore } from '@/stores/auth'
import { getDepartmentsTree } from '@/api/departments'
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserRoles,
  resetPassword,
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

// ----- 左侧树（保持不变） -----
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

const treeData = computed<TableTreeNode[]>(() => {
  let list = rawTree.value
  if (authStore.isOrgAdmin && authStore.currentOrgId) {
    list = list.filter((n) => n.type === 'org' && n.id === authStore.currentOrgId)
  }
  return list
    .filter((n) => n.type === 'org')
    .map((org) => ({
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

async function loadTree() {
  treeLoading.value = true
  try {
    const list = await getDepartmentsTree()
    rawTree.value = list
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

const hasSelection = computed(() => !!selectedOrgId.value || !!selectedDeptId.value)

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
            text: t('user.roleEditor'),
            icon: TeamOutlined,
            handle: openRoleEditor as unknown as (
              row: Record<string, unknown>,
              index?: number
            ) => void,
          },
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
            text: t('common.delete'),
            icon: DeleteOutlined,
            color: 'danger',
            handle: handleDelete as unknown as (
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
  const orgId = selectedOrgId.value
  const deptId = selectedDeptId.value
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

  loading.value = true
  try {
    const result = await getUsers({
      page,
      page_size: pageSize,
      org_id: orgId ?? undefined,
      dept_id: deptId ?? undefined,
      keyword: (params.keyword as string)?.trim() || undefined,
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
  () => [selectedOrgId.value, selectedDeptId.value] as const,
  ([orgId, deptId]) => {
    if (orgId || deptId) {
      loadData()
    } else {
      tableData.value = []
      total.value = 0
    }
  }
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
      const res = await createUser(payload as CreateUserPayload)
      if (res.initial_password) {
        message.success(t('user.createSuccessWithPassword', { password: res.initial_password }))
      } else {
        message.success(t('common.success'))
      }
    }
    refresh()
  } catch {
    // error already shown by api interceptor
  }
}

const roleEditorOpen = ref(false)
const roleEditorUser = ref<UserListItem | null>(null)

function openRoleEditor(record: UserListItem) {
  roleEditorUser.value = record
  roleEditorOpen.value = true
}

async function handleRoleSubmit(roles: UserRole[]) {
  if (!roleEditorUser.value) return
  try {
    await updateUserRoles(roleEditorUser.value.id, { roles })
    message.success(t('common.success'))
    refresh()
  } catch {
    // error already shown
  }
}

const tempPasswordModalOpen = ref(false)
const tempPassword = ref('')

function openResetPasswordConfirm(record: UserListItem) {
  confirmDelete({
    title: t('user.resetPassword'),
    content: t('user.confirmResetPassword', { name: record.real_name || record.username }),
    okText: t('common.confirm'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        const res = await resetPassword(record.id)
        tempPassword.value = res.new_password
        tempPasswordModalOpen.value = true
        copyTempPassword()
      } catch {
        // error already shown
      }
    },
  })
}

function copyTempPassword() {
  if (!tempPassword.value) return
  navigator.clipboard.writeText(tempPassword.value).then(
    () => message.success(t('user.tempPasswordCopy')),
    () => {}
  )
}

function handleDelete(record: UserListItem) {
  confirmDelete({
    title: t('common.confirmDeleteTitle'),
    content: t('common.confirmDeleteContent'),
    okText: t('common.delete'),
    cancelText: t('common.cancel'),
    onOk: async () => {
      await deleteUser(record.id)
      message.success(t('common.success'))
      refresh()
    },
  })
}

onMounted(loadTree)
</script>
