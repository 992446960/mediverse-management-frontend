<template>
  <div class="step-scope w-full space-y-6">
    <a-form ref="formRef" layout="vertical" :model="localForm" class="step-scope-form">
      <a-form-item name="org_id" :rules="orgRules">
        <template #label>
          <span class="step-scope-label">
            {{ t('avatar.org') }}
          </span>
        </template>
        <a-select
          v-model:value="localForm.org_id"
          :placeholder="t('avatar.wizard.placeholderOrg')"
          allow-clear
          show-search
          :filter-option="filterOption"
          :options="orgOptions"
          class="w-full step-scope-select"
          @change="onOrgChange"
        />
      </a-form-item>
      <template v-if="showDept">
        <a-form-item name="dept_id" :rules="deptRules">
          <template #label>
            <span class="step-scope-label">
              {{ t('avatar.dept') }}
            </span>
          </template>
          <a-select
            v-model:value="localForm.dept_id"
            :placeholder="t('avatar.wizard.placeholderDept')"
            allow-clear
            show-search
            :filter-option="filterOption"
            :options="deptOptions"
            :disabled="!localForm.org_id"
            class="w-full step-scope-select"
            @change="onDeptChange"
          />
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
          <a-select
            v-model:value="localForm.user_id"
            :placeholder="t('avatar.wizard.placeholderUser')"
            allow-clear
            show-search
            :filter-option="filterOptionUser"
            :options="userOptions"
            :disabled="!localForm.dept_id"
            class="w-full step-scope-select"
          />
        </a-form-item>
      </template>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { FormInstance } from 'ant-design-vue'
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
    getDepartments({ org_id: localForm.value.org_id, page: 1, page_size: 200 }).then((res) => {
      deptOptions.value = res.items.map((d: Department) => ({ label: d.name, value: d.id }))
    })
  }
}

function onDeptChange() {
  localForm.value.user_id = undefined
  userOptions.value = []
  if (localForm.value.dept_id && localForm.value.org_id) {
    getUsers({
      org_id: localForm.value.org_id,
      dept_id: localForm.value.dept_id,
      page: 1,
      page_size: 200,
    }).then((res) => {
      userOptions.value = res.items.map((u: UserListItem) => ({ label: u.real_name, value: u.id }))
    })
  }
}

onMounted(() => {
  getOrganizations({ page: 1, page_size: 200 }).then((res) => {
    orgOptions.value = res.items.map((o: Organization) => ({ label: o.name, value: o.id }))
  })
  if (props.modelValue.org_id) {
    getDepartments({ org_id: props.modelValue.org_id, page: 1, page_size: 200 }).then((res) => {
      deptOptions.value = res.items.map((d: Department) => ({ label: d.name, value: d.id }))
    })
  }
  if (props.modelValue.dept_id && props.modelValue.org_id) {
    getUsers({
      org_id: props.modelValue.org_id,
      dept_id: props.modelValue.dept_id,
      page: 1,
      page_size: 200,
    }).then((res) => {
      userOptions.value = res.items.map((u: UserListItem) => ({ label: u.real_name, value: u.id }))
    })
  }
})

function filterOptionUser(input: string, option: { label?: string; value?: string }) {
  return (option.label ?? '').toLowerCase().includes((input || '').toLowerCase())
}

defineExpose({
  validate: () => formRef.value?.validate(),
})
</script>

<style scoped>
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
/* 下拉框：圆角、内边距、边框、focus 环 */
.step-scope-select :deep(.ant-select-selector) {
  border-radius: 0.5rem !important;
  border: 1px solid #e5e7eb !important;
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
  border-color: #0ea5e9 !important;
}
.step-scope-select.ant-select-focused :deep(.ant-select-selector) {
  border-color: #0ea5e9 !important;
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2) !important;
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
</style>
