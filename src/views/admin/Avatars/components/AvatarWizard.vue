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
      class="avatar-wizard-content pb-0"
      role="region"
      :aria-label="
        t('avatar.wizard.stepProgress', { current: currentStep + 1, total: steps.length })
      "
    >
      <WizardStepper
        class="avatar-wizard-steps"
        :steps="wizardSteps"
        :current="currentStep"
        :aria-label="
          t('avatar.wizard.stepProgress', { current: currentStep + 1, total: steps.length })
        "
      />

      <div class="mb-6">
        <p
          class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1"
          aria-live="polite"
        >
          {{ t('avatar.wizard.stepProgress', { current: currentStep + 1, total: steps.length }) }}
        </p>
        <p v-if="currentStep === 1" class="text-sm text-gray-600 dark:text-gray-400">
          {{ t('avatar.wizard.scopeHint') }}
        </p>
      </div>

      <div class="avatar-wizard-content-inner min-h-[280px]">
        <StepType v-if="currentStep === 0" v-model="form" />
        <StepScope v-if="currentStep === 1" ref="stepScopeRef" v-model="form" />
        <StepInfo v-if="currentStep === 2" ref="stepInfoRef" v-model="form" />
        <StepAdvanced v-if="currentStep === 3" v-model="form" />
        <StepConfirm v-if="currentStep === lastStepIndex" :model-value="form" />
      </div>
    </div>

    <!-- 底部：分隔线 + 取消/上一步 + 确认 -->
    <div
      class="avatar-wizard-footer pt-3 pb-2 border-t border-gray-100 dark:border-gray-800 flex justify-end items-center gap-3"
    >
      <a-button
        class="avatar-wizard-btn cursor-pointer transition-colors duration-200"
        @click="onCancel"
      >
        {{ currentStep > 0 ? t('common.prev') : t('common.cancel') }}
      </a-button>
      <a-button
        v-if="currentStep < lastStepIndex"
        type="primary"
        class="avatar-wizard-btn cursor-pointer transition-colors duration-200 bg-[#0ea5e9] hover:bg-sky-600! border-0"
        :loading="loading"
        @click="onNext"
      >
        {{ t('common.confirm') }}
      </a-button>
      <a-button
        v-if="currentStep === lastStepIndex"
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
import { useI18n } from 'vue-i18n'
import { message } from 'ant-design-vue'
import WizardStepper from '@/components/WizardStepper/index.vue'
import { createAvatar } from '@/api/avatars'
import StepType from './steps/StepType.vue'
import StepScope from './steps/StepScope.vue'
import StepInfo from './steps/StepInfo.vue'
import StepAdvanced from './steps/StepAdvanced.vue'
import StepConfirm from './steps/StepConfirm.vue'
import { useAvatarCreatePermission } from '@/composables/useAvatarCreatePermission'
import type { AvatarWizardForm } from '@/types/avatar'
import { buildAvatarCreatePayload } from '@/utils/avatarAdvancedConfig'

const { t } = useI18n()
const { defaultTypeForRole } = useAvatarCreatePermission()

const steps = [
  { key: 'type', titleKey: 'avatar.wizard.selectType' },
  { key: 'scope', titleKey: 'avatar.wizard.bindScope' },
  { key: 'info', titleKey: 'avatar.wizard.basicInfo' },
  { key: 'advanced', titleKey: 'avatar.advanced.title' },
  { key: 'confirm', titleKey: 'avatar.wizard.confirm' },
]

function getDefaultForm(): AvatarWizardForm {
  return {
    type: defaultTypeForRole.value,
    name: '',
    tags: [],
    style: 'formal',
    tools: [],
    skills: [],
    algorithm: null,
    model: null,
  }
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
const form = ref<AvatarWizardForm>(getDefaultForm())
const loading = ref(false)
const submitLoading = ref(false)
const stepScopeRef = ref<InstanceType<typeof StepScope> | null>(null)
const stepInfoRef = ref<InstanceType<typeof StepInfo> | null>(null)

const titleId = 'avatar-wizard-title'
const contentId = 'avatar-wizard-description'
const lastStepIndex = computed(() => steps.length - 1)
const wizardSteps = computed(() =>
  steps.map((step) => ({
    key: step.key,
    title: t(step.titleKey),
  }))
)

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
  () => props.open,
  (val) => {
    if (val) {
      currentStep.value = 0
      form.value = getDefaultForm()
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
    await createAvatar(buildAvatarCreatePayload(form.value))
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

<style scoped lang="scss">
.avatar-wizard-steps {
  margin-bottom: var(--spacing-xl);
}
</style>

<style lang="scss">
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
