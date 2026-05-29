<template>
  <a-modal
    :open="open"
    :title="t('avatar.detailTitle')"
    width="960px"
    :destroy-on-close="true"
    @cancel="emit('update:open', false)"
  >
    <template #footer>
      <a-button @click="emit('update:open', false)">{{ t('common.close') }}</a-button>
    </template>

    <div v-if="loading && !detail" class="avatar-detail-loading">
      <a-spin />
    </div>
    <template v-else>
      <template v-if="detail">
        <div class="avatar-detail">
          <section class="avatar-detail__summary">
            <a-avatar
              :src="detail.avatar_url || undefined"
              :size="88"
              class="avatar-detail__avatar"
            >
              <template #icon>
                <UserOutlined />
              </template>
            </a-avatar>
            <div class="avatar-detail__summary-content">
              <div class="avatar-detail__summary-header">
                <h3 class="avatar-detail__name">{{ detail.name }}</h3>
                <a-tag
                  :color="detail.status === 'active' ? 'success' : 'error'"
                  class="avatar-detail__status"
                >
                  {{ detail.status === 'active' ? t('status.active') : t('status.inactive') }}
                </a-tag>
              </div>
              <div class="avatar-detail__scope" :title="formatScope(detail)">
                {{ formatScope(detail) }}
              </div>
            </div>
          </section>

          <div class="avatar-detail__grid">
            <section class="avatar-detail__section">
              <SectionTitle :title="t('avatar.wizard.basicInfo')" />
              <div class="avatar-detail-basic">
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('avatar.type') }}</div>
                  <div class="avatar-detail-basic__value">
                    <a-tag :color="AVATAR_TYPE_TAG_COLORS[detail.type]" class="avatar-detail-tag">
                      {{ t(AVATAR_TYPE_DISPLAY_KEYS[detail.type]) }}
                    </a-tag>
                  </div>
                </div>
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('avatar.bio') }}</div>
                  <div class="avatar-detail-basic__value">
                    {{ detail.bio?.trim() || t('avatar.noBio') }}
                  </div>
                </div>
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('avatar.greeting') }}</div>
                  <div class="avatar-detail-basic__value">
                    {{ detail.greeting?.trim() || '—' }}
                  </div>
                </div>
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('avatar.style') }}</div>
                  <div class="avatar-detail-basic__value">
                    <div class="avatar-detail-style">
                      <span class="avatar-detail-style__icon">
                        <MessageOutlined />
                      </span>
                      <div class="avatar-detail-style__content">
                        <span class="avatar-detail-style__name">{{ styleLabel(detail) }}</span>
                        <span class="avatar-detail-style__desc">{{
                          styleDescription(detail)
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('avatar.tags') }}</div>
                  <div class="avatar-detail-basic__value">
                    <a-space v-if="detail.tags.length" wrap :size="[6, 6]">
                      <a-tag v-for="tag in detail.tags" :key="tag" class="avatar-detail-tag">
                        {{ tag }}
                      </a-tag>
                    </a-space>
                    <span v-else>—</span>
                  </div>
                </div>
                <div class="avatar-detail-basic__row">
                  <div class="avatar-detail-basic__label">{{ t('common.createdAt') }}</div>
                  <div class="avatar-detail-basic__value">
                    {{ dayjs(detail.created_at).format('YYYY-MM-DD HH:mm:ss') }}
                  </div>
                </div>
              </div>
            </section>

            <section class="avatar-detail__section">
              <SectionTitle :title="t('avatar.advanced.title')" />
              <div class="avatar-detail-advanced">
                <div
                  v-for="row in advancedRows"
                  :key="row.label"
                  class="avatar-detail-advanced__row"
                >
                  <span class="avatar-detail-advanced__icon" :class="`is-${row.tone}`">
                    <component :is="row.icon" />
                  </span>
                  <div class="avatar-detail-advanced__content">
                    <div class="avatar-detail-advanced__label">{{ row.label }}</div>
                    <div class="avatar-detail-advanced__value">
                      <a-space v-if="row.tags?.length" wrap :size="[6, 6]">
                        <a-tag v-for="tag in row.tags" :key="tag" class="avatar-detail-tag">
                          {{ tag }}
                        </a-tag>
                      </a-space>
                      <span v-else>{{ row.value }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section class="avatar-detail__section">
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
            <div v-else class="avatar-detail__empty">
              <a-empty :description="t('common.noData')" />
            </div>
          </section>
        </div>
      </template>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import dayjs from 'dayjs'
import {
  BulbOutlined,
  MessageOutlined,
  RobotOutlined,
  SettingOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons-vue'
import SectionTitle from '@/components/SectionTitle/index.vue'
import { getAvatarDetail } from '@/api/avatars'
import { useAdvancedConfigOptions } from '@/composables/useAdvancedConfigOptions'
import { AVATAR_TYPE_DISPLAY_KEYS, AVATAR_TYPE_TAG_COLORS, type AvatarDetail } from '@/types/avatar'
import { resolveAdvancedConfigSummary } from '@/utils/avatarAdvancedConfig'
import { formatScope, getStyleLabel, STYLE_DESCRIPTION_KEYS } from '@/utils/avatar'
import type { Component } from 'vue'

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
const { toolGroups, skillOptions, engineOptions, modelGroups, loadAdvancedOptions } =
  useAdvancedConfigOptions()

const grantRows = computed(() => detail.value?.knowledge_grants ?? [])
const advancedSummary = computed(() =>
  resolveAdvancedConfigSummary(detail.value ?? {}, {
    tools: toolGroups.value,
    skills: skillOptions.value,
    engines: engineOptions.value,
    modelGroups: modelGroups.value,
    emptyText: '—',
  })
)

const advancedRows = computed<
  {
    label: string
    value: string
    tags?: string[]
    icon: Component
    tone: 'blue' | 'green' | 'slate'
  }[]
>(() => [
  {
    label: t('avatar.advanced.tools'),
    value: '—',
    tags: advancedSummary.value.tools,
    icon: ToolOutlined,
    tone: 'blue',
  },
  {
    label: t('avatar.advanced.skills'),
    value: '—',
    tags: advancedSummary.value.skills,
    icon: BulbOutlined,
    tone: 'green',
  },
  {
    label: t('avatar.advanced.engine'),
    value: advancedSummary.value.algorithm,
    icon: RobotOutlined,
    tone: 'slate',
  },
  {
    label: t('avatar.advanced.model'),
    value: advancedSummary.value.model,
    icon: SettingOutlined,
    tone: 'slate',
  },
])

const grantColumns = computed(() => [
  { title: t('avatar.grantScope'), key: 'scope_name', dataIndex: 'scope_name' },
  { title: t('avatar.scopeType'), key: 'scope_type', dataIndex: 'scope_type', width: 100 },
  { title: t('avatar.grantedBy'), key: 'granted_by_name', dataIndex: 'granted_by_name' },
  { title: t('avatar.grantedAt'), key: 'granted_at', dataIndex: 'granted_at', width: 160 },
])

function styleLabel(d: AvatarDetail): string {
  if (d.style === 'custom' && d.style_custom?.trim()) {
    return `${getStyleLabel('custom', t)}：${d.style_custom.trim()}`
  }
  return getStyleLabel(d.style, t)
}

function styleDescription(d: AvatarDetail): string {
  if (d.style === 'custom' && d.style_custom?.trim()) return d.style_custom.trim()
  return t(STYLE_DESCRIPTION_KEYS[d.style] ?? STYLE_DESCRIPTION_KEYS.formal)
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
  min-width: 0;
  padding: var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-bg-container);
}

.avatar-detail__summary {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 28px;
  padding: 20px 28px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-container);
}

.avatar-detail__avatar {
  flex-shrink: 0;
  color: var(--color-text-inverse);
  background: linear-gradient(135deg, #c000ff 0%, #147cff 100%);
  border: 0;
}

.avatar-detail__summary-content {
  flex: 1;
  min-width: 0;
}

.avatar-detail__summary-header {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.avatar-detail__name {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--color-text-base);
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-detail__status {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.avatar-detail__scope {
  margin-top: 10px;
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.avatar-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.avatar-detail__section :deep(.section-title) {
  margin-bottom: var(--spacing-md);
}

.avatar-detail-basic {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.avatar-detail-basic__row {
  display: grid;
  grid-template-columns: 104px minmax(0, 1fr);
  min-width: 0;
  border-bottom: 1px solid var(--color-border-secondary);
}

.avatar-detail-basic__row:last-child {
  border-bottom: 0;
}

.avatar-detail-basic__label {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 52px;
  padding: 14px 12px;
  color: var(--color-text-base);
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
}

.avatar-detail-basic__value {
  display: flex;
  align-items: center;
  min-width: 0;
  min-height: 52px;
  padding: 14px 16px;
  color: var(--color-text-base);
  font-size: 0.875rem;
  line-height: 1.65;
  word-break: break-word;
}

.avatar-detail-style {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 12px;
}

.avatar-detail-style__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #1677ff;
  font-size: 15px;
  border-radius: var(--radius-full);
  background: #e7f3ff;
}

.avatar-detail-style__content {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 2px;
}

.avatar-detail-style__name {
  color: var(--color-text-base);
  font-weight: 600;
  line-height: 1.45;
}

.avatar-detail-style__desc {
  color: var(--color-text-secondary);
  font-size: 0.8125rem;
  line-height: 1.45;
}

.avatar-detail-advanced {
  overflow: hidden;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-base);
  background: var(--color-bg-container);
}

.avatar-detail-advanced__row {
  display: grid;
  grid-template-columns: 46px minmax(0, 1fr);
  gap: 14px;
  min-width: 0;
  padding: 16px 18px;
  border-bottom: 1px solid var(--color-border-secondary);
}

.avatar-detail-advanced__row:last-child {
  border-bottom: 0;
}

.avatar-detail-advanced__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  color: var(--detail-icon-color);
  font-size: 18px;
  border-radius: var(--radius-full);
  background: color-mix(in srgb, var(--detail-icon-color) 15%, transparent);
}

.avatar-detail-advanced__icon.is-blue {
  --detail-icon-color: #0ea5e9;
}

.avatar-detail-advanced__icon.is-green {
  --detail-icon-color: #10b981;
}

.avatar-detail-advanced__icon.is-slate {
  --detail-icon-color: #64748b;
}

.avatar-detail-advanced__content {
  min-width: 0;
}

.avatar-detail-advanced__label {
  margin-bottom: 8px;
  color: var(--color-text-base);
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.4;
}

.avatar-detail-advanced__value {
  min-width: 0;
  color: var(--color-text-base);
  font-size: 0.875rem;
  line-height: 1.5;
  word-break: break-word;
}

.avatar-detail-tag {
  margin-inline-end: 0;
}

.avatar-detail__empty {
  display: flex;
  min-height: 150px;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .avatar-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>
