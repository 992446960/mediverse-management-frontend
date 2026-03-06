<template>
  <a-modal
    :open="open"
    :footer="null"
    :destroy-on-close="true"
    wrap-class-name="avatar-wizard-modal"
    :width="672"
    :style="{ maxWidth: '90vw' }"
    :aria-labelledby="titleId"
    :aria-describedby="contentId"
    @cancel="emit('update:open', false)"
  >
    <template #title>
      <span :id="titleId" class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{
        t('avatar.addAvatar')
      }}</span>
    </template>

    <div
      :id="contentId"
      class="avatar-wizard-content px-6 pt-2 pb-0"
      role="region"
      :aria-label="t('avatar.wizard.stepProgress', { current: currentStep + 1, total: 4 })"
    >
      <!-- 自定义步骤条：已完成=勾选圆，当前=主色数字圆，未到=灰色圆；连接线已过段为主色 -->
      <div class="avatar-wizard-steps flex items-center justify-between mb-8">
        <template v-for="(step, i) in steps" :key="step.key">
          <div class="flex items-center shrink-0">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-200"
              :class="
                i < currentStep
                  ? 'bg-blue-50 dark:bg-blue-900/30 border border-[#0ea5e9]/30 text-[#0ea5e9]'
                  : i === currentStep
                    ? 'bg-[#0ea5e9] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-400'
              "
            >
              <CheckOutlined v-if="i < currentStep" class="text-lg" />
              <span v-else class="text-sm font-semibold">{{ i + 1 }}</span>
            </div>
            <span
              class="ml-2 text-sm whitespace-nowrap"
              :class="
                i < currentStep
                  ? 'font-medium text-gray-700 dark:text-gray-300'
                  : i === currentStep
                    ? 'font-semibold text-gray-900 dark:text-gray-100'
                    : 'text-gray-500 dark:text-gray-400'
              "
            >
              {{ t(step.titleKey) }}
            </span>
          </div>
          <div
            v-if="i < steps.length - 1"
            class="step-line flex-1 h-px mx-3 shrink-0 min-w-[12px]"
            :class="i < currentStep ? 'bg-[#0ea5e9]' : 'bg-gray-200 dark:bg-gray-700'"
          />
        </template>
      </div>

      <div class="mb-6">
        <p
          class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
          aria-live="polite"
        >
          {{ t('avatar.wizard.stepProgress', { current: currentStep + 1, total: 4 }) }}
        </p>
        <p v-if="currentStep === 1" class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('avatar.wizard.scopeHint') }}
        </p>
      </div>

      <div class="avatar-wizard-content-inner min-h-[280px]">
        <StepType v-if="currentStep === 0" v-model="form" />
        <StepScope v-if="currentStep === 1" ref="stepScopeRef" v-model="form" />
        <StepInfo v-if="currentStep === 2" ref="stepInfoRef" v-model="form" />
        <StepConfirm v-if="currentStep === 3" :model-value="form" />
      </div>
    </div>

    <!-- 底部：分隔线 + 取消/上一步 + 确认 -->
    <div
      class="avatar-wizard-footer px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50 flex justify-end items-center gap-3"
    >
      <a-button
        class="avatar-wizard-btn min-h-[44px] min-w-[80px] cursor-pointer transition-colors duration-200"
        @click="onCancel"
      >
        {{ currentStep > 0 ? t('common.prev') : t('common.cancel') }}
      </a-button>
      <a-button
        v-if="currentStep < 3"
        type="primary"
        class="avatar-wizard-btn min-h-[44px] min-w-[80px] cursor-pointer transition-colors duration-200 bg-[#0ea5e9] hover:bg-sky-600! border-0"
        :loading="loading"
        @click="onNext"
      >
        {{ t('common.confirm') }}
      </a-button>
      <a-button
        v-if="currentStep === 3"
        type="primary"
        class="avatar-wizard-btn min-h-[44px] min-w-[100px] cursor-pointer transition-colors duration-200 bg-[#0ea5e9] hover:bg-sky-600! border-0"
        :loading="submitLoading"
        @click="onSubmit"
      >
        {{ t('avatar.wizard.confirmCreate') }}
      </a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import { CheckOutlined } from '@ant-design/icons-vue'
import { createAvatar } from '@/api/avatars'
import StepType from './steps/StepType.vue'
import StepScope from './steps/StepScope.vue'
import StepInfo from './steps/StepInfo.vue'
import StepConfirm from './steps/StepConfirm.vue'
import type { AvatarWizardForm } from '@/types/avatar'
import { AVATAR_TYPE_VALUES } from '@/types/avatar'

const { t } = useI18n()

const steps = [
  { key: 'type', titleKey: 'avatar.wizard.selectType' },
  { key: 'scope', titleKey: 'avatar.wizard.bindScope' },
  { key: 'info', titleKey: 'avatar.wizard.basicInfo' },
  { key: 'confirm', titleKey: 'avatar.wizard.confirm' },
]

const defaultForm: AvatarWizardForm = {
  type: AVATAR_TYPE_VALUES[0],
  name: '',
  tags: [],
  style: 'formal',
}

interface Props {
  open: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  success: []
}>()

const currentStep = ref(0)
const form = ref<AvatarWizardForm>({ ...defaultForm })
const loading = ref(false)
const submitLoading = ref(false)
const stepScopeRef = ref<InstanceType<typeof StepScope> | null>(null)
const stepInfoRef = ref<InstanceType<typeof StepInfo> | null>(null)

const titleId = 'avatar-wizard-title'
const contentId = 'avatar-wizard-description'

function onCancel() {
  if (currentStep.value > 0) {
    currentStep.value--
  } else {
    emit('update:open', false)
  }
}

function setCloseButtonAriaLabel() {
  nextTick(() => {
    const wrap = document.querySelector('.avatar-wizard-modal')
    if (wrap) {
      const closeBtn = wrap.querySelector('.ant-modal-close')
      if (closeBtn) closeBtn.setAttribute('aria-label', t('common.close'))
    }
  })
}

watch(
  () => currentStep.value,
  () => {}
)

watch(
  () => props.open,
  (val) => {
    if (val) {
      currentStep.value = 0
      form.value = { ...defaultForm }
      setCloseButtonAriaLabel()
    }
  }
)

function onNext() {
  if (currentStep.value === 1) {
    const p = stepScopeRef.value?.validate()
    if (p) {
      p.then(() => {
        currentStep.value++
      }).catch(() => {})
    }
    return
  }
  if (currentStep.value === 2) {
    const p = stepInfoRef.value?.validate()
    if (p) {
      p.then(() => {
        currentStep.value++
      }).catch(() => {})
    }
    return
  }
  currentStep.value++
}

async function onSubmit() {
  submitLoading.value = true
  try {
    const payload = {
      type: form.value.type,
      org_id: form.value.org_id,
      dept_id: form.value.dept_id,
      user_id: form.value.user_id,
      name: form.value.name.trim(),
      avatar_url: form.value.avatar_url?.trim() || undefined,
      bio: form.value.bio?.trim() || undefined,
      tags: form.value.tags?.length ? form.value.tags : undefined,
      greeting: form.value.greeting?.trim() || undefined,
      style: form.value.style,
      style_custom: form.value.style === 'custom' ? form.value.style_custom?.trim() : undefined,
    }
    await createAvatar(payload)
    message.success(t('avatar.wizard.createSuccess'))
    emit('update:open', false)
    emit('success')
  } catch {
    // error shown by api interceptor
  } finally {
    submitLoading.value = false
  }
}
</script>

<style scoped>
/* 弹窗宽度：小屏 90vw，最大 640px；Modal 挂载在 body，需用 :deep 或全局 */
</style>

<style>
.avatar-wizard-modal.ant-modal-wrap .ant-modal {
  width: 90vw;
  max-width: 672px;
}
.avatar-wizard-modal .ant-modal-content {
  padding: 0;
  overflow: hidden;
}
.avatar-wizard-modal .ant-modal-body {
  padding: 0;
}
.avatar-wizard-modal .ant-modal-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
}
</style>
