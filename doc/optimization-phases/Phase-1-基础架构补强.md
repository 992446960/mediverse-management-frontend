# Phase 1: 基础架构补强

> **风险等级**：🟢 低 | **预估工作量**：1.5 天 | **前置依赖**：无

## 概述

Phase 1 包含三个子任务，均为**纯新增代码**，不修改任何现有业务逻辑。完成后项目具备路由切换进度反馈、401 错误页面、以及为后续 Phase 3 (TagsView) 准备的 Redirect 刷新路由。

---

## 1.1 路由进度条 NProgress

### 目标

路由切换时在页面**顶部**显示蓝色进度条，给用户明确的页面加载反馈。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `package.json` | 新增依赖 | 无运行时影响 |
| `src/router/guards.ts` | 修改 | 在 `beforeEach` 最前方插入 1 行 `NProgress.start()`；新增 `afterEach` 钩子（当前不存在，零冲突） |
| `src/styles/nprogress.css` | 新增 | 独立样式文件 |
| `src/styles/index.css` | 修改 | 追加 1 行 `@import` |

### 安全评估

- `beforeEach` 中 `NProgress.start()` 插入在权限判断**之前**，不影响后续 `return '/login'` 等导航中断逻辑
- 当 `beforeEach` 通过 `return` 中断导航时，Vue Router 仍会触发 `afterEach`，因此 `NProgress.done()` 能正确调用
- 当前项目无 `afterEach` 钩子，新增零冲突

### 实施步骤

#### Step 1: 安装依赖

```bash
pnpm add nprogress
pnpm add -D @types/nprogress
```

#### Step 2: 新建样式文件 `src/styles/nprogress.css`

```css
/* NProgress 进度条自定义样式 —— 适配 Mediverse 主题色 */

#nprogress {
  pointer-events: none;
}

#nprogress .bar {
  background: var(--color-primary, #0EA5E9);
  position: fixed;
  z-index: 1031;  /* 高于 sider(100) 和 header(99) */
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
}

#nprogress .peg {
  display: block;
  position: absolute;
  right: 0;
  width: 100px;
  height: 100%;
  box-shadow: 0 0 10px var(--color-primary, #0EA5E9), 0 0 5px var(--color-primary, #0EA5E9);
  opacity: 1;
  transform: rotate(3deg) translate(0px, -4px);
}

/* 暗色模式下使用更亮的主色 */
.dark #nprogress .bar {
  background: var(--color-primary, #38BDF8);
}

.dark #nprogress .peg {
  box-shadow: 0 0 10px var(--color-primary, #38BDF8), 0 0 5px var(--color-primary, #38BDF8);
}
```

#### Step 3: 修改 `src/styles/index.css`

在文件**第 2 行**（`@import './variables.css';` 之后）追加：

```css
@import './nprogress.css';
```

修改后前 4 行为：

```css
@import 'tailwindcss';
@import './variables.css';
@import './nprogress.css';

/* 与 themeStore 一致... 后续内容不变 */
```

#### Step 4: 修改 `src/router/guards.ts`

完整修改后的文件内容：

```typescript
import type { Router, RouteLocationNormalized } from 'vue-router'
import NProgress from 'nprogress'                          // ← 新增
import 'nprogress/nprogress.css'                            // ← 新增：引入基础样式（被自定义样式覆盖）
import { i18n } from '@/i18n'
import { useAuthStore } from '@/stores/auth'
import { getSkipChangePassword } from '@/utils/auth'
import { hasAnyRole } from '@/utils/permission'
import type { UserRole } from '@/types/auth'

NProgress.configure({ showSpinner: false })                 // ← 新增：隐藏右侧旋转图标

const whiteList = ['/login', '/403', '/404']

const appTitle = import.meta.env.VITE_APP_TITLE || 'Mediverse'

/** 路由 meta.title 存 i18n key，需翻译后再写入 document.title（浏览器标签） */
export function setDocumentTitle(to: RouteLocationNormalized) {
  const key = to.meta.title as string | undefined
  document.title = `${key ? `${i18n.global.t(key)} - ` : ''}${appTitle}`
}

export function createPermissionGuard(router: Router) {
  router.beforeEach(async (to) => {
    NProgress.start()                                       // ← 新增：进入路由前启动进度条

    const authStore = useAuthStore()

    setDocumentTitle(to)

    if (whiteList.includes(to.path)) {
      if (to.path === '/login' && authStore.isLoggedIn) {
        return '/'
      }
      return
    }

    if (!authStore.isLoggedIn) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    // 有持久化 user 时直接放行；无 user 时再拉取（兼容旧 session 或首次）
    if (!authStore.user) {
      try {
        await authStore.fetchUserInfo()
      } catch {
        authStore.clearAuthOnly()
        return { path: '/login', query: { redirect: to.fullPath } }
      }
    }

    if (
      authStore.user?.must_change_pwd &&
      to.path !== '/change-password' &&
      !getSkipChangePassword()
    ) {
      return '/change-password'
    }

    // 按权限矩阵校验路由（所有环境统一，无开发环境 bypass）
    if (to.meta.requiredRoles) {
      const requiredRoles = to.meta.requiredRoles as UserRole[]
      const hasPermission = hasAnyRole(authStore.user, requiredRoles)
      if (!hasPermission) {
        return '/403'
      }
    }
  })

  router.afterEach(() => {                                  // ← 新增：整个 afterEach 钩子
    NProgress.done()
  })
}
```

### 变更差异（Diff）

```diff
--- a/src/router/guards.ts
+++ b/src/router/guards.ts
@@ -1,4 +1,6 @@
 import type { Router, RouteLocationNormalized } from 'vue-router'
+import NProgress from 'nprogress'
+import 'nprogress/nprogress.css'
 import { i18n } from '@/i18n'
 import { useAuthStore } from '@/stores/auth'
 import { getSkipChangePassword } from '@/utils/auth'
@@ -6,6 +8,8 @@ import { hasAnyRole } from '@/utils/permission'
 import type { UserRole } from '@/types/auth'

+NProgress.configure({ showSpinner: false })
+
 const whiteList = ['/login', '/403', '/404']

 const appTitle = import.meta.env.VITE_APP_TITLE || 'Mediverse'
@@ -18,6 +22,8 @@ export function setDocumentTitle(to: RouteLocationNormalized) {

 export function createPermissionGuard(router: Router) {
   router.beforeEach(async (to) => {
+    NProgress.start()
+
     const authStore = useAuthStore()
     // ... 中间逻辑不变 ...
   })
+
+  router.afterEach(() => {
+    NProgress.done()
+  })
 }
```

### 验证方式

1. 启动 `pnpm dev`，打开浏览器
2. 在不同路由间切换，观察浏览器顶部是否出现蓝色进度条
3. 切换到暗色模式，确认进度条颜色随主题变化
4. 访问受保护路由（未登录时），确认重定向到 `/login` 时进度条正常结束
5. 快速连续切换路由，确认进度条不会卡住

---

## 1.2 401 错误页面

### 目标

新增 401 未授权页面，与现有 403/404 保持一致的设计语言。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/views/error/401.vue` | 新增 | 独立页面，无引用关系 |
| `src/router/routes.ts` | 修改 | 追加 1 条路由，不改现有路由 |

### 安全评估

- 纯追加操作，不修改任何已有路由
- 与现有 `/403`、`/:pathMatch(.*)*`(404) 路由无冲突
- 新路由插入在 `/403` 之后、`/preview` 之前

### 实施步骤

#### Step 1: 新建 `src/views/error/401.vue`

```vue
<template>
  <a-result
    status="403"
    title="401"
    sub-title="Sorry, you are not authenticated. Please log in first."
  >
    <template #extra>
      <a-space>
        <a-button v-if="!noGoBack" @click="$router.go(-1)">
          Go Back
        </a-button>
        <a-button type="primary" @click="$router.push('/login')">
          Go to Login
        </a-button>
      </a-space>
    </template>
  </a-result>
</template>

<script setup lang="ts">
const route = useRoute()
const noGoBack = computed(() => route.query.noGoBack === '1')
</script>
```

#### Step 2: 修改 `src/router/routes.ts`

在 `/403` 路由（第 293-302 行）之后追加：

```typescript
  {
    path: '/401',
    name: 'Unauthorized',
    component: () => import('@/views/error/401.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: '401 Unauthorized',
      hidden: true,
    },
  },
```

同时将 `/401` 加入路由守卫白名单。修改 `src/router/guards.ts`：

```diff
-const whiteList = ['/login', '/403', '/404']
+const whiteList = ['/login', '/401', '/403', '/404']
```

### 验证方式

1. 直接访问 `/401`，确认页面正常渲染
2. 访问 `/401?noGoBack=1`，确认"Go Back"按钮隐藏
3. 点击"Go to Login"，确认跳转到登录页

---

## 1.3 Redirect 刷新路由

### 目标

新增 `/redirect/:path(.*)` 路由，用于实现页面"刷新"功能（通过导航到 redirect 再跳回来，触发组件重新创建）。这是后续 Phase 3 TagsView "刷新当前页签"功能的前置条件。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/views/shared/Redirect.vue` | 新增 | 独立组件 |
| `src/router/routes.ts` | 修改 | 追加 1 条路由 |

### 安全评估

- 纯追加操作，当前无任何组件使用 `/redirect` 路径
- 组件逻辑极简：`onMounted → router.replace(path)`，无副作用

### 实施步骤

#### Step 1: 新建 `src/views/shared/Redirect.vue`

```vue
<script setup lang="ts">
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const { params, query } = route
  const path = Array.isArray(params.path) ? `/${params.path.join('/')}` : `/${params.path}`
  router.replace({ path, query })
})
</script>

<template>
  <div />
</template>
```

#### Step 2: 修改 `src/router/routes.ts`

在路由数组**最前方**（`/login` 路由之前）插入：

```typescript
  {
    path: '/redirect/:path(.*)',
    name: 'Redirect',
    component: () => import('@/views/shared/Redirect.vue'),
    meta: {
      layout: 'MainLayout',
      title: '',
      hidden: true,
    },
  },
```

### 验证方式

1. 访问 `/redirect/admin/users`，确认自动跳转到 `/admin/users`
2. 访问 `/redirect/` (根路径)，确认跳转到 `/`

---

## 完成标志

- [ ] `pnpm dev` 启动无报错
- [ ] 路由切换时顶部出现蓝色进度条（亮/暗色主题均正常）
- [ ] `/401` 页面可正常访问
- [ ] `/redirect/:path` 可正常跳转
- [ ] 所有现有路由权限守卫行为不变
- [ ] TypeScript 编译通过 (`vue-tsc -b`)
