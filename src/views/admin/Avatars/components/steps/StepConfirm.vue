<template>
  <div class="step-confirm">
    <section class="step-confirm__hero">
      <IdentitySummary
        :avatar-url="modelValue.avatar_url"
        :name="modelValue.name || t('avatar.name')"
        :scope="scopeText"
        :status-text="t(getTypeLabelKey(modelValue.type))"
        status-color="blue"
        :tags="modelValue.tags"
      />
    </section>

    <section class="step-confirm__section">
      <SectionTitle :title="t('avatar.wizard.basicInfo')" />
      <ReadonlyDescription :items="contentSummaryItems" />
    </section>

    <section class="step-confirm__section">
      <SectionTitle :title="t('avatar.advanced.title')" />
      <ReadonlyDescription :items="advancedSummaryItems" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import IdentitySummary from '@/components/IdentitySummary/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import { getUsers } from '@/api/users'
import { getSkills } from '@/api/skills'
import type { EngineItem, ModelGroup, SkillItem, ToolGroup } from '@/types/advancedConfig'
import type { AvatarWizardForm, AvatarType, AvatarStyle } from '@/types/avatar'
import { AVATAR_TYPE_LABEL_KEYS } from '@/types/avatar'
import { normalizeSkillOptions, resolveAdvancedConfigSummary } from '@/utils/avatarAdvancedConfig'

const { t } = useI18n()

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const scopeNames = ref<{ orgName?: string; deptName?: string; userName?: string }>({})
const advancedLoaded = ref(false)
const toolGroups = ref<ToolGroup[]>([])
const skillOptions = ref<SkillItem[]>([])
const engineOptions = ref<EngineItem[]>([])
const modelGroups = ref<ModelGroup[]>([])

const STYLE_LABEL_KEYS: Record<AvatarStyle, string> = {
  formal: 'avatar.wizard.styleFormal',
  friendly: 'avatar.wizard.styleFriendly',
  concise: 'avatar.wizard.styleConcise',
  detailed: 'avatar.wizard.styleDetailed',
  custom: 'avatar.wizard.styleCustom',
}

function getTypeLabelKey(type: AvatarType): string {
  return AVATAR_TYPE_LABEL_KEYS[type] ?? 'avatar.type'
}

function getStyleLabelKey(style: AvatarStyle): string {
  return STYLE_LABEL_KEYS[style] ?? style
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

async function loadAdvancedOptions() {
  if (advancedLoaded.value) return
  const [tools, skills, engines, models] = await Promise.all([
    getTools(),
    getSkills(),
    getEngines(),
    getModels(),
  ])
  toolGroups.value = tools
  skillOptions.value = normalizeSkillOptions(skills)
  engineOptions.value = engines
  modelGroups.value = models
  advancedLoaded.value = true
}

onMounted(loadAdvancedOptions)

const scopeText = computed(() => {
  const form = props.modelValue
  return [
    scopeNames.value.orgName ?? form.org_id,
    scopeNames.value.deptName ?? form.dept_id,
    scopeNames.value.userName ?? form.user_id,
  ]
    .filter(Boolean)
    .join(' / ')
})

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

const contentSummaryItems = computed(() => {
  const form = props.modelValue
  return [
    { label: t('avatar.type'), value: t(getTypeLabelKey(form.type)) },
    { label: t('avatar.org'), value: scopeNames.value.orgName ?? form.org_id ?? '—' },
    { label: t('avatar.dept'), value: scopeNames.value.deptName ?? form.dept_id ?? '—' },
    { label: t('avatar.bindUser'), value: scopeNames.value.userName ?? form.user_id ?? '—' },
    { label: t('avatar.name'), value: form.name || '—' },
    { label: t('avatar.tags'), value: form.tags ?? [] },
    { label: t('avatar.bio'), value: form.bio || '—', span: 2 as const },
    { label: t('avatar.greeting'), value: form.greeting || '—', span: 2 as const },
    { label: t('avatar.style'), value: t(getStyleLabelKey(form.style)) },
    {
      label: t('avatar.styleCustom'),
      value: form.style === 'custom' ? form.style_custom || '—' : '—',
    },
  ]
})

const advancedSummaryItems = computed(() => {
  const summary = advancedSummary.value
  return [
    { label: t('avatar.advanced.tools'), value: summary.tools },
    { label: t('avatar.advanced.skills'), value: summary.skills },
    { label: t('avatar.advanced.engine'), value: summary.algorithm },
    { label: t('avatar.advanced.model'), value: summary.model },
  ]
})
</script>

<style scoped lang="scss">
.step-confirm {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-confirm__hero,
.step-confirm__section {
  min-width: 0;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.step-confirm__section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}
</style>
