<template>
  <nav class="page-head flex items-center justify-between h-10">
    <div class="flex items-center gap-2">
      <a-button
        v-if="headConf.backLeft"
        type="link"
        class="page-head__back text-sm text-slate-500 hover:text-primary"
        @click="onBackClick"
      >
        <template #icon>
          <ArrowLeftOutlined />
        </template>
        返回
      </a-button>
      <span v-if="headConf.title" class="page-head__title text-base font-bold text-slate-800 dark:text-slate-100">
        {{ headConf.title }}
      </span>
      <a-tooltip v-if="headConf.intro" :title="headConf.intro">
        <QuestionCircleOutlined class="text-slate-400 cursor-help" />
      </a-tooltip>
    </div>

    <div class="flex items-center gap-2">
      <template v-for="btn in filteredBtns" :key="btn.text">
        <a-button
          v-if="btn.permission?.length"
          v-permission="btn.permission"
          :type="(btn.type as 'primary' | 'default' | 'dashed' | 'text' | 'link') ?? 'default'"
          @click="onBtnClick(btn)"
        >
          <template v-if="btn.icon" #icon>
            <component :is="btn.icon" />
          </template>
          {{ btn.text }}
        </a-button>
        <a-button
          v-else-if="btn.show !== false"
          :type="(btn.type as 'primary' | 'default' | 'dashed' | 'text' | 'link') ?? 'default'"
          @click="onBtnClick(btn)"
        >
          <template v-if="btn.icon" #icon>
            <component :is="btn.icon" />
          </template>
          {{ btn.text }}
        </a-button>
      </template>
      <slot />
    </div>
  </nav>

  <a-tabs
    v-if="internalTabsOptions.length > 0"
    v-model:active-key="activeTab"
    type="line"
    class="page-head__tabs mt-2.5"
    @change="onTabChange"
  >
    <a-tab-pane v-for="tab in internalTabsOptions" :key="tab.value" :tab="tab.label" />
  </a-tabs>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined, QuestionCircleOutlined } from '@ant-design/icons-vue'
import type { PageHeadConfig, PageHeadBtn } from './types'

const props = defineProps<{
  headConf: PageHeadConfig
}>()

const router = useRouter()

const activeTab = ref<string | number>(
  props.headConf.defaultTab ?? props.headConf.tabsOptions?.[0]?.value ?? ''
)
const internalTabsOptions = ref<Array<{ label: string; value: string | number }>>(
  props.headConf.tabsOptions ?? []
)

const filteredBtns = computed<PageHeadBtn[]>(() => {
  const btns = props.headConf.btns ?? []
  return btns.filter((btn) => {
    if (btn.permission?.length) return true
    return btn.show !== false
  })
})

function onBackClick() {
  router.go(-1)
}

function onBtnClick(btn: PageHeadBtn) {
  btn.handle?.()
}

function onTabChange(key: string | number) {
  activeTab.value = key
  props.headConf.tabChangeHandle?.(key)
}

function updateTabsOptions(newOptions: Array<{ label: string; value: string | number }>) {
  internalTabsOptions.value = newOptions
}

defineExpose({
  activeTab,
  updateTabsOptions,
})
</script>
