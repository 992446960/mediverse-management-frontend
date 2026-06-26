<template>
  <div class="batch-action-toolbar">
    <span class="batch-action-toolbar__count">
      {{ selectedText }}
    </span>
    <a-button type="link" class="batch-action-toolbar__clear" @click="emit('clear')">
      {{ clearText }}
    </a-button>
    <a-button
      v-for="action in visiblePrimaryActions"
      :key="action.text"
      :type="action.type ?? 'default'"
      :danger="isDanger(action)"
      :style="getActionStyle(action)"
      :disabled="action.disabled"
      @click="action.handle?.()"
    >
      <template v-if="action.icon" #icon>
        <component :is="action.icon" />
      </template>
      {{ action.text }}
    </a-button>
    <a-dropdown v-if="visibleMoreActions.length > 0" :trigger="['click']">
      <a-button>
        {{ moreText }}
        <DownOutlined class="batch-action-toolbar__more-icon" />
      </a-button>
      <template #overlay>
        <a-menu>
          <a-menu-item
            v-for="action in visibleMoreActions"
            :key="action.text"
            :danger="isDanger(action)"
            :disabled="action.disabled"
            @click="action.handle?.()"
          >
            <template v-if="action.icon" #icon>
              <component :is="action.icon" />
            </template>
            <span :style="getActionStyle(action)">
              {{ action.text }}
            </span>
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { DownOutlined } from '@ant-design/icons-vue'
import type { BatchActionToolbarAction } from './types'

const props = withDefaults(
  defineProps<{
    selectedCount: number
    selectedText?: string
    clearText: string
    moreText: string
    primaryActions?: BatchActionToolbarAction[]
    moreActions?: BatchActionToolbarAction[]
  }>(),
  {
    selectedText: undefined,
    primaryActions: () => [],
    moreActions: () => [],
  }
)

const emit = defineEmits<{
  clear: []
}>()

const visiblePrimaryActions = computed(() =>
  props.primaryActions.filter((action) => action.show !== false)
)
const visibleMoreActions = computed(() =>
  props.moreActions.filter((action) => action.show !== false)
)
const selectedText = computed(() => props.selectedText ?? `已选 ${props.selectedCount} 项`)

const WARNING_COLOR = '#faad14'
const SUCCESS_COLOR = '#52c41a'

function isDanger(action: BatchActionToolbarAction) {
  return action.color === 'danger'
}

function getActionStyle(action: BatchActionToolbarAction): Record<string, string> | undefined {
  if (!action.color || action.color === 'danger') return undefined
  if (action.color === 'warning') return { color: WARNING_COLOR }
  if (action.color === 'success') return { color: SUCCESS_COLOR }
  return { color: action.color }
}
</script>

<style scoped lang="scss">
.batch-action-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  min-width: 0;
}

.batch-action-toolbar__count {
  color: var(--color-text-base);
  font-size: 14px;
  font-weight: 500;
}

.batch-action-toolbar__clear {
  height: auto;
  padding: 0;
}

.batch-action-toolbar__more-icon {
  margin-left: 4px;
  font-size: 12px;
}
</style>
