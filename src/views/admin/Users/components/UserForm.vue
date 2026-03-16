<template>
  <a-modal
    :open="open"
    :title="viewOnly ? t('common.detail') : isEdit ? t('user.editUser') : t('user.addUser')"
    :confirm-loading="confirmLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    :footer="viewOnly ? null : undefined"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <template v-if="viewOnly && initialRecord">
      <a-descriptions :column="1" bordered size="small" class="user-form-detail">
        <a-descriptions-item :label="t('user.username')">
          {{ initialRecord.username }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.realName')">
          {{ initialRecord.real_name }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.phone')">
          {{ initialRecord.phone || '—' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.email')">
          {{ initialRecord.email || '—' }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.org')">
          {{ initialRecord.org_name }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.dept')">
          {{ initialRecord.dept_name }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.roles')">
          <a-space :size="4" wrap>
            <a-tag v-for="r in initialRecord.roles" :key="r">
              {{ t(ROLE_LABEL_KEYS[r] ?? r) }}
            </a-tag>
          </a-space>
        </a-descriptions-item>
        <a-descriptions-item :label="t('user.status')">
          {{ initialRecord.status === 'active' ? t('status.active') : t('status.inactive') }}
        </a-descriptions-item>
        <a-descriptions-item :label="t('common.createdAt')">
          {{ formatCreatedAt(initialRecord.created_at) }}
        </a-descriptions-item>
      </a-descriptions>
    </template>
    <a-form
      v-else
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      @submit.prevent="handleOk"
    >
      <a-form-item v-if="!isEdit" :label="t('user.org')" name="org_id">
        <a-select
          v-model:value="formState.org_id"
          :placeholder="t('user.org')"
          :disabled="lockOrg"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="onOrgChange"
        >
          <a-select-option v-for="o in orgOptions" :key="o.id" :value="o.id">
            {{ o.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-if="!isEdit" :label="t('user.dept')" name="dept_id">
        <a-select
          v-model:value="formState.dept_id"
          :placeholder="t('user.dept')"
          :disabled="lockDept"
          allow-clear
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="d in deptOptions" :key="d.id" :value="d.id">
            {{ d.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item :label="t('user.username')" name="username">
        <a-input
          v-model:value="formState.username"
          :placeholder="t('user.username')"
          :disabled="isEdit"
          :maxlength="50"
          show-count
        />
      </a-form-item>
      <a-form-item :label="t('user.realName')" name="real_name">
        <a-input
          v-model:value="formState.real_name"
          :placeholder="t('user.realName')"
          :maxlength="50"
          show-count
        />
      </a-form-item>
      <a-form-item v-if="!isEdit" :label="t('user.initialPasswordLabel')" name="password">
        <a-input-password
          v-model:value="formState.password"
          :placeholder="t('user.passwordOptionalPlaceholder')"
          autocomplete="new-password"
        />
      </a-form-item>
      <a-form-item v-if="!isEdit && showRoleField" :label="t('user.roles')" name="roles">
        <a-checkbox-group v-model:value="formState.roles" class="flex flex-col gap-2">
          <a-checkbox v-for="r in assignableRoles" :key="r" :value="r" :disabled="r === 'user'">
            {{ t(ROLE_LABEL_KEYS[r] ?? r) }}
          </a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item v-if="isEdit" :label="t('user.org')" name="org_id">
        <a-select
          v-model:value="formState.org_id"
          :placeholder="t('user.org')"
          :disabled="lockOrg"
          allow-clear
          show-search
          :filter-option="filterOption"
          @change="onOrgChange"
        >
          <a-select-option v-for="o in orgOptionsForEdit" :key="o.id" :value="o.id">
            {{ o.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-if="isEdit" :label="t('user.dept')" name="dept_id">
        <a-select
          v-model:value="formState.dept_id"
          :placeholder="t('user.dept')"
          :disabled="lockDept"
          allow-clear
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="d in deptOptionsForEdit" :key="d.id" :value="d.id">
            {{ d.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-if="isEdit && showRoleField" :label="t('user.roles')" name="roles">
        <a-checkbox-group v-model:value="formState.roles" class="flex flex-col gap-2">
          <a-checkbox v-for="r in assignableRoles" :key="r" :value="r" :disabled="r === 'user'">
            {{ t(ROLE_LABEL_KEYS[r] ?? r) }}
          </a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item :label="t('user.remark')" name="remark">
        <a-textarea
          v-model:value="formState.remark"
          :placeholder="t('user.remark')"
          :rows="2"
          :maxlength="500"
          show-count
        />
      </a-form-item>
      <a-form-item :label="t('user.status')" name="status">
        <a-radio-group v-model:value="formState.status">
          <a-radio value="active">{{ t('status.active') }}</a-radio>
          <a-radio value="inactive">{{ t('status.inactive') }}</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
    <template v-if="viewOnly" #footer>
      <a-button @click="emit('update:open', false)">{{ t('common.close') }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import { useAuthStore } from '@/stores/auth'
import type { FormInstance } from 'ant-design-vue'
import { useOrgDeptFromTree } from '@/composables/useOrgDeptFromTree'
import type { UserListItem } from '@/types/user'
import type { CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'

const { t } = useI18n()
const authStore = useAuthStore()
const { getOrgOptions, getDeptOptions } = useOrgDeptFromTree()

const ROLE_LABEL_KEYS: Record<UserRole, string> = {
  sysadmin: 'user.roleSysadmin',
  org_admin: 'user.roleOrgAdmin',
  dept_admin: 'user.roleDeptAdmin',
  user: 'user.roleUser',
}

function formatCreatedAt(iso: string): string {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
}

interface Props {
  open: boolean
  initialRecord?: UserListItem | null
  viewOnly?: boolean
  defaultOrgId?: string
  defaultDeptId?: string
  /** 当前用户可分配的角色（科室管理员不展示角色项，不传则仅 user） */
  assignableRoles?: UserRole[]
}

const props = withDefaults(defineProps<Props>(), {
  initialRecord: null,
  viewOnly: false,
  defaultOrgId: '',
  defaultDeptId: '',
  assignableRoles: () => ['user'],
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: CreateUserPayload | UpdateUserPayload]
}>()

const isEdit = computed(() => !!props.initialRecord?.id)

/** 科室管理员：机构+科室均锁定；机构管理员：仅机构锁定；系统管理员无限制 */
const lockOrg = computed(() => authStore.isDeptAdmin || authStore.isOrgAdmin)
const lockDept = computed(() => authStore.isDeptAdmin)
const showRoleField = computed(() => !authStore.isDeptAdmin)

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)
const orgOptions = ref<Organization[]>([])
const orgOptionsForEdit = ref<Organization[]>([])
const deptOptions = ref<Department[]>([])
const deptOptionsForEdit = ref<Department[]>([])

const formState = ref({
  username: '',
  real_name: '',
  password: '',
  org_id: '',
  dept_id: '',
  roles: ['user'] as UserRole[],
  remark: '',
  status: 'active' as 'active' | 'inactive',
})

const rules = computed(() => ({
  username: [
    {
      required: !isEdit.value,
      message: t('user.username') + ' ' + t('common.required'),
      trigger: 'blur',
    },
    { min: 4, max: 50, message: t('user.usernameLength'), trigger: 'blur' },
  ],
  real_name: [
    { required: true, message: t('user.realName') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 50, message: t('common.max100'), trigger: 'blur' },
  ],
  roles: showRoleField.value
    ? [
        {
          required: !isEdit.value,
          type: 'array' as const,
          min: 1,
          message: t('user.roles') + ' ' + t('common.required'),
          trigger: 'change',
        },
        {
          validator: (_: unknown, val: UserRole[]) => {
            if (isEdit.value) return Promise.resolve()
            if (val?.includes('user')) return Promise.resolve()
            return Promise.reject(new Error(t('user.roleUser') + ' ' + t('common.required')))
          },
          trigger: 'change',
        },
      ]
    : [],
}))

function filterOption(input: string, option: { children?: { [key: string]: unknown }[] }) {
  const label = option?.children?.[0]?.children as string | undefined
  return (label ?? '').toLowerCase().includes((input || '').toLowerCase())
}

async function loadOrgOptions() {
  orgOptions.value = await getOrgOptions()
}

async function loadDeptOptions(orgId: string) {
  deptOptions.value = orgId ? await getDeptOptions(orgId) : []
}

async function onOrgChange(orgId: string) {
  formState.value.dept_id = ''
  await loadDeptOptions(orgId)
  if (isEdit.value) deptOptionsForEdit.value = deptOptions.value
}

async function loadOrgOptionsForEdit() {
  orgOptionsForEdit.value = await getOrgOptions()
}

watch(
  () => [props.open, props.initialRecord, props.defaultOrgId, props.defaultDeptId] as const,
  async ([open, record, defaultOrgId, defaultDeptId]) => {
    if (open) {
      if (record) {
        const orgId = authStore.isDeptAdmin
          ? (authStore.currentOrgId ?? record.org_id)
          : authStore.isOrgAdmin
            ? (authStore.currentOrgId ?? record.org_id)
            : record.org_id
        const deptId = authStore.isDeptAdmin
          ? (authStore.currentDeptId ?? record.dept_id)
          : record.dept_id
        const roles = record.roles?.includes('user')
          ? [...record.roles]
          : ['user', ...(record.roles || [])]
        formState.value = {
          username: record.username,
          real_name: record.real_name,
          password: '',
          org_id: orgId,
          dept_id: deptId,
          roles,
          remark: record.remark ?? '',
          status: record.status,
        }
        await loadOrgOptionsForEdit()
        await loadDeptOptions(orgId)
        if (authStore.isDeptAdmin && authStore.currentDeptId) {
          deptOptionsForEdit.value = deptOptions.value.filter(
            (d) => d.id === authStore.currentDeptId
          )
        } else {
          deptOptionsForEdit.value = deptOptions.value
        }
      } else {
        const orgId = lockOrg.value ? (authStore.currentOrgId ?? '') : (defaultOrgId ?? '')
        const deptId = lockDept.value ? (authStore.currentDeptId ?? '') : (defaultDeptId ?? '')
        formState.value = {
          username: '',
          real_name: '',
          password: '',
          org_id: orgId,
          dept_id: deptId,
          roles: ['user'],
          remark: '',
          status: 'active',
        }
        await loadOrgOptions()
        if (orgId) await loadDeptOptions(orgId)
        if (authStore.isOrgAdmin && !formState.value.org_id)
          formState.value.org_id = authStore.currentOrgId ?? ''
        if (authStore.isDeptAdmin && authStore.currentDeptId) {
          deptOptions.value = deptOptions.value.filter((d) => d.id === authStore.currentDeptId)
        }
        deptOptionsForEdit.value = []
        orgOptionsForEdit.value = []
      }
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

async function handleOk() {
  if (props.viewOnly) {
    emit('update:open', false)
    return
  }
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    if (isEdit.value && props.initialRecord) {
      const payload: UpdateUserPayload = {
        real_name: formState.value.real_name.trim(),
        org_id: formState.value.org_id || undefined,
        dept_id: formState.value.dept_id || undefined,
        roles:
          showRoleField.value && formState.value.roles.length ? formState.value.roles : undefined,
        remark: formState.value.remark?.trim() || undefined,
        status: formState.value.status,
      }
      emit('submit', payload)
    } else {
      const roles: UserRole[] =
        showRoleField.value && formState.value.roles.length ? formState.value.roles : ['user']
      if (!roles.includes('user')) roles.push('user')
      const payload: CreateUserPayload = {
        username: formState.value.username.trim(),
        real_name: formState.value.real_name.trim(),
        password: formState.value.password?.trim() || undefined,
        org_id: formState.value.org_id || undefined,
        dept_id: formState.value.dept_id || undefined,
        roles,
        remark: formState.value.remark?.trim() || undefined,
        status: formState.value.status,
      }
      emit('submit', payload)
    }
    emit('update:open', false)
  } catch {
    // validation failed
  } finally {
    confirmLoading.value = false
  }
}
</script>
