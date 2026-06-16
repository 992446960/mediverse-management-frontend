<template>
  <div class="step-scope w-full space-y-6">
    <a-form ref="formRef" layout="vertical" :model="localForm" class="step-scope-form">
      <a-form-item name="org_id" :rules="orgRules">
        <template #label>
          <span class="step-scope-label">
            {{ t('avatar.org') }}
          </span>
        </template>
        <div class="step-scope-select-field">
          <BankOutlined class="step-scope-select-field__icon" />
          <a-select
            v-model:value="localForm.org_id"
            :placeholder="t('avatar.wizard.placeholderOrg')"
            allow-clear
            show-search
            :filter-option="filterOption"
            :options="orgOptions"
            :loading="orgLoading"
            class="w-full step-scope-select"
            @change="onOrgChange"
          />
        </div>
      </a-form-item>
      <template v-if="showDept">
        <a-form-item name="dept_id" :rules="deptRules">
          <template #label>
            <span class="step-scope-label">
              {{ t('avatar.dept') }}
            </span>
          </template>
          <div class="step-scope-select-field">
            <ApartmentOutlined class="step-scope-select-field__icon" />
            <a-select
              v-model:value="localForm.dept_id"
              :placeholder="t('avatar.wizard.placeholderDept')"
              allow-clear
              show-search
              :filter-option="filterOption"
              :options="deptOptions"
              :loading="deptLoading"
              :disabled="!localForm.org_id"
              class="w-full step-scope-select"
              @change="onDeptChange"
            />
          </div>
        </a-form-item>
      </template>
      <template v-if="showUser">
        <a-form-item name="user_id" :rules="userRules">
          <template #label>
            <span class="step-scope-label">
              {{ t('avatar.wizard.selectUser') }}
              <span class="text-gray-400 dark:text-gray-500 font-normal ml-1">{{
                t('avatar.wizard.expertOnlyRequired')
              }}</span>
            </span>
          </template>
          <div class="step-scope-select-field">
            <UserOutlined class="step-scope-select-field__icon" />
            <a-select
              v-model:value="localForm.user_id"
              :placeholder="t('avatar.wizard.placeholderUser')"
              allow-clear
              show-search
              :filter-option="filterOptionUser"
              :options="userOptions"
              :loading="userLoading"
              :disabled="!localForm.dept_id"
              class="w-full step-scope-select"
            />
          </div>
        </a-form-item>
      </template>
    </a-form>

    <section v-if="scopePreviewItems.length" class="step-scope-preview">
      <h3 class="step-scope-preview__title">{{ t('avatar.wizard.scopePreviewTitle') }}</h3>
      <div class="step-scope-preview__grid">
        <div v-for="item in scopePreviewItems" :key="item.kind" class="step-scope-preview__item">
          <span class="step-scope-preview__icon" aria-hidden="true">
            <component :is="item.icon" />
          </span>
          <span class="step-scope-preview__content">
            <span class="step-scope-preview__label">{{ item.label }}</span>
            <span class="step-scope-preview__value">{{ item.value }}</span>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
import { ApartmentOutlined, BankOutlined, UserOutlined } from '@ant-design/icons-vue'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import { getUsers } from '@/api/users'
import type { AvatarWizardForm } from '@/types/avatar'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'
import type { UserListItem } from '@/types/user'

const { t } = useI18n()

const formRef = ref<FormInstance | null>(null)

interface Props {
  modelValue: AvatarWizardForm
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: AvatarWizardForm]
}>()

/** 从父同步到 localForm 时跳过 emit，避免与 StepInfo 等字段联动时形成递归更新 */
const syncingFromParent = ref(false)

const localForm = ref<Pick<AvatarWizardForm, 'org_id' | 'dept_id' | 'user_id'>>({
  org_id: props.modelValue.org_id,
  dept_id: props.modelValue.dept_id,
  user_id: props.modelValue.user_id,
})

watch(
  () => props.modelValue,
  (val) => {
    syncingFromParent.value = true
    try {
      localForm.value = {
        org_id: val.org_id,
        dept_id: val.dept_id,
        user_id: val.user_id,
      }
    } finally {
      nextTick(() => {
        syncingFromParent.value = false
      })
    }
  },
  { deep: true }
)

watch(
  localForm,
  (val) => {
    if (syncingFromParent.value) return
    emit('update:modelValue', {
      ...props.modelValue,
      org_id: val.org_id,
      dept_id: val.dept_id,
      user_id: val.user_id,
    })
  },
  { deep: true }
)

const showDept = computed(
  () => props.modelValue.type === 'specialist' || props.modelValue.type === 'expert'
)
const showUser = computed(() => props.modelValue.type === 'expert')

const orgOptions = ref<{ label: string; value: string }[]>([])
const deptOptions = ref<{ label: string; value: string }[]>([])
const userOptions = ref<{ label: string; value: string }[]>([])
const orgLoading = ref(false)
const deptLoading = ref(false)
const userLoading = ref(false)

const orgRules = computed(() => [
  { required: true, message: t('common.required'), trigger: 'change' },
])
const deptRules = computed(() =>
  showDept.value ? [{ required: true, message: t('common.required'), trigger: 'change' }] : []
)
const userRules = computed(() =>
  showUser.value ? [{ required: true, message: t('common.required'), trigger: 'change' }] : []
)

function filterOption(input: string, option: { label?: string; value?: string }) {
  return (option.label ?? '').toLowerCase().includes((input || '').toLowerCase())
}

function onOrgChange() {
  localForm.value.dept_id = undefined
  localForm.value.user_id = undefined
  deptOptions.value = []
  userOptions.value = []
  if (localForm.value.org_id) {
    loadDepartments(localForm.value.org_id)
  }
}

function onDeptChange() {
  localForm.value.user_id = undefined
  userOptions.value = []
  if (localForm.value.dept_id && localForm.value.org_id) {
    loadUsers(localForm.value.org_id, localForm.value.dept_id)
  }
}

async function loadOrganizations() {
  orgLoading.value = true
  try {
    const res = await getOrganizations({ page: 1, page_size: 200 })
    orgOptions.value = res.items.map((o: Organization) => ({ label: o.name, value: o.id }))
  } finally {
    orgLoading.value = false
  }
}

async function loadDepartments(orgId: string) {
  deptLoading.value = true
  try {
    const res = await getDepartments({ org_id: orgId, page: 1, page_size: 200 })
    deptOptions.value = res.items.map((d: Department) => ({ label: d.name, value: d.id }))
  } finally {
    deptLoading.value = false
  }
}

async function loadUsers(orgId: string, deptId: string) {
  userLoading.value = true
  try {
    const res = await getUsers({
      org_id: orgId,
      dept_id: deptId,
      page: 1,
      page_size: 200,
    })
    userOptions.value = res.items.map((u: UserListItem) => ({ label: u.real_name, value: u.id }))
  } finally {
    userLoading.value = false
  }
}

onMounted(() => {
  loadOrganizations()
  if (props.modelValue.org_id) {
    loadDepartments(props.modelValue.org_id)
  }
  if (props.modelValue.dept_id && props.modelValue.org_id) {
    loadUsers(props.modelValue.org_id, props.modelValue.dept_id)
  }
})

function filterOptionUser(input: string, option: { label?: string; value?: string }) {
  return (option.label ?? '').toLowerCase().includes((input || '').toLowerCase())
}

function findLabel(options: { label: string; value: string }[], value?: string) {
  if (!value) return ''
  return options.find((option) => option.value === value)?.label ?? ''
}

const scopePreviewItems = computed(() => {
  const items: { kind: string; label: string; value: string; icon: Component }[] = []
  const orgName = findLabel(orgOptions.value, localForm.value.org_id)
  const deptName = findLabel(deptOptions.value, localForm.value.dept_id)
  const userName = findLabel(userOptions.value, localForm.value.user_id)
  if (orgName)
    items.push({ kind: 'org', label: t('avatar.org'), value: orgName, icon: BankOutlined })
  if (deptName)
    items.push({ kind: 'dept', label: t('avatar.dept'), value: deptName, icon: ApartmentOutlined })
  if (userName)
    items.push({ kind: 'user', label: t('avatar.bindUser'), value: userName, icon: UserOutlined })
  return items
})

defineExpose({
  validate: () => formRef.value?.validate(),
})
</script>

<style scoped lang="scss">
.step-scope-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-color-text, #374151);
}
/* 表单项间距与参考一致 */
.step-scope-form :deep(.ant-form-item) {
  margin-bottom: 0;
}
.step-scope-form :deep(.ant-form-item) + .ant-form-item {
  margin-top: 24px;
}
.step-scope-select-field {
  position: relative;
  min-width: 0;
}
.step-scope-select-field__icon {
  position: absolute;
  z-index: 2;
  top: 50%;
  left: 18px;
  color: var(--color-primary);
  font-size: 1.25rem;
  pointer-events: none;
  transform: translateY(-50%);
}
/* 下拉框：圆角、内边距、边框、focus 环 */
.step-scope-select :deep(.ant-select-selector) {
  border-radius: 0.5rem !important;
  border: 1px solid #e5e7eb !important;
  padding-left: 44px !important;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  background-color: #fff !important;
}
/* 占位符：确保文案可见，避免显示为横线或透明 */
.step-scope-select :deep(.ant-select-selection-placeholder) {
  color: #9ca3af !important;
  opacity: 1 !important;
  font-size: 14px !important;
}
.step-scope-select :deep(.ant-select-selection-search-input) {
  font-size: 14px !important;
}
/* show-search 时内部 input 的占位符也需可见 */
.step-scope-select :deep(.ant-select-selection-search-input::placeholder) {
  color: #9ca3af !important;
  opacity: 1 !important;
}
.step-scope-select:not(.ant-select-disabled):deep(.ant-select-selector:hover) {
  border-color: var(--color-primary) !important;
}
.step-scope-select.ant-select-focused :deep(.ant-select-selector) {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 20%, transparent) !important;
}
.dark .step-scope-select :deep(.ant-select-selector) {
  border-color: #374151 !important;
  background-color: #1f2937 !important;
}
.dark .step-scope-select :deep(.ant-select-selection-placeholder) {
  color: #9ca3af !important;
}
/* 必填/校验提示紧贴对应表单项下方 */
.step-scope :deep(.ant-form-item-control-input-content) {
  display: block;
}
.step-scope :deep(.ant-form-item-explain) {
  position: relative;
  width: 100%;
}
/* 禁用态仍保持可见 */
.step-scope :deep(.step-scope-select.ant-select-disabled .ant-select-selector) {
  color: var(--ant-color-text-quaternary, #8c8c8c);
}

.step-scope-preview {
  margin-top: 20px;
  padding: 14px 16px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
  border-radius: var(--radius-base);
  background: color-mix(in srgb, var(--color-primary) 4%, var(--color-bg-container));
}

.step-scope-preview__title {
  margin: 0 0 12px;
  color: var(--color-text-base);
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.5;
}

.step-scope-preview__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
}

.step-scope-preview__item {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 40px;
  gap: 12px;
  padding: 0 18px;
  border-right: 1px solid var(--color-border-secondary);
}

.step-scope-preview__item:first-child {
  padding-left: 0;
}

.step-scope-preview__item:last-child {
  padding-right: 0;
  border-right: 0;
}

.step-scope-preview__icon {
  display: inline-flex;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
  border-radius: var(--radius-base);
  color: var(--color-primary);
  background: var(--color-bg-container);
  font-size: 1.25rem;
}

.step-scope-preview__content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.step-scope-preview__label {
  color: var(--color-text-secondary);
  font-size: 0.75rem;
}

.step-scope-preview__value {
  overflow: hidden;
  color: var(--color-text-base);
  font-size: 0.875rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .step-scope-preview__grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }

  .step-scope-preview__item {
    padding: 0;
    border-right: 0;
  }
}
</style>
