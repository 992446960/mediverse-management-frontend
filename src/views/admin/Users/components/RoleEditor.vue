<template>
  <a-modal
    :open="open"
    :title="t('user.roleEditor')"
    :confirm-loading="confirmLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    @ok="handleOk"
    @cancel="emit('update:open', false)"
  >
    <a-form layout="vertical">
      <a-form-item :label="t('user.roles')">
        <a-checkbox-group v-model:value="localRoles" class="flex flex-col gap-2">
          <a-checkbox
            v-for="opt in ROLE_OPTIONS"
            :key="opt.value"
            :value="opt.value"
            class="cursor-pointer"
          >
            {{ t(opt.labelKey) }}
          </a-checkbox>
        </a-checkbox-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import type { UserRole } from '@/types/auth'

const { t } = useI18n()

const ROLE_OPTIONS: { value: UserRole; labelKey: string }[] = [
  { value: 'sysadmin', labelKey: 'user.roleSysadmin' },
  { value: 'org_admin', labelKey: 'user.roleOrgAdmin' },
  { value: 'dept_admin', labelKey: 'user.roleDeptAdmin' },
  { value: 'user', labelKey: 'user.roleUser' },
]

interface Props {
  open: boolean
  roles: UserRole[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [roles: UserRole[]]
}>()

const confirmLoading = ref(false)
const localRoles = ref<UserRole[]>([])

watch(
  () => [props.open, props.roles] as const,
  ([open, roles]) => {
    if (open) {
      localRoles.value = [...(roles ?? [])]
    }
  },
  { immediate: true }
)

function handleOk() {
  if (localRoles.value.length === 0) {
    message.warning(t('user.roleAtLeastOne'))
    return
  }
  confirmLoading.value = true
  emit('submit', [...localRoles.value])
  emit('update:open', false)
  confirmLoading.value = false
}
</script>
