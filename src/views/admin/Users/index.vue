<template>
  <div class="users-page flex flex-1 overflow-hidden">
    <aside class="w-80 pr-4 flex flex-col shrink-0 bg-slate-100 dark:bg-slate-950">
      <TableTree
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
        <div class="mb-4">
          <TableFilter
            v-model="filterState"
            :title="t('menu.userManagement')"
            :primary-action="{
              text: t('user.addUser'),
              permission: ['sysadmin', 'org_admin', 'dept_admin'],
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
          :title="tableTitle"
          :subtitle="`(共 ${pagination.total} 条记录)`"
          :columns="columns as ColumnsType<Record<string, unknown>>"
          :data-source="data as unknown as Record<string, unknown>[]"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1500 }"
          :pagination="paginationConfig"
          :toolbar="toolbarConfig"
          :empty-text="t('common.noData')"
          @change="onTableChange"
          @refresh="refresh"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'roles'">
              <a-space :size="4" wrap>
                <a-tag v-for="r in (record as UserListItem).roles" :key="r">
                  {{ t(roleLabelKey(r)) }}
                </a-tag>
              </a-space>
            </template>
            <template v-else>
              {{ formatCellValue(record as Record<string, unknown>, column) }}
            </template>
          </template>
        </ProTable>
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
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { TableTree } from '@/components/TableTree'
import { TableFilter } from '@/components/TableFilter'
import { ProTable } from '@/components/Table'
import UserForm from './components/UserForm.vue'
import RoleEditor from './components/RoleEditor.vue'
import { useTableData } from '@/composables/useTableData'
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
import type { UserListItem } from '@/types/user'
import type { CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'
import type { OrgDeptTreeNode } from '@/types/department'
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
const rawTree = ref<OrgDeptTreeNode[]>([])
/** 科室 id -> 机构 id，用于树选科室时设置 selectedOrgId */
const deptIdToOrgId = ref<Map<string, string>>(new Map())
/** 机构 id -> 机构名称，用于右侧标题等 */
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

/** bodyCell 插槽中未单独处理的列（如 username、real_name）的默认展示值 */
function formatCellValue(
  record: Record<string, unknown>,
  column: { dataIndex?: string | string[]; key?: string }
): string {
  const di = column.dataIndex
  if (di == null) return ''
  const key = Array.isArray(di) ? di.join('.') : di
  const v = record[key as string]
  return v != null ? String(v) : ''
}

/** 将 getDepartmentsTree 转为 TableTree 的树形结构（机构为根、科室为子） */
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

const hasSelection = computed(() => !!selectedOrgId.value || !!selectedDeptId.value)

const tableTitle = computed(() => {
  const org = selectedOrgName.value || orgIdToName.value.get(selectedOrgId.value || '') || ''
  if (selectedDeptId.value) {
    return org ? `${org} - ${t('menu.userManagement')}` : t('menu.userManagement')
  }
  return org ? `${org} - ${t('menu.userManagement')}` : t('menu.userManagement')
})

const filterState = ref<Record<string, string | number | undefined>>({
  keyword: '',
  status: '',
})

const filterFields = computed<TableFilterFieldConfig[]>(() => [
  {
    key: 'keyword',
    label: t('common.search') + ':',
    type: 'input',
    placeholder: t('user.username') + '/' + t('user.realName') + '/' + t('user.phone'),
    inputClass: 'w-64',
  },
  {
    key: 'status',
    label: t('user.status') + ':',
    type: 'select',
    inputClass: 'min-w-[140px]',
    options: [
      { label: t('dept.allStatus'), value: '' },
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
  },
])

function getListParams(): {
  org_id?: string
  dept_id?: string
  keyword?: string
  status?: 'active' | 'inactive'
} {
  const s = filterState.value.status as string
  const status = s === 'active' || s === 'inactive' ? s : undefined
  return {
    org_id: selectedOrgId.value ?? undefined,
    dept_id: selectedDeptId.value ?? undefined,
    keyword: (filterState.value.keyword as string)?.trim() || undefined,
    status,
  }
}

const { data, loading, pagination, handleTableChange, handleSearch, refresh } = useTableData({
  fetchFn: getUsers,
  defaultParams: {},
  immediate: false,
})

function onFilterSearch() {
  handleSearch(getListParams())
}

function onFilterReset() {
  filterState.value = { keyword: '', status: '' }
  handleSearch(getListParams())
}

watch(
  () => [selectedOrgId.value, selectedDeptId.value] as const,
  ([orgId, deptId]) => {
    if (orgId || deptId) {
      handleSearch(getListParams())
    } else {
      data.value = []
      pagination.current = 1
      pagination.total = 0
    }
  },
  { immediate: true }
)

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
    selectedOrgName.value = selectedOrgId.value ? orgIdToName.value.get(selectedOrgId.value) || '' : ''
  }
  selectedNodeKey.value = key
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
  (ProTableColumnExt<UserListItem> & {
    title: string
    dataIndex?: string
    key: string
    ellipsis?: boolean
    width?: number
    fixed?: 'right'
  })[]
>(() => [
  { title: t('user.username'), dataIndex: 'username', key: 'username', ellipsis: true, width: 120 },
  { title: t('user.realName'), dataIndex: 'real_name', key: 'real_name', width: 100, ellipsis: true },
  { title: t('user.phone'), dataIndex: 'phone', key: 'phone', width: 130 },
  { title: t('user.email'), dataIndex: 'email', key: 'email', width: 180, ellipsis: true },
  { title: t('user.org'), dataIndex: 'org_name', key: 'org_name', width: 160, ellipsis: true },
  { title: t('user.dept'), dataIndex: 'dept_name', key: 'dept_name', width: 100, ellipsis: true },
  { title: t('user.roles'), dataIndex: 'roles', key: 'roles', width: 180 },
  {
    title: t('user.status'),
    dataIndex: 'status',
    key: 'status',
    width: 90,
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
    align: 'right',
    cellType: 'actions',
    btns: actionBtns.value,
  },
])

const actionBtns = computed<ProTableActionBtn<UserListItem>[]>(() => [
  { text: t('common.edit'), handle: openEditForm },
  { text: t('user.roleEditor'), handle: openRoleEditor },
  { text: t('user.resetPassword'), handle: openResetPasswordConfirm },
  {
    text: t('common.delete'),
    handle: handleDelete,
    danger: true,
  },
])

const formOpen = ref(false)
const editingRecord = ref<UserListItem | null>(null)

function openCreateForm() {
  editingRecord.value = null
  formOpen.value = true
}

function openEditForm(record: UserListItem) {
  editingRecord.value = record
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
        message.success(t('common.success') + '，初始密码：' + res.initial_password)
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
