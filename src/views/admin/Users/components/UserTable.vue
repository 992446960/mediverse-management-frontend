<template>
  <a-table
    :columns="columns"
    :data-source="dataSource"
    :loading="loading"
    :pagination="false"
    row-key="id"
    :scroll="{ x: 1100 }"
  >
    <template #bodyCell="{ column, record }">
      <template v-if="column.key === 'roles'">
        <a-space :size="4" wrap>
          <a-tag v-for="r in record.roles" :key="r">
            {{ t(roleLabelKey(r)) }}
          </a-tag>
        </a-space>
      </template>
      <template v-else-if="column.key === 'status'">
        <a-badge
          :status="getStatusBadgeStatus(record.status)"
          :text="t(getStatusLabelKey(record.status))"
        />
      </template>
      <template v-else-if="column.key === 'actions'">
        <a-space wrap>
          <a-button type="link" size="small" @click="emit('edit', record)">
            {{ t('common.edit') }}
          </a-button>
          <a-button type="link" size="small" @click="emit('editRoles', record)">
            {{ t('user.roleEditor') }}
          </a-button>
          <a-button type="link" size="small" @click="emit('resetPassword', record)">
            {{ t('user.resetPassword') }}
          </a-button>
          <a-button type="link" size="small" danger @click="emit('delete', record)">
            {{ t('common.delete') }}
          </a-button>
        </a-space>
      </template>
    </template>
  </a-table>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getStatusColor, getStatusLabelKey } from '@/utils/status'
import type { UserListItem } from '@/types/user'
import type { UserRole } from '@/types/auth'

const { t } = useI18n()

interface Props {
  dataSource: UserListItem[]
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<{
  edit: [record: UserListItem]
  editRoles: [record: UserListItem]
  resetPassword: [record: UserListItem]
  delete: [record: UserListItem]
}>()

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  sysadmin: 'user.roleSysadmin',
  org_admin: 'user.roleOrgAdmin',
  dept_admin: 'user.roleDeptAdmin',
  user: 'user.roleUser',
}

function roleLabelKey(role: UserRole): string {
  return ROLE_LABEL_KEYS[role] ?? role
}

const columns = computed(() => [
  { title: t('user.username'), dataIndex: 'username', key: 'username', width: 120, ellipsis: true },
  {
    title: t('user.realName'),
    dataIndex: 'real_name',
    key: 'real_name',
    width: 100,
    ellipsis: true,
  },
  { title: t('user.phone'), dataIndex: 'phone', key: 'phone', width: 130 },
  { title: t('user.org'), dataIndex: 'org_name', key: 'org_name', width: 160, ellipsis: true },
  { title: t('user.dept'), dataIndex: 'dept_name', key: 'dept_name', width: 100, ellipsis: true },
  { title: t('user.roles'), dataIndex: 'roles', key: 'roles', width: 180 },
  { title: t('user.status'), dataIndex: 'status', key: 'status', width: 90 },
  { title: t('common.actions'), key: 'actions', fixed: 'right', width: 280 },
])

function getStatusBadgeStatus(status: 'active' | 'inactive'): 'success' | 'default' {
  const color = getStatusColor(status)
  return color === 'green' ? 'success' : 'default'
}
</script>
