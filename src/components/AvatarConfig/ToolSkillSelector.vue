<template>
  <a-modal
    v-model:open="modalOpen"
    :title="title"
    :width="760"
    :ok-text="t('avatar.advanced.confirmSelected', { count: draftSelected.length })"
    :cancel-text="t('common.cancel')"
    @ok="confirmSelection"
  >
    <div class="tool-skill-selector">
      <a-input
        v-model:value="keyword"
        :placeholder="searchPlaceholder"
        allow-clear
        class="tool-skill-selector-search"
      >
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input>

      <div
        class="tool-skill-selector-body"
        :class="{ 'tool-skill-selector-body--flat': !showGroups }"
      >
        <aside v-if="showGroups" class="tool-skill-selector-tabs">
          <button
            v-for="group in tabGroups"
            :key="group.key"
            type="button"
            class="tool-skill-selector-tab"
            :class="{ 'tool-skill-selector-tab--active': activeGroup === group.key }"
            @click="activeGroup = group.key"
          >
            {{ group.label }}
          </button>
        </aside>

        <div class="tool-skill-selector-list">
          <a-empty
            v-if="filteredItems.length === 0"
            :description="t('avatar.advanced.emptySelector')"
          />
          <template v-else>
            <button
              v-for="item in filteredItems"
              :key="item.name"
              type="button"
              class="tool-skill-selector-card"
              :class="{ 'tool-skill-selector-card--selected': draftSelected.includes(item.name) }"
              @click="toggleItem(item.name)"
            >
              <div class="tool-skill-selector-card-icon">
                {{ item.label?.slice(0, 1) || item.name.slice(0, 1).toUpperCase() }}
              </div>
              <div class="tool-skill-selector-card-main">
                <div class="tool-skill-selector-card-title">{{ item.label || item.name }}</div>
                <div class="tool-skill-selector-card-desc">{{ item.description }}</div>
              </div>
              <a-checkbox
                :checked="draftSelected.includes(item.name)"
                @click.stop
                @change="toggleItem(item.name)"
              />
            </button>
          </template>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { SearchOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'

export interface ToolSkillSelectorItem {
  name: string
  label?: string
  description: string
  category?: string
}

export interface ToolSkillSelectorGroup {
  key: string
  label: string
  items: ToolSkillSelectorItem[]
}

const ALL_GROUP_KEY = '__all__'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    searchPlaceholder: string
    groups: ToolSkillSelectorGroup[]
    selectedKeys: string[]
    showGroups?: boolean
  }>(),
  {
    showGroups: false,
  }
)

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [value: string[]]
}>()

const { t } = useI18n()
const keyword = ref('')
const activeGroup = ref(ALL_GROUP_KEY)
const draftSelected = ref<string[]>([])

const modalOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const allItems = computed(() => props.groups.flatMap((group) => group.items))
const tabGroups = computed(() => [
  { key: ALL_GROUP_KEY, label: t('common.all'), items: allItems.value },
  ...props.groups,
])

const activeItems = computed(() => {
  if (activeGroup.value === ALL_GROUP_KEY) return allItems.value
  return props.groups.find((group) => group.key === activeGroup.value)?.items ?? []
})

const filteredItems = computed(() => {
  const query = keyword.value.trim().toLowerCase()
  if (!query) return activeItems.value
  return activeItems.value.filter((item) =>
    [item.name, item.label, item.description, item.category]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  )
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    keyword.value = ''
    activeGroup.value = ALL_GROUP_KEY
    draftSelected.value = [...props.selectedKeys]
  }
)

function toggleItem(name: string) {
  draftSelected.value = draftSelected.value.includes(name)
    ? draftSelected.value.filter((item) => item !== name)
    : [...draftSelected.value, name]
}

function confirmSelection() {
  emit('confirm', draftSelected.value)
  modalOpen.value = false
}
</script>

<style scoped lang="scss">
.tool-skill-selector {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tool-skill-selector-search {
  width: 100%;
}

.tool-skill-selector-body {
  display: grid;
  grid-template-columns: 132px minmax(0, 1fr);
  gap: 16px;
  min-height: 360px;
}

.tool-skill-selector-body--flat {
  grid-template-columns: 1fr;
}

.tool-skill-selector-tabs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 1px solid var(--color-border, #e5e7eb);
  padding-right: 12px;
}

.tool-skill-selector-tab {
  width: 100%;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  font-size: 13px;
  padding: 8px 10px;
  text-align: left;
  transition:
    background 0.15s,
    color 0.15s;
}

.tool-skill-selector-tab:hover,
.tool-skill-selector-tab--active {
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
}

.tool-skill-selector-list {
  display: grid;
  align-content: start;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-height: 380px;
  overflow-y: auto;
  padding-right: 4px;
}

.tool-skill-selector-card {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  padding: 12px;
  text-align: left;
  transition:
    border-color 0.15s,
    box-shadow 0.15s,
    background 0.15s;
}

.tool-skill-selector-card:hover,
.tool-skill-selector-card--selected {
  border-color: rgba(14, 165, 233, 0.65);
  background: rgba(14, 165, 233, 0.04);
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.1);
}

.tool-skill-selector-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  font-size: 15px;
  font-weight: 600;
}

.tool-skill-selector-card-main {
  min-width: 0;
}

.tool-skill-selector-card-title {
  color: #111827;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-skill-selector-card-desc {
  color: #6b7280;
  display: -webkit-box;
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 768px) {
  .tool-skill-selector-body {
    grid-template-columns: 1fr;
  }

  .tool-skill-selector-tabs {
    border-right: 0;
    border-bottom: 1px solid var(--color-border, #e5e7eb);
    flex-direction: row;
    overflow-x: auto;
    padding: 0 0 8px;
  }

  .tool-skill-selector-tab {
    white-space: nowrap;
    width: auto;
  }

  .tool-skill-selector-list {
    grid-template-columns: 1fr;
  }
}
</style>
