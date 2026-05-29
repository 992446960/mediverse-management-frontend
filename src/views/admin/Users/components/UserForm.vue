<template>
  <a-modal
    :open="open"
    :title="viewOnly ? t('common.detail') : isEdit ? t('user.editUser') : t('user.addUser')"
    width="760px"
    :confirm-loading="confirmLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <template v-if="viewOnly && initialRecord">
      <div class="user-form-detail">
        <IdentitySummary
          :name="detailSummaryName"
          :avatar-url="detailAvatarUrl"
          :scope="detailScope"
          :status-text="detailStatusText"
          :status-color="detailStatusColor"
          :tags="detailRoleLabels"
        />

        <section class="user-form-detail__section">
          <SectionTitle :title="t('avatar.wizard.basicInfo')" />
          <ReadonlyDescription :items="detailBasicItems" />
        </section>

        <section class="user-form-detail__section">
          <SectionTitle :title="organizationSectionTitle" />
          <ReadonlyDescription :items="detailOrganizationItems" />
        </section>

        <section class="user-form-detail__section">
          <SectionTitle :title="detailAccountSectionTitle" />
          <ReadonlyDescription :items="detailAccountItems" />
        </section>
      </div>
    </template>
    <a-form
      v-else
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      @submit.prevent="handleOk"
    >
      <div class="user-form-layout">
        <section v-if="!isEdit" class="user-form-section">
          <SectionTitle :title="organizationSectionTitle" />
          <div class="user-form-section__body">
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.org')" name="org_id">
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
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.dept')" name="dept_id">
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
              </a-col>
            </a-row>
          </div>
        </section>

        <section class="user-form-section">
          <SectionTitle :title="t('avatar.wizard.basicInfo')" />
          <div class="user-form-section__body">
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.username')" name="username">
                  <a-input
                    v-model:value="formState.username"
                    :placeholder="t('user.username')"
                    :disabled="isEdit"
                    :maxlength="50"
                    show-count
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.realName')" name="real_name">
                  <a-input
                    v-model:value="formState.real_name"
                    :placeholder="t('user.realName')"
                    :maxlength="50"
                    show-count
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.phone')" name="phone">
                  <a-input
                    v-model:value="formState.phone"
                    :placeholder="t('profile.phonePlaceholder')"
                    :maxlength="20"
                    addon-before="+86"
                  />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.email')" name="email">
                  <a-input
                    v-model:value="formState.email"
                    :placeholder="t('profile.emailPlaceholder')"
                    type="text"
                    autocomplete="email"
                  />
                </a-form-item>
              </a-col>
              <a-col v-if="!isEdit" :xs="24" :sm="12">
                <a-form-item :label="t('user.initialPasswordLabel')" name="password">
                  <a-input-password
                    v-model:value="formState.password"
                    :placeholder="t('user.passwordOptionalPlaceholder')"
                    autocomplete="new-password"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </section>

        <section v-if="isEdit" class="user-form-section">
          <SectionTitle :title="organizationSectionTitle" />
          <div class="user-form-section__body">
            <a-row :gutter="[16, 16]">
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.org')" name="org_id">
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
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.dept')" name="dept_id">
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
              </a-col>
            </a-row>
          </div>
        </section>

        <section class="user-form-section">
          <SectionTitle :title="accessSectionTitle" />
          <div class="user-form-section__body">
            <a-row :gutter="[16, 16]">
              <a-col v-if="showRoleField" :span="24">
                <a-form-item :label="t('user.roles')" name="roles">
                  <a-checkbox-group v-model:value="formState.roles" class="user-form-roles-wrap">
                    <a-checkbox
                      v-for="r in assignableRoles"
                      :key="r"
                      :value="r"
                      :disabled="r === 'user'"
                    >
                      {{ t(ROLE_LABEL_KEYS[r] ?? r) }}
                    </a-checkbox>
                  </a-checkbox-group>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12">
                <a-form-item :label="t('user.status')" name="status">
                  <a-radio-group
                    v-model:value="formState.status"
                    size="small"
                    class="user-form-status-group"
                  >
                    <a-radio-button value="active">{{ t('status.active') }}</a-radio-button>
                    <a-radio-button value="inactive">{{ t('status.inactive') }}</a-radio-button>
                  </a-radio-group>
                </a-form-item>
              </a-col>
              <a-col :span="24">
                <a-form-item :label="t('user.remark')" name="remark">
                  <a-textarea
                    v-model:value="formState.remark"
                    :placeholder="t('user.remark')"
                    :rows="2"
                    :maxlength="500"
                    show-count
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </div>
        </section>
      </div>
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
import { toAbsoluteFileUrl } from '@/api/upload'
import IdentitySummary from '@/components/IdentitySummary/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
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

interface ReadonlyDescriptionItem {
  label: string
  value?: string | number | string[] | null
  span?: 1 | 2
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
const organizationSectionTitle = computed(() => `${t('user.org')} / ${t('user.dept')}`)
const detailAccountSectionTitle = computed(() => `${t('user.roles')} / ${t('user.status')}`)
const accessSectionTitle = computed(() =>
  showRoleField.value ? t('user.roles') : t('user.status')
)

const detailRoleLabels = computed(() =>
  (props.initialRecord?.roles ?? []).map((role) => t(ROLE_LABEL_KEYS[role] ?? role))
)
const detailSummaryName = computed(
  () => props.initialRecord?.real_name || props.initialRecord?.username || '—'
)
const detailAvatarUrl = computed(() =>
  props.initialRecord?.avatar_url ? toAbsoluteFileUrl(props.initialRecord.avatar_url) : ''
)
const detailScope = computed(() =>
  [props.initialRecord?.org_name, props.initialRecord?.dept_name].filter(Boolean).join(' / ')
)
const detailStatusText = computed(() =>
  props.initialRecord?.status === 'active' ? t('status.active') : t('status.inactive')
)
const detailStatusColor = computed(() =>
  props.initialRecord?.status === 'active' ? 'success' : 'error'
)
const detailBasicItems = computed<ReadonlyDescriptionItem[]>(() => [
  { label: t('user.username'), value: props.initialRecord?.username },
  { label: t('user.realName'), value: props.initialRecord?.real_name },
  { label: t('user.phone'), value: props.initialRecord?.phone },
  { label: t('user.email'), value: props.initialRecord?.email },
])
const detailOrganizationItems = computed<ReadonlyDescriptionItem[]>(() => [
  { label: t('user.org'), value: props.initialRecord?.org_name || props.initialRecord?.org_id },
  { label: t('user.dept'), value: props.initialRecord?.dept_name || props.initialRecord?.dept_id },
])
const detailAccountItems = computed<ReadonlyDescriptionItem[]>(() => [
  { label: t('user.roles'), value: detailRoleLabels.value, span: 2 },
  { label: t('user.status'), value: detailStatusText.value },
  {
    label: t('common.createdAt'),
    value: props.initialRecord?.created_at ? formatCreatedAt(props.initialRecord.created_at) : '',
  },
])

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
  phone: '',
  email: '',
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
        const recordRoles = (record.roles ?? []) as UserRole[]
        const roles: UserRole[] = recordRoles.includes('user')
          ? [...recordRoles]
          : ['user', ...recordRoles]
        formState.value = {
          username: record.username,
          real_name: record.real_name,
          password: '',
          phone: record.phone ?? '',
          email: record.email ?? '',
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
          phone: '',
          email: '',
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
        phone: formState.value.phone?.trim() || undefined,
        email: formState.value.email?.trim() || undefined,
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
        phone: formState.value.phone?.trim() || undefined,
        email: formState.value.email?.trim() || undefined,
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

<style scoped lang="scss">
.user-form-detail,
.user-form-layout {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.user-form-detail__section,
.user-form-section {
  min-width: 0;
}

.user-form-detail__section :deep(.section-title),
.user-form-section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.user-form-section__body {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.user-form-section__body :deep(.ant-form-item:last-child) {
  margin-bottom: 0;
}

.user-form-roles-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.user-form-roles-wrap :deep(.ant-checkbox-wrapper) {
  margin-inline-start: 0;
  padding: 4px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-bg-container);
  transition:
    border-color var(--transition-fast),
    background var(--transition-fast),
    color var(--transition-fast);
}

.user-form-roles-wrap :deep(.ant-checkbox-wrapper:hover),
.user-form-roles-wrap :deep(.ant-checkbox-wrapper-checked) {
  border-color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 8%, var(--color-bg-container));
  color: var(--color-primary);
}

.user-form-roles-wrap :deep(.ant-checkbox) {
  margin-inline-end: 6px;
}

.user-form-status-group {
  display: inline-flex;
  max-width: 100%;
}

.user-form-status-group :deep(.ant-radio-button-wrapper) {
  min-width: 64px;
  text-align: center;
}
</style>
