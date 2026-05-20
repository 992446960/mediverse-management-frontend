<template>
  <a-modal
    :open="open"
    :title="t('common.confirmStatusTitle')"
    :width="560"
    :confirm-loading="confirmLoading"
    :ok-text="t('common.confirm')"
    :cancel-text="t('common.cancel')"
    centered
    @ok="handleConfirm"
    @cancel="handleCancel"
  >
    <div class="space-y-3">
      <p class="m-0 text-(--color-text-base)">
        {{ confirmText }}
      </p>
      <a-textarea
        v-if="targetStatus === 'offline'"
        v-model:value="noteValue"
        :placeholder="t('knowledge.card.offlineNotePlaceholder')"
        :maxlength="2000"
        show-count
        :rows="4"
      />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { OnlineStatus } from '@/types/knowledge'

const { t } = useI18n()

const props = withDefaults(
  defineProps<{
    open: boolean
    targetStatus: OnlineStatus
    confirmLoading?: boolean
  }>(),
  {
    confirmLoading: false,
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [note?: string]
}>()

const noteValue = ref('')

const confirmText = computed(() =>
  props.targetStatus === 'online'
    ? t('knowledge.card.confirmToggleOnline')
    : t('knowledge.card.confirmToggleOffline')
)

watch(
  () => props.open,
  (open) => {
    if (open) noteValue.value = ''
  }
)

function handleCancel() {
  emit('update:open', false)
}

function handleConfirm() {
  emit('confirm', noteValue.value.trim() || undefined)
}
</script>
