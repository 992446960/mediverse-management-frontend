<template>
  <div id="tags-view-container" class="tags-view-container">
    <ScrollPane ref="scrollPaneRef" class="tags-view-wrapper" @scroll="closeContextMenu">
      <router-link
        v-for="tag in visitedViews"
        :ref="
          (el: any) => {
            if (el) tagRefs[tag.fullPath] = el.$el || el
          }
        "
        :key="tag.fullPath"
        :data-path="tag.path"
        :to="{ path: tag.path, query: tag.query }"
        class="tags-view-item"
        :class="{ active: isActive(tag) }"
        :style="activeStyle(tag)"
        @click.middle="!tag.affix ? closeTag(tag) : undefined"
        @contextmenu.prevent="openContextMenu(tag, $event)"
      >
        {{ tag.title ? t(tag.title) : tag.path }}
        <span v-if="!tag.affix" class="tags-view-item-close" @click.prevent.stop="closeTag(tag)">
          &times;
        </span>
      </router-link>
    </ScrollPane>

    <Teleport to="body">
      <ul
        v-show="contextMenu.visible"
        class="tags-view-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <li @click="refreshSelectedTag">刷新页面</li>
        <li v-if="!selectedTag?.affix" @click="closeTag(selectedTag!)">关闭当前</li>
        <li @click="closeOtherTags">关闭其他</li>
        <li v-if="!isFirstView" @click="closeLeftTags">关闭左侧</li>
        <li v-if="!isLastView" @click="closeRightTags">关闭右侧</li>
        <li @click="closeAllTags">全部关闭</li>
      </ul>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useTagsViewStore, type TagView } from '@/stores/tagsView'
import ScrollPane from './ScrollPane.vue'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const tagsViewStore = useTagsViewStore()

const scrollPaneRef = ref<InstanceType<typeof ScrollPane>>()
const tagRefs = ref<Record<string, HTMLElement>>({})

const visitedViews = computed(() => tagsViewStore.visitedViews)

const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
})
const selectedTag = ref<TagView | null>(null)

function isActive(tag: TagView) {
  return tag.path === route.path
}

/** 激活标签的动态样式：使用主题色作为背景色和边框色 */
function activeStyle(tag: TagView) {
  if (!isActive(tag)) return {}
  return {
    'background-color': 'var(--color-primary, #0EA5E9)',
    'border-color': 'var(--color-primary, #0EA5E9)',
  }
}

/** 判断选中标签是否是第一个（用于控制"关闭左侧"按钮显隐） */
const isFirstView = computed(() => {
  if (!selectedTag.value) return true
  const idx = visitedViews.value.findIndex((v) => v.fullPath === selectedTag.value!.fullPath)
  return idx <= 0 || (idx === 1 && visitedViews.value[0]?.affix)
})

/** 判断选中标签是否是最后一个（用于控制"关闭右侧"按钮显隐） */
const isLastView = computed(() => {
  if (!selectedTag.value) return true
  return selectedTag.value.fullPath === visitedViews.value[visitedViews.value.length - 1]?.fullPath
})

function addTag() {
  tagsViewStore.addView(route)
}

function closeTag(view: TagView) {
  const remaining = tagsViewStore.removeView(view)
  if (isActive(view)) {
    const lastView = remaining[remaining.length - 1]
    if (lastView) {
      router.push(lastView.fullPath)
    } else {
      router.push('/')
    }
  }
}

function refreshSelectedTag() {
  if (!selectedTag.value) return
  tagsViewStore.removeCachedView(selectedTag.value)
  nextTick(() => {
    router.replace('/redirect' + selectedTag.value!.fullPath)
  })
  closeContextMenu()
}

function closeOtherTags() {
  if (!selectedTag.value) return
  tagsViewStore.closeOtherViews(selectedTag.value)
  if (selectedTag.value.fullPath !== route.fullPath) {
    router.push(selectedTag.value.fullPath)
  }
  closeContextMenu()
}

function closeLeftTags() {
  if (!selectedTag.value) return
  tagsViewStore.closeLeftViews(selectedTag.value)
  closeContextMenu()
}

function closeRightTags() {
  if (!selectedTag.value) return
  tagsViewStore.closeRightViews(selectedTag.value)
  closeContextMenu()
}

function closeAllTags() {
  const remaining = tagsViewStore.closeAllViews()
  const lastView = remaining[remaining.length - 1]
  if (lastView) {
    router.push(lastView.fullPath)
  } else {
    router.push('/')
  }
  closeContextMenu()
}

function openContextMenu(tag: TagView, e: MouseEvent) {
  selectedTag.value = tag
  contextMenu.x = e.clientX
  contextMenu.y = e.clientY
  contextMenu.visible = true
}

function closeContextMenu() {
  contextMenu.visible = false
}

onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

watch(
  route,
  () => {
    addTag()
    nextTick(() => {
      const activeEl = tagRefs.value[route.fullPath]
      if (activeEl && scrollPaneRef.value) {
        scrollPaneRef.value.scrollToTarget(activeEl)
      }
    })
  },
  { immediate: true }
)
</script>

<style scoped>
/* ===== 容器：sticky 置于本层（ScrollPane 内 overflow:hidden 会阻止子级 sticky 相对视口生效） ===== */
.tags-view-container {
  position: sticky;
  top: var(--layout-header-height);
  z-index: 98;
  height: 34px;
  width: 100%;
  background: var(--color-bg-container, #fff);
  border-bottom: 1px solid var(--color-border-secondary, #d8dce5);
  box-shadow:
   0 1px 3px 0 rgba(0, 0, 0, 0.08),
    0 0 3px 0 rgba(0, 0, 0, 0.04);
}

/* ===== 标签项（inline-flex：圆点 / 文案 / 关闭钮垂直居中） ===== */
.tags-view-item {
  display: inline-flex;
  align-items: center;
  position: relative;
  cursor: pointer;
  height: 26px;
  line-height: 1;
  border: 1px solid var(--color-border-secondary, #d8dce5);
  color: var(--color-text-secondary, #495060);
  background: var(--color-bg-container, #fff);
  padding: 0 8px;
  font-size: 12px;
  margin-left: 5px;
  margin-top: 4px;
  text-decoration: none;
  white-space: nowrap;
  gap: 4px;
}

.tags-view-item:first-of-type {
  margin-left: 15px;
}

.tags-view-item:last-of-type {
  margin-right: 15px;
}

/* 激活状态：主题色背景 + 白色圆点（参考 jkjn） */
.tags-view-item.active {
  color: #fff;
  border-color: var(--color-primary, #0ea5e9);
}

.tags-view-item.active::before {
  content: '';
  background: #fff;
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* ===== 关闭图标 ===== */
.tags-view-item-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  font-size: 14px;
  line-height: 1;
  border-radius: 50%;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
  transform-origin: 100% 50%;
  margin-left: 0;
}

.tags-view-item-close:hover {
  background-color: #b4bccc;
  color: #fff;
  width: 14px;
  height: 14px;
  font-size: 12px;
}

.tags-view-item.active .tags-view-item-close:hover {
  background-color: rgba(255, 255, 255, 0.35);
}

/* ===== 右键菜单 ===== */
.tags-view-context-menu {
  margin: 0;
  background: var(--color-bg-container, #fff);
  z-index: 3000;
  position: fixed;
  list-style-type: none;
  padding: 5px 0;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  color: var(--color-text-base, #333);
  box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);
}

.tags-view-context-menu li {
  margin: 0;
  padding: 7px 16px;
  cursor: pointer;
  transition: background 0.2s;
}

.tags-view-context-menu li:hover {
  background: var(--color-bg-layout, #eee);
}

/* ===== 暗色模式适配 ===== */
.dark .tags-view-container {
  box-shadow:
    0 1px 3px 0 rgba(0, 0, 0, 0.2),
    0 0 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .tags-view-item-close:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.dark .tags-view-context-menu {
  box-shadow: 2px 2px 6px 0 rgba(0, 0, 0, 0.5);
}
</style>
