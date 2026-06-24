<template>
  <a-modal
    :open="open"
    :title="modalTitle"
    :width="480"
    :confirm-loading="confirmLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    centered
    :ok-button-props="okButtonProps"
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="space-y-3 py-2">
      <p class="m-0 text-(--color-text-base)">{{ confirmText }}</p>
      <template v-if="action === 'rejected'">
        <a-textarea
          v-model:value="reasonValue"
          :placeholder="t('knowledge.card.auditRejectReasonPlaceholder')"
          :maxlength="2000"
          show-count
          :rows="4"
          :status="showError ? 'error' : undefined"
        />
        <p v-if="showError" class="m-0 text-red-500 text-sm">
          {{ t('knowledge.card.auditRejectReasonRequired') }}
        </p>
      </template>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    action: 'approved' | 'rejected'
    confirmLoading?: boolean
    batchCount?: number
  }>(),
  {
    confirmLoading: false,
    batchCount: 0,
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [reason?: string]
}>()

const reasonValue = ref('')
const showError = ref(false)
const isBatchAudit = computed(() => props.batchCount > 0)

const modalTitle = computed(() =>
  props.action === 'approved'
    ? t(isBatchAudit.value ? 'knowledge.card.batchAuditApprove' : 'knowledge.card.auditApprove')
    : t(isBatchAudit.value ? 'knowledge.card.batchAuditReject' : 'knowledge.card.auditReject')
)

const confirmText = computed(() =>
  props.action === 'approved'
    ? t(
        isBatchAudit.value
          ? 'knowledge.card.batchAuditApproveConfirm'
          : 'knowledge.card.auditApproveConfirm',
        { count: props.batchCount }
      )
    : t(
        isBatchAudit.value
          ? 'knowledge.card.batchAuditRejectConfirm'
          : 'knowledge.card.auditRejectConfirm',
        { count: props.batchCount }
      )
)

const okButtonProps = computed(() => (props.action === 'rejected' ? { danger: true } : {}))

watch(
  () => props.open,
  (open) => {
    if (open) {
      reasonValue.value = ''
      showError.value = false
    }
  }
)

function handleCancel() {
  emit('update:open', false)
}

function handleConfirm() {
  if (props.action === 'rejected') {
    const trimmed = reasonValue.value.trim()
    if (!trimmed) {
      showError.value = true
      return
    }
    emit('confirm', trimmed)
  } else {
    emit('confirm')
  }
}
</script>
