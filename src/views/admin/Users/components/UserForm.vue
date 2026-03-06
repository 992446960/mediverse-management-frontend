<template>
  <a-modal
    :open="open"
    :title="isEdit ? t('user.editUser') : t('user.addUser')"
    :confirm-loading="confirmLoading"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <a-form
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
        <a-input v-model:value="formState.real_name" :placeholder="t('user.realName')" :maxlength="50" show-count />
      </a-form-item>
      <a-form-item :label="t('user.phone')" name="phone">
        <a-input v-model:value="formState.phone" :placeholder="t('user.phone')" />
      </a-form-item>
      <a-form-item :label="t('user.email')" name="email">
        <a-input v-model:value="formState.email" :placeholder="t('user.email')" />
      </a-form-item>
      <a-form-item v-if="!isEdit" :label="t('user.roles')" name="roles">
        <a-checkbox-group v-model:value="formState.roles" class="flex flex-col gap-2">
          <a-checkbox value="sysadmin">{{ t('user.roleSysadmin') }}</a-checkbox>
          <a-checkbox value="org_admin">{{ t('user.roleOrgAdmin') }}</a-checkbox>
          <a-checkbox value="dept_admin">{{ t('user.roleDeptAdmin') }}</a-checkbox>
          <a-checkbox value="user">{{ t('user.roleUser') }}</a-checkbox>
        </a-checkbox-group>
      </a-form-item>
      <a-form-item v-if="isEdit" :label="t('user.dept')" name="dept_id">
        <a-select
          v-model:value="formState.dept_id"
          :placeholder="t('user.dept')"
          allow-clear
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="d in deptOptionsForEdit" :key="d.id" :value="d.id">
            {{ d.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import type { FormInstance } from 'ant-design-vue'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import type { UserListItem } from '@/types/user'
import type { CreateUserPayload, UpdateUserPayload } from '@/types/user'
import type { UserRole } from '@/types/auth'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'

const { t } = useI18n()
const authStore = useAuthStore()

interface Props {
  open: boolean
  initialRecord?: UserListItem | null
  /** 新增时默认机构 ID（来自左侧树选中） */
  defaultOrgId?: string
  /** 新增时默认科室 ID（来自左侧树选中） */
  defaultDeptId?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialRecord: null,
  defaultOrgId: '',
  defaultDeptId: '',
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [payload: CreateUserPayload | UpdateUserPayload]
}>()

const isEdit = computed(() => !!props.initialRecord?.id)

/** 科室管理员：机构+科室均锁定 */
const lockOrg = computed(() => authStore.isDeptAdmin)
const lockDept = computed(() => authStore.isDeptAdmin)

const formRef = ref<FormInstance>()
const confirmLoading = ref(false)
const orgOptions = ref<Organization[]>([])
const deptOptions = ref<Department[]>([])
const deptOptionsForEdit = ref<Department[]>([])

const formState = ref({
  username: '',
  real_name: '',
  org_id: '',
  dept_id: '',
  phone: '',
  email: '',
  roles: ['user'] as UserRole[],
})

const rules = computed(() => ({
  username: [
    { required: !isEdit.value, message: t('user.username') + ' ' + t('common.required'), trigger: 'blur' },
    { min: 4, max: 50, message: '4-50 位字母数字下划线', trigger: 'blur' },
  ],
  real_name: [
    { required: true, message: t('user.realName') + ' ' + t('common.required'), trigger: 'blur' },
    { max: 50, message: t('common.max100'), trigger: 'blur' },
  ],
  org_id: [{ required: !isEdit.value, message: t('user.org') + ' ' + t('common.required'), trigger: 'change' }],
  dept_id: [{ required: !isEdit.value, message: t('user.dept') + ' ' + t('common.required'), trigger: 'change' }],
  phone: [
    {
      validator: (_: unknown, val: string) => {
        const v = val?.trim()
        if (!v) return Promise.resolve()
        if (!/^1[3-9]\d{9}$/.test(v)) return Promise.reject(new Error(t('user.phoneInvalid')))
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      validator: (_: unknown, val: string) => {
        const v = val?.trim()
        if (!v) return Promise.resolve()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return Promise.reject(new Error(t('user.emailInvalid')))
        return Promise.resolve()
      },
      trigger: 'blur',
    },
  ],
  roles: [
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
  ],
}))

function filterOption(input: string, option: { children?: { [key: string]: unknown }[] }) {
  const label = option?.children?.[0]?.children as string | undefined
  return (label ?? '').toLowerCase().includes((input || '').toLowerCase())
}

async function loadOrgOptions() {
  const res = await getOrganizations({ page: 1, page_size: 500 })
  orgOptions.value = res.items
}

async function loadDeptOptions(orgId: string) {
  if (!orgId) {
    deptOptions.value = []
    return
  }
  const res = await getDepartments({ org_id: orgId, page: 1, page_size: 500 })
  deptOptions.value = res.items
}

function onOrgChange(orgId: string) {
  formState.value.dept_id = ''
  loadDeptOptions(orgId)
}

watch(
  () => [props.open, props.initialRecord, props.defaultOrgId, props.defaultDeptId] as const,
  async ([open, record, defaultOrgId, defaultDeptId]) => {
    if (open) {
      if (record) {
        formState.value = {
          username: record.username,
          real_name: record.real_name,
          org_id: record.org_id,
          dept_id: record.dept_id,
          phone: record.phone ?? '',
          email: record.email ?? '',
          roles: [...record.roles],
        }
        await loadDeptOptions(record.org_id)
        deptOptionsForEdit.value = deptOptions.value
      }
      else {
        const orgId = lockOrg.value ? (authStore.currentOrgId ?? '') : (defaultOrgId ?? '')
        const deptId = lockDept.value ? (authStore.currentDeptId ?? '') : (defaultDeptId ?? '')
        formState.value = {
          username: '',
          real_name: '',
          org_id: orgId,
          dept_id: deptId,
          phone: '',
          email: '',
          roles: ['user'],
        }
        if (authStore.isSysAdmin) {
          await loadOrgOptions()
          if (orgId) await loadDeptOptions(orgId)
        }
        else if (authStore.isOrgAdmin && authStore.currentOrgId) {
          await loadDeptOptions(authStore.currentOrgId)
          if (!formState.value.org_id) formState.value.org_id = authStore.currentOrgId
        }
        else if (authStore.isDeptAdmin) {
          if (authStore.currentOrgId) await loadDeptOptions(authStore.currentOrgId)
        }
        deptOptionsForEdit.value = []
      }
      formRef.value?.clearValidate()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  if (authStore.isSysAdmin) await loadOrgOptions()
})

async function handleOk() {
  try {
    await formRef.value?.validate()
    confirmLoading.value = true
    if (isEdit.value && props.initialRecord) {
      const payload: UpdateUserPayload = {
        real_name: formState.value.real_name.trim(),
        dept_id: formState.value.dept_id || undefined,
        phone: formState.value.phone?.trim() || undefined,
        email: formState.value.email?.trim() || undefined,
      }
      emit('submit', payload)
    }
    else {
      const payload: CreateUserPayload = {
        username: formState.value.username.trim(),
        real_name: formState.value.real_name.trim(),
        org_id: formState.value.org_id,
        dept_id: formState.value.dept_id,
        phone: formState.value.phone?.trim() || undefined,
        email: formState.value.email?.trim() || undefined,
        roles: formState.value.roles.length ? formState.value.roles : ['user'],
      }
      if (!payload.roles.includes('user')) payload.roles.push('user')
      emit('submit', payload)
    }
    emit('update:open', false)
  }
  catch {
    // validation failed
  }
  finally {
    confirmLoading.value = false
  }
}
</script>
