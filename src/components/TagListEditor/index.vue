<template>
  <div class="tag-list-editor">
    <span v-for="(tag, index) in tags" :key="`${tag}-${index}`" class="tag-list-editor__pill">
      <span class="tag-list-editor__text">{{ tag }}</span>
      <span
        v-if="!disabled"
        class="tag-list-editor__remove"
        role="button"
        tabindex="0"
        :aria-label="t('common.delete')"
        @click="removeTag(index)"
        @keydown.enter.prevent="removeTag(index)"
        @keydown.space.prevent="removeTag(index)"
      >
        <CloseOutlined class="tag-list-editor__remove-icon" />
      </span>
    </span>

    <a-popover
      v-if="!disabled && tags.length < resolvedMaxCount"
      v-model:open="popoverOpen"
      trigger="click"
      overlay-class-name="tag-list-editor__popover"
      @open-change="onPopoverOpenChange"
    >
      <template #content>
        <div class="tag-list-editor__add-popover">
          <a-input
            ref="inputRef"
            v-model:value="inputValue"
            :placeholder="t('avatar.wizard.tagPlaceholder')"
            :maxlength="resolvedMaxLength"
            size="small"
            class="tag-list-editor__input"
            @keydown.enter.prevent="confirmAddTag"
            @press-enter="confirmAddTag"
          />
          <a-button
            type="primary"
            size="small"
            class="tag-list-editor__add-confirm"
            @click="confirmAddTag"
          >
            {{ t('common.confirm') }}
          </a-button>
        </div>
      </template>
      <span
        class="tag-list-editor__add"
        role="button"
        tabindex="0"
        :aria-label="t('avatar.wizard.addTag')"
        @keydown.enter.prevent="popoverOpen = true"
        @keydown.space.prevent="popoverOpen = true"
      >
        <PlusOutlined class="tag-list-editor__add-icon" />
        <span>{{ t('avatar.wizard.tagPlaceholderAdd') }}</span>
      </span>
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    tags: string[]
    maxCount?: number
    maxLength?: number
    disabled?: boolean
  }>(),
  {
    maxCount: 10,
    maxLength: 20,
    disabled: false,
  }
)

const emit = defineEmits<{
  'update:tags': [tags: string[]]
}>()

const { t } = useI18n()
const popoverOpen = ref(false)
const inputValue = ref('')
const inputRef = ref<{ focus: () => void } | null>(null)

const resolvedMaxCount = computed(() => Math.max(0, props.maxCount))
const resolvedMaxLength = computed(() => Math.max(1, props.maxLength))

function removeTag(index: number) {
  emit(
    'update:tags',
    props.tags.filter((_, i) => i !== index)
  )
}

function confirmAddTag() {
  const raw = inputValue.value.trim()
  if (!raw) return
  if (props.tags.length >= resolvedMaxCount.value) return
  if (props.tags.includes(raw)) {
    inputValue.value = ''
    return
  }
  emit('update:tags', [...props.tags, raw])
  inputValue.value = ''
  popoverOpen.value = false
}

function onPopoverOpenChange(open: boolean) {
  if (!open) {
    inputValue.value = ''
    return
  }
  setTimeout(() => inputRef.value?.focus(), 80)
}
</script>

<style scoped lang="scss">
.tag-list-editor {
  min-height: 32px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tag-list-editor__pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px 4px 12px;
  border: 1px solid color-mix(in srgb, var(--color-primary) 40%, transparent);
  border-radius: var(--radius-full);
  color: var(--color-primary);
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  font-size: 12px;
}

.tag-list-editor__text {
  max-width: var(--tag-list-editor-text-max-width, 160px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-list-editor__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  color: var(--color-primary);
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;
}

.tag-list-editor__remove:hover {
  color: var(--color-primary-hover);
  background: color-mix(in srgb, var(--color-primary) 15%, transparent);
}

.tag-list-editor__remove:focus-visible,
.tag-list-editor__add:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.tag-list-editor__remove-icon {
  font-size: 10px;
}

.tag-list-editor__add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--color-text-tertiary);
  font-size: 12px;
  cursor: pointer;
  transition:
    border-color 0.15s,
    color 0.15s;
}

.tag-list-editor__add:hover {
  border-color: var(--color-text-tertiary);
  color: var(--color-text-secondary);
}

.tag-list-editor__add-icon,
.tag-list-editor__add :deep(.anticon) {
  color: inherit;
  font-size: 12px;
}

.tag-list-editor__add-popover {
  padding: 4px;
}

.tag-list-editor__input {
  width: 192px;
}

.tag-list-editor__add-confirm {
  width: 100%;
  margin-top: 8px;
}
</style>
