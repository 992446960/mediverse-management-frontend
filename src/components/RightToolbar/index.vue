<template>
  <div class="right-toolbar">
    <slot />
    <a-tooltip v-if="showSearch !== undefined" title="搜索">
      <a-button type="text" @click="$emit('update:showSearch', !showSearch)">
        <template #icon><SearchOutlined /></template>
      </a-button>
    </a-tooltip>
    <a-tooltip title="刷新">
      <a-button type="text" @click="$emit('refresh')">
        <template #icon><ReloadOutlined /></template>
      </a-button>
    </a-tooltip>
    <a-tooltip title="列设置">
      <a-popover trigger="click" placement="bottomRight">
        <a-button type="text">
          <template #icon><SettingOutlined /></template>
        </a-button>
        <template #content>
          <div class="column-setting">
            <a-checkbox-group
              :value="visibleColumns"
              @change="(val: string[]) => $emit('update:visibleColumns', val)"
            >
              <div v-for="col in columns" :key="col.prop" class="column-item">
                <a-checkbox :value="col.prop" :disabled="col.lock">
                  {{ col.label }}
                </a-checkbox>
              </div>
            </a-checkbox-group>
          </div>
        </template>
      </a-popover>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { SearchOutlined, ReloadOutlined, SettingOutlined } from '@ant-design/icons-vue'

interface ColumnInfo {
  prop?: string
  label?: string
  lock?: boolean
}

defineProps<{
  showSearch?: boolean
  columns?: ColumnInfo[]
  visibleColumns?: string[]
}>()

defineEmits<{
  'update:showSearch': [value: boolean]
  'update:visibleColumns': [value: string[]]
  refresh: []
}>()
</script>

<style scoped>
.right-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
}

.column-setting {
  max-height: 300px;
  overflow-y: auto;
}

.column-item {
  padding: 4px 0;
}
</style>
