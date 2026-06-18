<template>
  <div class="step-confirm">
    <div class="step-confirm__top-grid">
      <section class="step-confirm-card step-confirm-card--identity">
        <h3 class="step-confirm-card__title">{{ t('avatar.wizard.identityTitle') }}</h3>
        <div class="step-confirm-identity">
          <a-avatar
            :src="modelValue.avatar_url || undefined"
            :size="84"
            class="step-confirm-avatar"
          >
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
          <div class="step-confirm-identity__body">
            <div class="step-confirm-identity__name">{{ modelValue.name || t('avatar.name') }}</div>
            <div class="step-confirm-identity__tags">
              <a-tag color="blue">{{ typeLabel }}</a-tag>
              <a-tag>{{ t('avatar.wizard.pendingCreate') }}</a-tag>
            </div>
          </div>
        </div>
        <div class="step-confirm-scope">
          <div v-for="row in scopeRows" :key="row.label" class="step-confirm-scope__row">
            <component :is="row.icon" class="step-confirm-scope__icon" />
            <span class="step-confirm-scope__label">{{ row.label }}</span>
            <span class="step-confirm-scope__value">{{ row.value || '—' }}</span>
          </div>
        </div>
      </section>

      <section class="step-confirm-card">
        <h3 class="step-confirm-card__title">{{ t('avatar.advanced.title') }}</h3>
        <div class="step-confirm-advanced">
          <div
            v-for="row in advancedRows"
            :key="row.label"
            class="step-confirm-advanced__row"
            :class="{ 'step-confirm-advanced__row--tags': Array.isArray(row.value) }"
          >
            <span class="step-confirm-advanced__icon" aria-hidden="true">
              <component :is="row.icon" />
            </span>
            <span class="step-confirm-advanced__label">{{ row.label }}</span>
            <span
              class="step-confirm-advanced__value"
              :class="{ 'step-confirm-advanced__value--tags': Array.isArray(row.value) }"
            >
              <template v-if="Array.isArray(row.value)">
                <a-tag v-for="item in row.value" :key="item">{{ item }}</a-tag>
              </template>
              <template v-else>{{ row.value || '—' }}</template>
            </span>
          </div>
        </div>
      </section>
    </div>

    <section class="step-confirm-card">
      <h3 class="step-confirm-card__title">{{ t('avatar.wizard.conversationContent') }}</h3>
      <div class="step-confirm-content">
        <div v-for="row in contentRows" :key="row.label" class="step-confirm-content__row">
          <component :is="row.icon" class="step-confirm-content__icon" />
          <span class="step-confirm-content__label">{{ row.label }}</span>
          <span class="step-confirm-content__value">
            <template v-if="row.kind === 'style'">
              <a-tag color="blue">{{ row.value }}</a-tag>
              <span class="step-confirm-content__desc">{{ row.description }}</span>
            </template>
            <template v-else-if="Array.isArray(row.value)">
              <a-tag v-for="item in row.value" :key="item">{{ item }}</a-tag>
            </template>
            <template v-else>{{ row.value || '—' }}</template>
          </span>
        </div>
      </div>
    </section>

    <a-alert
      class="step-confirm__hint"
      type="info"
      show-icon
      :message="t('avatar.wizard.afterCreateHint')"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  ApartmentOutlined,
  BankOutlined,
  BulbOutlined,
  FileTextOutlined,
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
  TagOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import type { Component } from 'vue'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import { getUsers } from '@/api/users'
import { useAdvancedConfigOptions } from '@/composables/useAdvancedConfigOptions'
import type { AvatarWizardForm, AvatarType } from '@/types/avatar'
import { AVATAR_TYPE_LABEL_KEYS } from '@/types/avatar'
import { resolveAdvancedConfigSummary } from '@/utils/avatarAdvancedConfig'
import { getStyleLabel, STYLE_DESCRIPTION_KEYS } from '@/utils/avatar'

const { t } = useI18n()

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const scopeNames = ref<{ orgName?: string; deptName?: string; userName?: string }>({})
const { toolGroups, skillOptions, engineOptions, modelGroups, loadAdvancedOptions } =
  useAdvancedConfigOptions()

type ConfirmContentRow = {
  label: string
  value: string | string[]
  icon: Component
  kind?: 'style'
  description?: string
}

function getTypeLabelKey(type: AvatarType): string {
  return AVATAR_TYPE_LABEL_KEYS[type] ?? 'avatar.type'
}

function resolveNames(form: AvatarWizardForm) {
  scopeNames.value = {}
  if (form.org_id) {
    getOrganizations({ page: 1, page_size: 200 }).then((res) => {
      const org = res.items.find((o: { id: string }) => o.id === form.org_id)
      if (org) scopeNames.value = { ...scopeNames.value, orgName: (org as { name: string }).name }
    })
  }
  if (form.dept_id) {
    getDepartments({ org_id: form.org_id!, page: 1, page_size: 200 }).then((res) => {
      const dept = res.items.find((d: { id: string }) => d.id === form.dept_id)
      if (dept)
        scopeNames.value = { ...scopeNames.value, deptName: (dept as { name: string }).name }
    })
  }
  if (form.user_id && form.org_id && form.dept_id) {
    getUsers({ org_id: form.org_id, dept_id: form.dept_id, page: 1, page_size: 500 }).then(
      (res) => {
        const user = res.items.find((u: { id: string }) => u.id === form.user_id)
        if (user)
          scopeNames.value = {
            ...scopeNames.value,
            userName: (user as { real_name: string }).real_name,
          }
      }
    )
  }
}

watch(
  () => props.modelValue,
  (form) => resolveNames(form),
  { immediate: true, deep: true }
)

onMounted(loadAdvancedOptions)

const typeLabel = computed(() => t(getTypeLabelKey(props.modelValue.type)))

const scopeRows = computed(() => [
  {
    label: t('avatar.org'),
    value: scopeNames.value.orgName ?? props.modelValue.org_id ?? '—',
    icon: BankOutlined,
  },
  {
    label: t('avatar.dept'),
    value: scopeNames.value.deptName ?? props.modelValue.dept_id ?? '—',
    icon: ApartmentOutlined,
  },
  {
    label: t('avatar.bindUser'),
    value: scopeNames.value.userName ?? props.modelValue.user_id ?? '—',
    icon: UserOutlined,
  },
])

const advancedSummary = computed(() => {
  const form = props.modelValue
  return resolveAdvancedConfigSummary(
    {
      tools: form.tools.map((name) => ({ name, enabled: true })),
      skills: form.skills.map((name) => ({ name, enabled: true })),
      algorithm: form.algorithm,
      model: form.model,
    },
    {
      tools: toolGroups.value,
      skills: skillOptions.value,
      engines: engineOptions.value,
      modelGroups: modelGroups.value,
      emptyText: '—',
    }
  )
})

const contentRows = computed<ConfirmContentRow[]>(() => {
  const form = props.modelValue
  return [
    {
      label: t('avatar.style'),
      value: getStyleLabel(form.style, t),
      description: t(STYLE_DESCRIPTION_KEYS[form.style]),
      icon: UserOutlined,
      kind: 'style',
    },
    { label: t('avatar.bio'), value: form.bio || '—', icon: FileTextOutlined },
    { label: t('avatar.greeting'), value: form.greeting || '—', icon: MessageOutlined },
    { label: t('avatar.tags'), value: form.tags?.length ? form.tags : ['—'], icon: TagOutlined },
  ]
})

const advancedRows = computed<{ label: string; value: string | string[]; icon: Component }[]>(
  () => {
    const summary = advancedSummary.value
    return [
      { label: t('avatar.advanced.tools'), value: summary.tools, icon: ToolOutlined },
      { label: t('avatar.advanced.skills'), value: summary.skills, icon: BulbOutlined },
      { label: t('avatar.advanced.engine'), value: summary.algorithm, icon: RobotOutlined },
      { label: t('avatar.advanced.model'), value: summary.model, icon: SettingOutlined },
    ]
  }
)
</script>

<style scoped lang="scss">
.step-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-confirm__top-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.step-confirm-card {
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.step-confirm-card__title {
  margin: 0 0 var(--spacing-lg);
  color: var(--color-text-base);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.5;
}

.step-confirm-identity {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border-secondary);
}

.step-confirm-avatar {
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 18%, transparent);
}

.step-confirm-identity__body {
  min-width: 0;
}

.step-confirm-identity__name {
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-base);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.4;
}

.step-confirm-identity__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.step-confirm-scope {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
}

.step-confirm-scope__row,
.step-confirm-content__row {
  display: grid;
  grid-template-columns: 28px 112px minmax(0, 1fr);
  align-items: center;
  gap: var(--spacing-sm);
  min-width: 0;
}

.step-confirm-advanced__row {
  display: grid;
  grid-template-columns: 46px 96px minmax(0, 1fr);
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.step-confirm-scope__icon,
.step-confirm-content__icon {
  color: var(--color-primary);
  font-size: 1.25rem;
}

.step-confirm-scope__label,
.step-confirm-advanced__label,
.step-confirm-content__label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.step-confirm-scope__value,
.step-confirm-advanced__value,
.step-confirm-content__value {
  min-width: 0;
  color: var(--color-text-base);
  font-size: 0.9375rem;
  line-height: 1.6;
  word-break: break-word;
}

.step-confirm-advanced {
  display: flex;
  flex-direction: column;
}

.step-confirm-advanced__row {
  min-height: 58px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.step-confirm-advanced__row--tags {
  align-items: start;
}

.step-confirm-advanced__row:last-child {
  border-bottom: 0;
}

.step-confirm-advanced__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-full);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  font-size: 1.125rem;
}

.step-confirm-advanced__row--tags .step-confirm-advanced__icon {
  margin-top: 2px;
}

.step-confirm-advanced__row--tags .step-confirm-advanced__label {
  padding-top: 8px;
}

.step-confirm-advanced__value--tags {
  display: grid;
  min-width: 0;
  max-width: 100%;
  max-height: 100px;
  padding-bottom: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  grid-auto-columns: max-content;
  grid-auto-flow: column;
  grid-template-rows: repeat(3, max-content);
  gap: 6px;
  scrollbar-color: color-mix(in srgb, var(--color-primary) 45%, transparent) transparent;
  scrollbar-width: thin;
}

.step-confirm-advanced__value--tags :deep(.ant-tag) {
  margin: 0;
}

.step-confirm-advanced__value--tags::-webkit-scrollbar {
  height: 6px;
  background: transparent;
}

.step-confirm-advanced__value--tags::-webkit-scrollbar-track {
  background: transparent;
}

.step-confirm-advanced__value--tags::-webkit-scrollbar-thumb {
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--color-primary) 35%, transparent);
}

.step-confirm-content {
  display: flex;
  flex-direction: column;
}

.step-confirm-content__row {
  grid-template-columns: 28px 112px minmax(0, 1fr);
  min-height: 48px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.step-confirm-content__row:last-child {
  border-bottom: 0;
}

.step-confirm-content__value {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.step-confirm-content__desc {
  color: var(--color-text-base);
}

.step-confirm__hint {
  border-color: color-mix(in srgb, var(--color-primary) 18%, var(--color-border));
  background: color-mix(in srgb, var(--color-primary) 6%, var(--color-bg-container));
}

@media (max-width: 760px) {
  .step-confirm__top-grid {
    grid-template-columns: 1fr;
  }

  .step-confirm-scope__row,
  .step-confirm-content__row {
    grid-template-columns: 28px minmax(80px, 112px) minmax(0, 1fr);
  }

  .step-confirm-advanced__row {
    grid-template-columns: 42px minmax(80px, 96px) minmax(0, 1fr);
  }
}
</style>
