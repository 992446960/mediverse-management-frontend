# Phase 5: 布局配置系统

> **风险等级**：🟢 低 | **预估工作量**：2-3 天 | **前置依赖**：Phase 3（TagsView）、Phase 4（App Store）

## 概述

提供可视化配置面板，允许用户自定义布局偏好（固定头部、显隐页签、主题色等）。所有配置项有默认值，关闭面板时等价当前行为。

### 核心原则

- **所有配置有默认值** → 不配置时行为与当前完全一致
- **纯新增组件 + Store** → 不修改现有逻辑的核心流程
- **渐进式接入** → 现有布局通过 `v-if` 读取 settings 控制显隐

---

## 5.1 Settings Store

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/stores/settings.ts` | 新增 | 独立 store，持久化到 localStorage |

### 实施步骤

#### 新建 `src/stores/settings.ts`

```typescript
import { defineStore } from 'pinia'

export interface SettingsState {
  /** 固定头部 */
  fixedHeader: boolean
  /** 显示多页签栏 */
  showTagsView: boolean
  /** 显示侧栏 Logo */
  showSidebarLogo: boolean
  /** 动态网页标题（路由 title + APP_TITLE） */
  dynamicTitle: boolean
  /** 主题色（CSS 色值） */
  primaryColor: string
}

const DEFAULT_SETTINGS: SettingsState = {
  fixedHeader: true,
  showTagsView: true,
  showSidebarLogo: true,
  dynamicTitle: true,
  primaryColor: '#0EA5E9',
}

const STORAGE_KEY = 'mediverse_settings'

function loadSettings(): SettingsState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return { ...DEFAULT_SETTINGS }
}

export const useSettingsStore = defineStore('settings', () => {
  const state = reactive<SettingsState>(loadSettings())

  /** 更新单个配置项 */
  function setSetting<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    state[key] = value
    persist()
  }

  /** 重置所有配置 */
  function resetSettings() {
    Object.assign(state, DEFAULT_SETTINGS)
    persist()
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  // 监听主题色变化，动态更新 CSS 变量
  watch(
    () => state.primaryColor,
    (color) => {
      document.documentElement.style.setProperty('--color-primary', color)
    }
  )

  return {
    ...toRefs(state),
    setSetting,
    resetSettings,
  }
})
```

---

## 5.2 Settings 抽屉面板

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/components/SettingsDrawer/index.vue` | 新增 | 独立组件 |

### 实施步骤

#### 新建 `src/components/SettingsDrawer/index.vue`

```vue
<template>
  <!-- 浮动触发按钮 -->
  <div class="settings-trigger" @click="visible = true">
    <SettingOutlined :style="{ fontSize: '18px', color: '#fff' }" />
  </div>

  <a-drawer
    :open="visible"
    title="系统配置"
    placement="right"
    :width="300"
    @close="visible = false"
  >
    <a-form layout="vertical">
      <!-- 主题色 -->
      <a-form-item label="主题色">
        <div class="color-options">
          <span
            v-for="color in presetColors"
            :key="color"
            class="color-block"
            :class="{ active: settingsStore.primaryColor === color }"
            :style="{ backgroundColor: color }"
            @click="settingsStore.setSetting('primaryColor', color)"
          />
        </div>
      </a-form-item>

      <a-divider />

      <!-- 布局开关 -->
      <a-form-item label="固定头部">
        <a-switch
          :checked="settingsStore.fixedHeader"
          @change="(val: boolean) => settingsStore.setSetting('fixedHeader', val)"
        />
      </a-form-item>

      <a-form-item label="显示页签栏">
        <a-switch
          :checked="settingsStore.showTagsView"
          @change="(val: boolean) => settingsStore.setSetting('showTagsView', val)"
        />
      </a-form-item>

      <a-form-item label="显示侧栏 Logo">
        <a-switch
          :checked="settingsStore.showSidebarLogo"
          @change="(val: boolean) => settingsStore.setSetting('showSidebarLogo', val)"
        />
      </a-form-item>

      <a-form-item label="动态网页标题">
        <a-switch
          :checked="settingsStore.dynamicTitle"
          @change="(val: boolean) => settingsStore.setSetting('dynamicTitle', val)"
        />
      </a-form-item>

      <a-divider />

      <a-button block @click="settingsStore.resetSettings">
        恢复默认
      </a-button>
    </a-form>
  </a-drawer>
</template>

<script setup lang="ts">
import { SettingOutlined } from '@ant-design/icons-vue'
import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()
const visible = ref(false)

const presetColors = [
  '#0EA5E9', // sky-500（默认）
  '#1677FF', // antd blue
  '#722ED1', // purple
  '#13C2C2', // cyan
  '#52C41A', // green
  '#EB2F96', // magenta
  '#FA541C', // volcano
  '#FAAD14', // gold
]
</script>

<style scoped>
.settings-trigger {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary, #0EA5E9);
  border-radius: 8px 0 0 8px;
  cursor: pointer;
  z-index: 1000;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
}

.settings-trigger:hover {
  width: 44px;
}

.color-options {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.color-block {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.color-block:hover {
  transform: scale(1.15);
}

.color-block.active {
  border-color: var(--color-text-base);
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
}
</style>
```

---

## 5.3 集成到布局

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/layouts/MainLayout.vue` | 修改 | 条件渲染（v-if 读取 settings） |
| `src/router/guards.ts` | 修改 | 动态标题开关 |

### 实施步骤

#### 修改 `src/layouts/MainLayout.vue`

```diff
+import { useSettingsStore } from '@/stores/settings'
+import SettingsDrawer from '@/components/SettingsDrawer/index.vue'

+const settingsStore = useSettingsStore()
```

template 中：

```diff
       <!-- Logo -->
       <div class="logo">
-        <span v-if="!appStore.sidebar.collapsed">Mediverse</span>
+        <span v-if="!appStore.sidebar.collapsed && settingsStore.showSidebarLogo">Mediverse</span>
+        <span v-else-if="settingsStore.showSidebarLogo">M</span>
       </div>

       <!-- Header 固定/非固定 -->
       <a-layout-header
         class="header"
+        :style="{ position: settingsStore.fixedHeader ? 'sticky' : 'relative' }"
       >

       <!-- TagsView 显隐（需 Phase 3 已实施） -->
+      <TagsView v-if="settingsStore.showTagsView" />

       <!-- 在 slot 之后加入配置抽屉 -->
       <a-layout-content class="content">
         <slot />
       </a-layout-content>
+      <SettingsDrawer />
```

#### 修改 `src/router/guards.ts` — 动态标题开关

```diff
+import { useSettingsStore } from '@/stores/settings'

 export function setDocumentTitle(to: RouteLocationNormalized) {
+  // 延迟获取 store（可能在 pinia 初始化前被调用）
+  let dynamicTitle = true
+  try {
+    const settingsStore = useSettingsStore()
+    dynamicTitle = settingsStore.dynamicTitle
+  } catch {
+    // pinia 未就绪时使用默认值
+  }
+
   const key = to.meta.title as string | undefined
-  document.title = `${key ? `${i18n.global.t(key)} - ` : ''}${appTitle}`
+  if (dynamicTitle && key) {
+    document.title = `${i18n.global.t(key)} - ${appTitle}`
+  } else {
+    document.title = appTitle
+  }
 }
```

---

## 回滚方案

1. 移除 `MainLayout.vue` 中对 `settingsStore` 的引用和 `<SettingsDrawer />`
2. 恢复 header 的 `position: sticky` 硬编码
3. `stores/settings.ts` 和 `SettingsDrawer` 组件保留不影响

---

## 完成标志

- [ ] 页面右侧出现齿轮图标，点击弹出配置面板
- [ ] 切换主题色后，全局主色实时变化
- [ ] 关闭"显示页签栏"后，TagsView 隐藏
- [ ] 关闭"固定头部"后，头部随内容滚动
- [ ] 关闭"显示侧栏 Logo"后，Logo 区域隐藏
- [ ] 关闭"动态网页标题"后，标签页仅显示 APP_TITLE
- [ ] 点击"恢复默认"后，所有配置恢复初始值
- [ ] 刷新页面后配置保持（localStorage 持久化）
- [ ] 不打开配置面板时，行为与改动前完全一致
