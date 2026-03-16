<template>
  <div class="step-confirm">
    <h3 class="step-confirm-title">
      {{ t('avatar.wizard.confirmSectionTitle') }}
    </h3>
    <div class="step-confirm-list">
      <template v-for="row in confirmRows" :key="row.key">
        <div
          v-if="row.visible"
          class="step-confirm-row"
          :class="{ 'step-confirm-row--avatar': row.key === 'avatar' }"
        >
          <span :id="`confirm-label-${row.key}`" class="step-confirm-label">{{ row.label }}</span>
          <div class="step-confirm-value" :aria-labelledby="`confirm-label-${row.key}`">
            <!-- 头像预览：圆形图片 -->
            <template v-if="row.key === 'avatar'">
              <img
                v-if="modelValue.avatar_url"
                :src="modelValue.avatar_url"
                :alt="t('avatar.avatar')"
                class="step-confirm-avatar"
              />
              <span v-else class="step-confirm-empty">{{ t('common.noData') }}</span>
            </template>
            <!-- 标签：a-tag 随机颜色 -->
            <template v-else-if="row.key === 'tags'">
              <span class="step-confirm-tags">
                <a-tag
                  v-for="(tag, i) in modelValue.tags ?? []"
                  :key="tag"
                  :color="TAG_COLORS[i % TAG_COLORS.length]"
                >
                  {{ tag }}
                </a-tag>
              </span>
              <span v-if="!modelValue.tags?.length" class="step-confirm-empty">{{
                t('common.noData')
              }}</span>
            </template>
            <!-- 普通文案 -->
            <template v-else>
              <span class="step-confirm-text">{{ row.value }}</span>
            </template>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import { getUsers } from '@/api/users'
import type { AvatarWizardForm, AvatarType, AvatarStyle } from '@/types/avatar'
import { AVATAR_TYPE_LABEL_KEYS } from '@/types/avatar'

/** 确认预览中标签可用的 a-tag 颜色，按索引循环分配 */
const TAG_COLORS = ['pink', 'red', 'orange', 'green', 'cyan', 'blue', 'purple'] as const

const { t } = useI18n()

const props = defineProps<{
  modelValue: AvatarWizardForm
}>()

const scopeNames = ref<{ orgName?: string; deptName?: string; userName?: string }>({})

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

/** 确认预览行配置：类型、机构、科室、分身名称、头像预览、简介、标签、开场白、沟通风格 */
const confirmRows = computed(() => {
  const form = props.modelValue
  const rows: { key: string; label: string; value: string; visible: boolean }[] = [
    {
      key: 'type',
      label: t('avatar.type'),
      value: t(getTypeLabelKey(form.type)),
      visible: true,
    },
    {
      key: 'org',
      label: t('avatar.org'),
      value: scopeNames.value.orgName ?? form.org_id ?? '—',
      visible: !!form.org_id,
    },
    {
      key: 'dept',
      label: t('avatar.dept'),
      value: scopeNames.value.deptName ?? form.dept_id ?? '—',
      visible: !!form.dept_id,
    },
    {
      key: 'user',
      label: t('avatar.bindUser'),
      value: scopeNames.value.userName ?? form.user_id ?? '—',
      visible: !!form.user_id,
    },
    {
      key: 'name',
      label: t('avatar.name'),
      value: form.name || '—',
      visible: true,
    },
    {
      key: 'avatar',
      label: t('avatar.wizard.avatarPreview'),
      value: '',
      visible: true,
    },
    {
      key: 'bio',
      label: t('avatar.bio'),
      value: form.bio || '—',
      visible: true,
    },
    {
      key: 'tags',
      label: t('avatar.tags'),
      value: '',
      visible: true,
    },
    {
      key: 'greeting',
      label: t('avatar.greeting'),
      value: form.greeting || '—',
      visible: true,
    },
    {
      key: 'style',
      label: t('avatar.style'),
      value: t(getStyleLabelKey(form.style)),
      visible: true,
    },
  ]
  return rows
})
</script>

<style scoped>
.step-confirm {
  font-size: 14px;
  line-height: 1.5;
}

.step-confirm-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--ant-color-text, #262626);
  margin-bottom: 12px;
}

.step-confirm-list {
  border: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  border-radius: 8px;
  overflow: hidden;
  background: var(--ant-color-bg-container, #fff);
}

.step-confirm-row {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  border-bottom: 1px solid var(--ant-color-border-secondary, #f0f0f0);
  gap: 16px;
}

.step-confirm-row:last-child {
  border-bottom: none;
}

.step-confirm-row--avatar {
  align-items: center;
}

.step-confirm-label {
  flex-shrink: 0;
  width: 88px;
  color: var(--ant-color-text-secondary, #595959);
  font-size: 14px;
}

.step-confirm-value {
  flex: 1;
  min-width: 0;
  color: var(--ant-color-text, #262626);
  font-size: 14px;
}

.step-confirm-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.step-confirm-empty {
  color: var(--ant-color-text-tertiary, #8c8c8c);
}

/* 头像预览：圆形 */
.step-confirm-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
}

/* 标签：a-tag 多色，仅用 gap 控制间距 */
.step-confirm-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step-confirm-tags :deep(.ant-tag) {
  margin-right: 0;
  margin-inline-end: 0;
}
</style>
