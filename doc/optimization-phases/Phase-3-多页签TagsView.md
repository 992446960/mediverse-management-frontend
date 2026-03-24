# Phase 3: 多页签 TagsView + Keep-alive

> **风险等级**：🟡 中 | **预估工作量**：4 天 | **前置依赖**：Phase 1.3 (Redirect 路由)

## 概述

实现多页签导航系统（TagsView），允许用户在已访问的页面间快速切换，并通过 Vue `<keep-alive>` 缓存页面组件状态，避免重复渲染。

### 关键风险点

1. **App.vue 修改**：需在 `<transition>` 内部包裹 `<keep-alive>`，影响所有路由组件的生命周期
2. **SSE 页面**：chat 和 knowledge-base 页面使用 SSE 长连接，如果被 keep-alive 缓存会导致连接不断开 → 必须排除
3. **表单页面**：缓存可能导致表单"脏数据"残留 → 通过 `meta.noCache` 控制

### 缓解策略

- chat、knowledge-base 路由设置 `meta.noCache: true`，排除在 keep-alive 之外
- 通过 `tagsView store` 的 `cachedViews` 动态控制缓存列表
- 只要 `<keep-alive :include="cachedViews">`，未在列表中的组件不会被缓存

---

## 3.1 TagsView Store

### 目标

管理已访问页签列表（visitedViews）和缓存组件列表（cachedViews）。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/stores/tagsView.ts` | 新增 | 独立 store |

### 实施步骤

#### 新建 `src/stores/tagsView.ts`

```typescript
import { defineStore } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'

export interface TagView {
  /** 路由完整路径 */
  fullPath: string
  /** 路由 path（不含 query/hash） */
  path: string
  /** 路由 name（keep-alive 的 include 需要组件 name） */
  name: string
  /** 页签标题（i18n key） */
  title: string
  /** 是否固定页签（不可关闭） */
  affix?: boolean
  /** 路由 query */
  query?: Record<string, any>
  /** 路由 meta */
  meta?: Record<string, any>
}

export const useTagsViewStore = defineStore('tagsView', () => {
  /** 已访问的页签列表 */
  const visitedViews = ref<TagView[]>([])
  /** 缓存的组件 name 列表（用于 keep-alive include） */
  const cachedViews = ref<string[]>([])

  // ===================== visitedViews 操作 =====================

  function addVisitedView(route: RouteLocationNormalized) {
    // 不添加隐藏路由（如 redirect）
    if (route.meta.hidden) return
    // 已存在则更新 fullPath（同 path 不同 query 时更新）
    const index = visitedViews.value.findIndex((v) => v.path === route.path)
    if (index >= 0) {
      visitedViews.value[index] = { ...visitedViews.value[index], fullPath: route.fullPath, query: route.query as Record<string, any> }
      return
    }
    visitedViews.value.push({
      fullPath: route.fullPath,
      path: route.path,
      name: (route.name as string) || '',
      title: (route.meta.title as string) || '',
      affix: route.meta.affix as boolean | undefined,
      query: route.query as Record<string, any>,
      meta: route.meta as Record<string, any>,
    })
  }

  function removeVisitedView(view: TagView) {
    const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
    if (index >= 0) {
      visitedViews.value.splice(index, 1)
    }
  }

  // ===================== cachedViews 操作 =====================

  function addCachedView(route: RouteLocationNormalized) {
    const name = route.name as string
    if (!name) return
    if (route.meta.noCache) return
    if (cachedViews.value.includes(name)) return
    cachedViews.value.push(name)
  }

  function removeCachedView(view: TagView) {
    const index = cachedViews.value.indexOf(view.name)
    if (index >= 0) {
      cachedViews.value.splice(index, 1)
    }
  }

  // ===================== 组合操作 =====================

  /** 添加页签 + 缓存 */
  function addView(route: RouteLocationNormalized) {
    addVisitedView(route)
    addCachedView(route)
  }

  /** 关闭页签 + 移除缓存 */
  function removeView(view: TagView): TagView[] {
    removeVisitedView(view)
    removeCachedView(view)
    return [...visitedViews.value]
  }

  /** 关闭其他页签 */
  function closeOtherViews(view: TagView) {
    visitedViews.value = visitedViews.value.filter(
      (v) => v.affix || v.fullPath === view.fullPath
    )
    cachedViews.value = cachedViews.value.filter(
      (name) => name === view.name || visitedViews.value.some((v) => v.name === name && v.affix)
    )
  }

  /** 关闭左侧页签 */
  function closeLeftViews(view: TagView) {
    const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
    if (index <= 0) return
    const removed = visitedViews.value.filter((v, i) => i < index && !v.affix)
    removed.forEach((v) => {
      removeVisitedView(v)
      removeCachedView(v)
    })
  }

  /** 关闭右侧页签 */
  function closeRightViews(view: TagView) {
    const index = visitedViews.value.findIndex((v) => v.fullPath === view.fullPath)
    if (index < 0) return
    const removed = visitedViews.value.filter((v, i) => i > index && !v.affix)
    removed.forEach((v) => {
      removeVisitedView(v)
      removeCachedView(v)
    })
  }

  /** 关闭所有页签（保留 affix） */
  function closeAllViews(): TagView[] {
    visitedViews.value = visitedViews.value.filter((v) => v.affix)
    cachedViews.value = visitedViews.value.map((v) => v.name).filter(Boolean)
    return [...visitedViews.value]
  }

  /** 初始化固定页签（从路由配置中提取 meta.affix 的路由） */
  function initAffixTags(routes: RouteLocationNormalized[]) {
    routes.forEach((route) => {
      if (route.meta.affix && route.name) {
        addVisitedView(route)
        addCachedView(route)
      }
    })
  }

  return {
    visitedViews,
    cachedViews,
    addView,
    removeView,
    closeOtherViews,
    closeLeftViews,
    closeRightViews,
    closeAllViews,
    initAffixTags,
    addVisitedView,
    removeCachedView,
  }
})
```

---

## 3.2 TagsView 组件

### 目标

在 header 下方展示可交互的页签栏，支持关闭/右键菜单/滚动。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/components/TagsView/index.vue` | 新增 | 独立组件 |
| `src/components/TagsView/ScrollPane.vue` | 新增 | 独立组件 |

### 实施步骤

#### 新建 `src/components/TagsView/ScrollPane.vue`

```vue
<template>
  <div ref="scrollContainer" class="scroll-container" @wheel.prevent="handleWheel">
    <div ref="scrollWrapper" class="scroll-wrapper" :style="{ transform: `translateX(${scrollLeft}px)` }">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const scrollContainer = ref<HTMLElement>()
const scrollWrapper = ref<HTMLElement>()
const scrollLeft = ref(0)

function handleWheel(e: WheelEvent) {
  const wrapperWidth = scrollWrapper.value?.offsetWidth || 0
  const containerWidth = scrollContainer.value?.offsetWidth || 0
  const maxScroll = Math.min(0, containerWidth - wrapperWidth)

  scrollLeft.value = Math.max(maxScroll, Math.min(0, scrollLeft.value - e.deltaY))
}

/** 滚动到指定标签位置（外部调用） */
function scrollToTarget(targetEl: HTMLElement) {
  const containerWidth = scrollContainer.value?.offsetWidth || 0
  const targetLeft = targetEl.offsetLeft
  const targetWidth = targetEl.offsetWidth

  if (targetLeft < -scrollLeft.value) {
    scrollLeft.value = -targetLeft
  } else if (targetLeft + targetWidth > -scrollLeft.value + containerWidth) {
    scrollLeft.value = -(targetLeft + targetWidth - containerWidth)
  }
}

defineExpose({ scrollToTarget })
</script>

<style scoped>
.scroll-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  white-space: nowrap;
}
.scroll-wrapper {
  display: inline-flex;
  transition: transform 0.3s;
}
</style>
```

#### 新建 `src/components/TagsView/index.vue`

```vue
<template>
  <div class="tags-view-container">
    <ScrollPane ref="scrollPaneRef" class="tags-view-wrapper">
      <router-link
        v-for="tag in visitedViews"
        :ref="(el: any) => { if (el) tagRefs[tag.fullPath] = el.$el || el }"
        :key="tag.fullPath"
        :to="{ path: tag.path, query: tag.query }"
        class="tags-view-item"
        :class="{ active: isActive(tag) }"
        @contextmenu.prevent="openContextMenu(tag, $event)"
      >
        {{ tag.title ? t(tag.title) : tag.path }}
        <span
          v-if="!tag.affix"
          class="tags-view-item-close"
          @click.prevent.stop="closeTag(tag)"
        >
          &times;
        </span>
      </router-link>
    </ScrollPane>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <ul
        v-show="contextMenu.visible"
        class="tags-view-context-menu"
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      >
        <li @click="refreshSelectedTag">刷新页面</li>
        <li v-if="!selectedTag?.affix" @click="closeTag(selectedTag!)">关闭当前</li>
        <li @click="closeOtherTags">关闭其他</li>
        <li @click="closeLeftTags">关闭左侧</li>
        <li @click="closeRightTags">关闭右侧</li>
        <li @click="closeAllTags">关闭所有</li>
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
  return tag.fullPath === route.fullPath
}

// 添加当前路由到页签
function addTag() {
  tagsViewStore.addView(route)
}

// 关闭页签
function closeTag(view: TagView) {
  const remaining = tagsViewStore.removeView(view)
  if (isActive(view)) {
    // 关闭当前页签后，跳转到最后一个页签
    const lastView = remaining[remaining.length - 1]
    if (lastView) {
      router.push(lastView.fullPath)
    } else {
      router.push('/')
    }
  }
}

// 刷新当前页签（通过 redirect 路由）
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

// 点击页面其他区域关闭右键菜单
onMounted(() => {
  document.addEventListener('click', closeContextMenu)
})
onUnmounted(() => {
  document.removeEventListener('click', closeContextMenu)
})

// 路由变化时添加页签
watch(route, () => {
  addTag()
  // 滚动到当前激活的页签
  nextTick(() => {
    const activeEl = tagRefs.value[route.fullPath]
    if (activeEl && scrollPaneRef.value) {
      scrollPaneRef.value.scrollToTarget(activeEl)
    }
  })
}, { immediate: true })
</script>

<style scoped>
.tags-view-container {
  height: 34px;
  width: 100%;
  background: var(--color-bg-container);
  border-bottom: 1px solid var(--color-border-secondary);
  display: flex;
  align-items: center;
  padding: 0 8px;
  box-sizing: border-box;
}

.tags-view-wrapper {
  flex: 1;
  min-width: 0;
}

.tags-view-item {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  margin: 0 2px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg-layout);
  border: 1px solid var(--color-border-secondary);
  border-radius: 4px;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.tags-view-item:hover {
  color: var(--color-primary);
}

.tags-view-item.active {
  color: #fff;
  background-color: var(--color-primary, #0EA5E9);
  border-color: var(--color-primary, #0EA5E9);
}

.tags-view-item-close {
  margin-left: 6px;
  font-size: 14px;
  line-height: 1;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.tags-view-item-close:hover {
  background-color: rgba(0, 0, 0, 0.15);
  color: #fff;
}

.tags-view-context-menu {
  position: fixed;
  z-index: 3000;
  list-style: none;
  padding: 4px 0;
  margin: 0;
  background: var(--color-bg-container);
  border-radius: 6px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12);
  min-width: 120px;
}

.tags-view-context-menu li {
  padding: 6px 16px;
  font-size: 13px;
  color: var(--color-text-base);
  cursor: pointer;
  transition: background 0.2s;
}

.tags-view-context-menu li:hover {
  background: var(--color-bg-layout);
}
</style>
```

---

## 3.3 集成到布局和路由

### 影响分析

| 文件 | 变更类型 | 影响范围 | 风险 |
|------|---------|---------|------|
| `src/layouts/MainLayout.vue` | 修改 | header 下方插入 TagsView | 🟢 低 |
| `src/App.vue` | 修改 | router-view 包裹 keep-alive | 🟡 中 |
| `src/router/routes.ts` | 修改 | 补充 meta 字段 | 🟢 低 |
| `src/router/guards.ts` | 修改 | afterEach 中添加页签 | 🟢 低 |

### 实施步骤

#### Step 1: 修改 `src/router/routes.ts` — 补充 meta 字段

为需要特殊处理的路由添加 `noCache` 和 `affix`：

```diff
   {
     path: '/',
     name: 'Dashboard',
     component: () => import('@/views/Dashboard.vue'),
     meta: {
       layout: 'MainLayout',
       title: 'menu.dashboard',
       requiresAuth: true,
+      affix: true,         // 固定页签，不可关闭
     },
   },
```

```diff
   {
     path: '/chat',
     component: () => import('@/views/chat/layout.vue'),
     meta: {
       layout: 'MainLayout',
       title: 'menu.digitalDoctor',
       requiresAuth: true,
+      noCache: true,        // SSE 长连接，不缓存
     },
     children: [
       {
         path: '',
         name: 'ChatHome',
         component: () => import('@/views/chat/index.vue'),
-        meta: { title: 'menu.digitalDoctor' },
+        meta: { title: 'menu.digitalDoctor', noCache: true },
       },
       {
         path: 'session/:id',
         name: 'ChatSession',
         component: () => import('@/views/chat/Session.vue'),
-        meta: { title: 'menu.digitalDoctor', hidden: true },
+        meta: { title: 'menu.digitalDoctor', hidden: true, noCache: true },
       },
     ],
   },
```

```diff
   {
     path: '/knowledge-base',
     name: 'KnowledgeBase',
     component: () => import('@/views/knowledge-base/index.vue'),
     meta: {
       layout: 'MainLayout',
       title: 'menu.knowledgeBase',
       requiresAuth: true,
+      noCache: true,        // SSE 搜索，不缓存
     },
   },
```

同时更新 `src/types/router.ts`：

```diff
 declare module 'vue-router' {
   interface RouteMeta {
     title?: string
     icon?: string
     requiresAuth?: boolean
     roles?: string[]
     requiredRoles?: UserRole[]
     keepAlive?: boolean
     hidden?: boolean
     order?: number
+    noCache?: boolean     // true 时不被 keep-alive 缓存
+    affix?: boolean       // true 时页签固定不可关闭
   }
 }
```

#### Step 2: 修改 `src/layouts/MainLayout.vue` — 插入 TagsView

在 `<a-layout-header>` 与 `<a-layout-content>` 之间插入：

```diff
       </a-layout-header>
+      <TagsView />
       <a-layout-content class="content">
```

script 中新增 import：

```diff
 import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
+import TagsView from '@/components/TagsView/index.vue'
```

#### Step 3: 修改 `src/App.vue` — 包裹 keep-alive

**这是风险最高的改动**，需仔细对比。

修改前：
```vue
<component :is="layout">
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</component>
```

修改后：
```vue
<component :is="layout">
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <keep-alive :include="cachedViews">
        <component :is="Component" :key="route.fullPath" />
      </keep-alive>
    </transition>
  </router-view>
</component>
```

script 中新增：
```diff
+import { useTagsViewStore } from '@/stores/tagsView'

+const tagsViewStore = useTagsViewStore()
+const cachedViews = computed(() => tagsViewStore.cachedViews)
```

### 关键注意事项

1. **`keep-alive :include` 匹配的是组件的 `name`**，不是路由 `name`。确保需要缓存的页面组件都有 `defineOptions({ name: 'XXX' })` 且与路由 `name` 一致。

2. **需要为要缓存的页面组件补充 `name`**，例如：

   ```vue
   <!-- src/views/Dashboard.vue -->
   <script setup lang="ts">
   defineOptions({ name: 'Dashboard' })
   // ...
   </script>
   ```

   需要补充 name 的组件列表（与路由 name 对应）：
   - `Dashboard.vue` → `name: 'Dashboard'`
   - `admin/Users/index.vue` → `name: 'AdminUsers'`
   - `admin/Departments/index.vue` → `name: 'AdminDepartments'`
   - `admin/Organizations/index.vue` → `name: 'AdminOrganizations'`
   - `admin/Avatars/index.vue` → `name: 'AdminAvatars'`
   - `admin/ApiTokens/index.vue` → `name: 'AdminApiTokens'`
   - `my/Files.vue` → `name: 'MyFiles'`
   - `my/KnowledgeCards.vue` → `name: 'MyKnowledgeCards'`
   - `my/Profile.vue` → `name: 'MyProfile'`
   - 等（所有需要缓存的视图组件）

3. **不需要缓存的页面**（`noCache: true`）不需要补 name，因为它们不会被加入 `cachedViews`。

---

## 回滚方案

如果 keep-alive 导致问题：

1. `App.vue` 中移除 `<keep-alive>` 包裹，恢复原始 `<transition>` 直接包裹 `<component>`
2. `MainLayout.vue` 中移除 `<TagsView />`
3. 以上操作不影响 tagsView store 和 TagsView 组件文件的存在（可保留待后续修复）

---

## 完成标志

- [ ] 页面顶部出现页签栏，访问过的页面显示为页签
- [ ] Dashboard 页签固定，不可关闭
- [ ] 右键页签出现操作菜单（刷新/关闭当前/关闭其他/关闭左侧/关闭右侧/关闭所有）
- [ ] 切换页签时，已缓存页面不重新渲染（如表格滚动位置保持）
- [ ] chat 和 knowledge-base 页面**不被缓存**（切换后重新加载）
- [ ] 刷新当前页签功能正常（通过 /redirect 路由）
- [ ] SSE 连接在离开 chat 页面后正常断开
- [ ] `pnpm dev` 无报错，TypeScript 编译通过
