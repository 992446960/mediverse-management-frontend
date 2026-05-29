<template>
  <a-modal
    :open="open"
    :title="t('avatar.detailTitle')"
    width="820px"
    :footer="null"
    :destroy-on-close="true"
    @cancel="emit('update:open', false)"
  >
    <div v-if="loading && !detail" class="avatar-detail-loading">
      <a-spin />
    </div>
    <template v-else>
      <template v-if="detail">
        <div class="avatar-detail">
          <IdentitySummary
            :name="detail.name"
            :scope="formatScope(detail)"
            :avatar-url="detail.avatar_url || undefined"
            :status-text="detail.status === 'active' ? t('status.active') : t('status.inactive')"
            :status-color="detail.status === 'active' ? 'success' : 'error'"
          />

          <section class="avatar-detail__section">
            <SectionTitle :title="t('avatar.wizard.basicInfo')" />
            <ReadonlyDescription :items="basicItems" />
          </section>

          <section class="avatar-detail__section">
            <SectionTitle :title="t('avatar.advanced.title')" />
            <ReadonlyDescription :items="advancedItems" />
          </section>
        </div>

        <div class="avatar-detail__section">
          <SectionTitle :title="t('avatar.knowledgeGrants')" />
          <a-table
            v-if="grantRows.length"
            size="small"
            :pagination="false"
            row-key="id"
            :columns="grantColumns"
            :data-source="grantRows"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'granted_at'">
                {{ dayjs(record.granted_at).format('YYYY-MM-DD HH:mm') }}
              </template>
            </template>
          </a-table>
          <a-empty v-else :description="t('common.noData')" />
        </div>
      </template>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import IdentitySummary from '@/components/IdentitySummary/index.vue'
import ReadonlyDescription from '@/components/ReadonlyDescription/index.vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import { getEngines, getModels, getTools } from '@/api/advancedConfig'
import { getAvatarDetail } from '@/api/avatars'
import { getSkills } from '@/api/skills'
import { AVATAR_TYPE_LABEL_KEYS, type AvatarDetail, type AvatarStyle } from '@/types/avatar'
import type { EngineItem, ModelGroup, SkillItem, ToolGroup } from '@/types/advancedConfig'
import { normalizeSkillOptions, resolveAdvancedConfigSummary } from '@/utils/avatarAdvancedConfig'

const props = defineProps<{
  open: boolean
  avatarId?: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const { t } = useI18n()
const loading = ref(false)
const detail = ref<AvatarDetail | null>(null)
const advancedLoaded = ref(false)
const toolGroups = ref<ToolGroup[]>([])
const skillOptions = ref<SkillItem[]>([])
const engineOptions = ref<EngineItem[]>([])
const modelGroups = ref<ModelGroup[]>([])

interface ReadonlyDescriptionItem {
  label: string
  value?: string | number | string[] | null
  span?: 1 | 2
}

const STYLE_I18N: Record<AvatarStyle, string> = {
  formal: 'avatar.wizard.styleFormal',
  friendly: 'avatar.wizard.styleFriendly',
  concise: 'avatar.wizard.styleConcise',
  detailed: 'avatar.wizard.styleDetailed',
  custom: 'avatar.wizard.styleCustom',
}

const grantRows = computed(() => detail.value?.knowledge_grants ?? [])
const basicItems = computed<ReadonlyDescriptionItem[]>(() => {
  if (!detail.value) return []
  return [
    { label: t('avatar.type'), value: t(AVATAR_TYPE_LABEL_KEYS[detail.value.type]) },
    { label: t('avatar.bio'), value: detail.value.bio?.trim() || t('avatar.noBio'), span: 2 },
    { label: t('avatar.greeting'), value: detail.value.greeting?.trim(), span: 2 },
    { label: t('avatar.style'), value: styleLabel(detail.value), span: 2 },
    { label: t('avatar.tags'), value: detail.value.tags ?? [], span: 2 },
    {
      label: t('common.createdAt'),
      value: dayjs(detail.value.created_at).format('YYYY-MM-DD HH:mm'),
    },
    {
      label: t('common.updatedAt'),
      value: dayjs(detail.value.updated_at).format('YYYY-MM-DD HH:mm'),
    },
    { label: t('common.createdBy'), value: detail.value.created_by, span: 2 },
  ]
})
const advancedSummary = computed(() =>
  resolveAdvancedConfigSummary(detail.value ?? {}, {
    tools: toolGroups.value,
    skills: skillOptions.value,
    engines: engineOptions.value,
    modelGroups: modelGroups.value,
    emptyText: '—',
  })
)
const advancedItems = computed<ReadonlyDescriptionItem[]>(() => [
  { label: t('avatar.advanced.tools'), value: advancedSummary.value.tools, span: 2 },
  { label: t('avatar.advanced.skills'), value: advancedSummary.value.skills, span: 2 },
  { label: t('avatar.advanced.engine'), value: advancedSummary.value.algorithm },
  { label: t('avatar.advanced.model'), value: advancedSummary.value.model },
])

const grantColumns = computed(() => [
  { title: t('avatar.grantScope'), key: 'scope_name', dataIndex: 'scope_name' },
  { title: t('avatar.scopeType'), key: 'scope_type', dataIndex: 'scope_type', width: 100 },
  { title: t('avatar.grantedBy'), key: 'granted_by_name', dataIndex: 'granted_by_name' },
  { title: t('avatar.grantedAt'), key: 'granted_at', dataIndex: 'granted_at', width: 160 },
])

function formatScope(record: AvatarDetail): string {
  const parts: string[] = [record.org_name]
  if (record.dept_name) parts.push(record.dept_name)
  if (record.user_name) parts.push(record.user_name)
  return parts.join(' / ')
}

function styleLabel(d: AvatarDetail): string {
  if (d.style === 'custom' && d.style_custom?.trim()) {
    return `${t(STYLE_I18N.custom)}：${d.style_custom.trim()}`
  }
  return t(STYLE_I18N[d.style] ?? STYLE_I18N.formal)
}

async function loadDetail(id: string) {
  loading.value = true
  detail.value = null
  try {
    const [res] = await Promise.all([getAvatarDetail(id), loadAdvancedOptions()])
    detail.value = res
  } finally {
    loading.value = false
  }
}

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

watch(
  () => props.open,
  (val) => {
    if (!val) return
    if (props.avatarId) loadDetail(props.avatarId)
  }
)
</script>

<style scoped lang="scss">
.avatar-detail-loading {
  display: flex;
  min-height: min(360px, calc(100vh - 220px));
  align-items: center;
  justify-content: center;
}

.avatar-detail {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.avatar-detail__section {
  margin-top: var(--spacing-lg);
}

.avatar-detail__section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}
</style>
