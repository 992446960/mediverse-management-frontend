# Phase 4: 响应式布局适配

> **风险等级**：🟠 中高 | **预估工作量**：3 天 | **前置依赖**：Phase 3（TagsView 需适配移动端隐藏）
>
> **建议在独立 Git 分支实施，完成后进行完整回归测试**

## 概述

将当前桌面端固定布局改造为响应式布局：移动端（< 992px）侧边栏自动切换为抽屉模式，并将侧边栏折叠状态迁移到 Pinia Store 实现跨组件共享与持久化。

### 关键风险点

1. **MainLayout.vue 核心改动**：侧边栏从 `<a-layout-sider>` 条件切换为 `<a-drawer>`
2. **状态迁移**：`collapsed` 从本地 ref 迁移到 store，需确保所有引用点同步更新
3. **CSS 改动**：移除 `min-width: 1000px` 硬编码，可能影响桌面端布局

---

## 4.1 App Store — 侧边栏状态抽取

### 目标

将 MainLayout 中的本地 `collapsed` ref 迁移到独立的 `app` store，便于全局访问和持久化。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/stores/app.ts` | 新增 | 独立 store |
| `src/layouts/MainLayout.vue` | 修改 | `collapsed` 从 ref 改读 store（5 处引用） |

### 安全评估

- MainLayout 中 `collapsed` 共 5 处引用：
  1. `ref(false)` 声明 → 删除
  2. `v-model:collapsed="collapsed"` → 改为 `v-model:collapsed="appStore.sidebar.collapsed"`
  3. `v-if="collapsed"` (菜单图标切换) → `v-if="appStore.sidebar.collapsed"`
  4. `@click="() => (collapsed = !collapsed)"` × 2 → `@click="appStore.toggleSidebar"`
  5. `:style="{ marginLeft: collapsed ? '80px' : '200px' }"` → 改读 store
- 改动后**行为完全等价**，仅数据源从 ref 变为 store

### 实施步骤

#### 新建 `src/stores/app.ts`

```typescript
import { defineStore } from 'pinia'

export type DeviceType = 'desktop' | 'mobile'

export const useAppStore = defineStore('app', () => {
  const sidebar = reactive({
    collapsed: false,
    /** 移动端抽屉是否打开 */
    drawerVisible: false,
  })

  const device = ref<DeviceType>('desktop')

  const isMobile = computed(() => device.value === 'mobile')

  function toggleSidebar() {
    if (isMobile.value) {
      sidebar.drawerVisible = !sidebar.drawerVisible
    } else {
      sidebar.collapsed = !sidebar.collapsed
    }
  }

  function closeSidebar() {
    if (isMobile.value) {
      sidebar.drawerVisible = false
    }
  }

  function openSidebar() {
    if (isMobile.value) {
      sidebar.drawerVisible = true
    }
  }

  function setDevice(type: DeviceType) {
    device.value = type
    if (type === 'mobile') {
      sidebar.collapsed = false
      sidebar.drawerVisible = false
    }
  }

  return {
    sidebar,
    device,
    isMobile,
    toggleSidebar,
    closeSidebar,
    openSidebar,
    setDevice,
  }
})
```

#### 修改 `src/layouts/MainLayout.vue` — Step 1: 状态迁移

**仅替换 collapsed 的数据源，不改布局结构（先确保等价）：**

script 部分：
```diff
+import { useAppStore } from '@/stores/app'

-const collapsed = ref(false)
+const appStore = useAppStore()
 const selectedKeys = ref<string[]>([])
 const openKeys = ref<string[]>([])
```

template 部分：
```diff
     <a-layout-sider
-      v-model:collapsed="collapsed"
+      v-model:collapsed="appStore.sidebar.collapsed"
       collapsible
       :trigger="null"

       <!-- Logo -->
-      <span v-if="!collapsed">Mediverse</span>
+      <span v-if="!appStore.sidebar.collapsed">Mediverse</span>

     <!-- Menu toggle buttons -->
       <menu-unfold-outlined
-        v-if="collapsed"
+        v-if="appStore.sidebar.collapsed"
         class="trigger"
-        @click="() => (collapsed = !collapsed)"
+        @click="appStore.toggleSidebar"
       />
-      <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
+      <menu-fold-outlined v-else class="trigger" @click="appStore.toggleSidebar" />

     <!-- Main right layout margin -->
     <a-layout
       class="main-right-layout"
-      :style="{ marginLeft: collapsed ? '80px' : '200px', transition: 'margin-left 0.2s' }"
+      :style="{ marginLeft: appStore.sidebar.collapsed ? '80px' : '200px', transition: 'margin-left 0.2s' }"
     >
```

**验证**：此步改完后，行为与改前完全一致。

---

## 4.2 响应式窗口监听

### 目标

监听窗口尺寸变化，自动切换 device 类型。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/composables/useWindowResize.ts` | 新增 | 独立 composable |

### 实施步骤

#### 新建 `src/composables/useWindowResize.ts`

```typescript
import { useAppStore } from '@/stores/app'

const MOBILE_BREAKPOINT = 992

/**
 * 监听窗口尺寸，自动切换 device 类型
 * 在 MainLayout 的 setup 中调用一次即可
 */
export function useWindowResize() {
  const appStore = useAppStore()

  function handleResize() {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT
    appStore.setDevice(isMobile ? 'mobile' : 'desktop')
  }

  onMounted(() => {
    handleResize() // 初始化
    window.addEventListener('resize', handleResize)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
  })

  return {
    isMobile: computed(() => appStore.isMobile),
  }
}
```

---

## 4.3 移动端 Drawer 适配

### 目标

移动端下侧边栏替换为 `<a-drawer>`，点击菜单后自动关闭抽屉。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/layouts/MainLayout.vue` | 修改 | template 条件渲染 + CSS |

### 安全评估

- 桌面端（>= 992px）：保持现有 `<a-layout-sider>` 行为不变
- 移动端（< 992px）：替换为 `<a-drawer>` + 去掉 content 区 marginLeft
- 菜单组件**复用同一个**，仅外层容器切换 → selectedKeys/openKeys 逻辑不变

### 实施步骤

#### 修改 `src/layouts/MainLayout.vue` — template

将侧边栏部分改为条件渲染：

```vue
<template>
  <a-layout class="main-layout">
    <!-- 桌面端：固定侧边栏 -->
    <a-layout-sider
      v-if="!appStore.isMobile"
      v-model:collapsed="appStore.sidebar.collapsed"
      collapsible
      :trigger="null"
      class="sider"
      :style="{
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-bg-sidebar-border)',
      }"
    >
      <div class="logo">
        <span v-if="!appStore.sidebar.collapsed">Mediverse</span>
        <span v-else>M</span>
      </div>
      <a-menu
        v-model:selected-keys="selectedKeys"
        v-model:open-keys="openKeys"
        :theme="themeStore.isDark ? 'dark' : 'light'"
        mode="inline"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </a-layout-sider>

    <!-- 移动端：抽屉侧边栏 -->
    <a-drawer
      v-if="appStore.isMobile"
      :open="appStore.sidebar.drawerVisible"
      placement="left"
      :closable="false"
      :width="200"
      :body-style="{ padding: 0, background: 'var(--color-bg-sidebar)' }"
      @close="appStore.closeSidebar"
    >
      <div class="logo">
        <span>Mediverse</span>
      </div>
      <a-menu
        v-model:selected-keys="selectedKeys"
        v-model:open-keys="openKeys"
        :theme="themeStore.isDark ? 'dark' : 'light'"
        mode="inline"
        :items="menuItems"
        @click="handleMenuClickMobile"
      />
    </a-drawer>

    <a-layout
      class="main-right-layout"
      :style="{
        marginLeft: appStore.isMobile ? '0' : (appStore.sidebar.collapsed ? '80px' : '200px'),
        transition: 'margin-left 0.2s'
      }"
    >
      <a-layout-header class="header">
        <div class="header-left">
          <!-- 移动端和桌面端共用 toggle 按钮 -->
          <menu-unfold-outlined
            v-if="appStore.sidebar.collapsed || appStore.isMobile"
            class="trigger"
            @click="appStore.toggleSidebar"
          />
          <menu-fold-outlined
            v-else
            class="trigger"
            @click="appStore.toggleSidebar"
          />
          <a-breadcrumb>
            <!-- ... 面包屑不变 ... -->
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <!-- ... 不变 ... -->
        </div>
      </a-layout-header>
      <!-- TagsView（如已实施 Phase 3） -->
      <a-layout-content class="content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>
```

script 部分新增：

```diff
+import { useWindowResize } from '@/composables/useWindowResize'

+useWindowResize()

+/** 移动端：点击菜单后自动关闭抽屉 */
+const handleMenuClickMobile = ({ key }: { key: string }) => {
+  handleMenuClick({ key })
+  appStore.closeSidebar()
+}
```

#### 修改 CSS

```diff
 .main-layout {
   min-height: 100vh;
-  min-width: 1000px;
+  /* 移除固定最小宽度，支持响应式 */
 }
```

---

## 回滚方案

1. 还原 `MainLayout.vue` 到改动前（恢复本地 `collapsed` ref + 硬编码 min-width）
2. `stores/app.ts` 和 `composables/useWindowResize.ts` 保留不影响（无其他引用）

---

## 完成标志

- [ ] 桌面端（≥ 992px）：侧边栏行为与改动前完全一致
- [ ] 移动端（< 992px）：侧边栏变为左侧抽屉，点击菜单项后自动关闭
- [ ] 移动端：内容区占满屏幕宽度，无 marginLeft
- [ ] 窗口从大到小缩放时自动切换模式
- [ ] 侧边栏折叠状态持久化（刷新后保持）
- [ ] 所有页面在移动端可正常显示
- [ ] `pnpm dev` 无报错，TypeScript 编译通过
