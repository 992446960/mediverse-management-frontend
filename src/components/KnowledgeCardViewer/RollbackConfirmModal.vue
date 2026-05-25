<template>
  <a-modal
    :open="open"
    :width="560"
    centered
    :closable="false"
    :mask-closable="false"
    class="knowledge-card-rollback-modal"
    @cancel="handleCancel"
  >
    <template #title>
      <div class="knowledge-card-rollback-modal__header">
        <ExclamationCircleFilled class="knowledge-card-rollback-modal__icon" />
        <h2 class="knowledge-card-rollback-modal__title">
          {{ t('knowledge.card.rollbackConfirmTitle') }}
        </h2>
      </div>
    </template>

    <div class="knowledge-card-rollback-modal__content">
      <p class="knowledge-card-rollback-modal__message">
        {{ t('knowledge.card.rollbackConfirmContent', { version: versionLabel }) }}
      </p>
      <a-textarea
        v-model:value="reasonValue"
        :placeholder="t('knowledge.card.rollbackReasonPlaceholder')"
        :maxlength="2000"
        :disabled="confirmLoading"
        show-count
        :rows="4"
      />
    </div>

    <template #footer>
      <div class="knowledge-card-rollback-modal__footer">
        <a-button :disabled="confirmLoading" @click="handleCancel">
          {{ t('common.cancel') }}
        </a-button>
        <a-button type="primary" :loading="confirmLoading" @click="handleConfirm">
          {{ t('common.confirm') }}
        </a-button>
      </div>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ExclamationCircleFilled } from '@ant-design/icons-vue'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    versionLabel: string
    confirmLoading?: boolean
  }>(),
  {
    confirmLoading: false,
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [reason?: string]
}>()

const reasonValue = ref('')

watch(
  () => props.open,
  (open) => {
    if (open) reasonValue.value = ''
  }
)

function handleCancel() {
  if (props.confirmLoading) return
  emit('update:open', false)
}

function handleConfirm() {
  if (props.confirmLoading) return
  emit('confirm', reasonValue.value.trim() || undefined)
}
</script>

<style scoped lang="scss">
.knowledge-card-rollback-modal__header {
  display: flex;
  align-items: center;
  gap: 14px;
}

.knowledge-card-rollback-modal__icon {
  flex: none;
  color: var(--color-warning);
  font-size: 28px;
}

.knowledge-card-rollback-modal__title {
  margin: 0;
  color: var(--color-text-base);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.35;
}

.knowledge-card-rollback-modal__content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.knowledge-card-rollback-modal__message {
  margin: 0;
  color: var(--color-text-base);
  font-size: 16px;
  line-height: 1.6;
}

.knowledge-card-rollback-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
