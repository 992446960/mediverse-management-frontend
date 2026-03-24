# Phase 7: 构建优化

> **风险等级**：🟢 低 | **预估工作量**：1.5 天 | **前置依赖**：无（可在任何阶段实施）

## 概述

优化 Vite 构建配置：gzip/brotli 压缩减小部署体积、manualChunks 拆分第三方依赖提升缓存命中率、补全环境变量类型声明。所有改动仅影响构建产物，不影响运行时代码。

---

## 7.1 gzip / brotli 压缩

### 目标

构建产物自动生成 `.gz` 和 `.br` 压缩文件，配合 Nginx 的 `gzip_static` / `brotli_static` 使用，减少传输体积 60-80%。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `package.json` | 新增 devDependency | 构建时 |
| `vite.config.ts` | 修改 | 仅 plugins 追加 |

### 安全评估

- 仅在 `vite build` 时额外生成压缩文件，不影响 `pnpm dev`
- 不修改原始产物，压缩文件为额外生成的 `.gz` / `.br` 文件
- 项目已安装 `vite-plugin-compression`（在 jkjn_vue_pc 中有使用经验）

### 实施步骤

#### Step 1: 安装依赖

```bash
pnpm add -D vite-plugin-compression2
```

> 注：使用 `vite-plugin-compression2`（v2 版本），支持 Vite 5+ 且同时支持 gzip 和 brotli。

#### Step 2: 修改 `vite.config.ts`

```diff
 import vue from '@vitejs/plugin-vue'
 import Components from 'unplugin-vue-components/vite'
 import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
 import AutoImport from 'unplugin-auto-import/vite'
+import { compression } from 'vite-plugin-compression2'

 export default defineConfig(({ mode }) => {
   const env = loadEnv(mode, process.cwd(), '')

   return {
     plugins: [
       vue(),
       Components({ ... }),
       AutoImport({ ... }),
+      // gzip 压缩（> 10KB 的文件）
+      compression({
+        algorithm: 'gzip',
+        threshold: 10240,
+        deleteOriginalAssets: false,
+      }),
+      // brotli 压缩（> 10KB 的文件）
+      compression({
+        algorithm: 'brotliCompress',
+        threshold: 10240,
+        deleteOriginalAssets: false,
+      }),
     ],
     // ... 其余不变 ...
   }
 })
```

#### Step 3: Nginx 配置参考（运维侧）

```nginx
# 启用预压缩文件
gzip_static on;
brotli_static on;

# 如果没有预压缩文件，动态压缩
gzip on;
gzip_types text/plain application/javascript application/x-javascript text/css application/xml text/javascript application/json;
gzip_min_length 10k;
```

### 验证方式

```bash
pnpm build
# 检查 dist/assets/ 下是否同时有 .js、.js.gz、.js.br 文件
ls -la dist/assets/*.gz | head -5
ls -la dist/assets/*.br | head -5
```

---

## 7.2 代码分割（manualChunks）

### 目标

将第三方依赖按用途拆分为多个 chunk，提升浏览器缓存命中率。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `vite.config.ts` | 修改 | `build.rollupOptions.output` |

### 安全评估

- 仅影响最终打包产物的文件结构
- 不影响代码逻辑、加载顺序
- 如果分割策略导致问题，删除 `manualChunks` 即可恢复

### 当前依赖分析

| 依赖组 | 包名 | 预估大小 |
|--------|------|---------|
| Vue 生态 | vue, vue-router, pinia, vue-i18n | ~80KB |
| Ant Design | ant-design-vue, @ant-design/icons-vue, ant-design-x-vue | ~500KB |
| 编辑器 | @tiptap/* | ~200KB |
| 文档预览 | @vue-office/docx, excel, pdf | ~300KB |
| 工具库 | axios, dayjs, lodash-es, marked, dompurify, highlight.js | ~150KB |

### 实施步骤

#### 修改 `vite.config.ts`

```diff
 export default defineConfig(({ mode }) => {
   // ...
   return {
     plugins: [ ... ],
     resolve: { ... },
     server: { ... },
+    build: {
+      rollupOptions: {
+        output: {
+          manualChunks(id: string) {
+            if (id.includes('node_modules')) {
+              // Vue 核心生态
+              if (
+                id.includes('vue') ||
+                id.includes('pinia') ||
+                id.includes('vue-router') ||
+                id.includes('vue-i18n')
+              ) {
+                return 'vue-vendor'
+              }
+              // Ant Design Vue
+              if (
+                id.includes('ant-design-vue') ||
+                id.includes('@ant-design') ||
+                id.includes('ant-design-x-vue')
+              ) {
+                return 'antd'
+              }
+              // Tiptap 编辑器
+              if (id.includes('@tiptap')) {
+                return 'tiptap'
+              }
+              // 文档预览
+              if (id.includes('@vue-office')) {
+                return 'vue-office'
+              }
+              // 其他第三方
+              return 'vendor'
+            }
+          },
+        },
+      },
+      // 提高 chunk 大小警告阈值
+      chunkSizeWarningLimit: 1000,
+    },
   }
 })
```

### 验证方式

```bash
pnpm build

# 检查产物文件
ls -lh dist/assets/*.js

# 预期看到类似：
# vue-vendor-xxx.js    (~80KB)
# antd-xxx.js          (~500KB)
# tiptap-xxx.js        (~200KB)
# vue-office-xxx.js    (~300KB)
# vendor-xxx.js        (~150KB)
# index-xxx.js         (业务代码)
```

---

## 7.3 环境变量补全

### 目标

补充缺失的环境变量声明，确保 TypeScript 类型安全。

### 影响分析

| 文件 | 变更类型 | 影响范围 |
|------|---------|---------|
| `src/env.d.ts` | 修改 | 仅类型声明 |
| `.env.development` | 修改 | 补充注释 |

### 实施步骤

#### 修改 `src/env.d.ts`

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API 基础路径，如 /api/v1 */
  readonly VITE_API_BASE_URL: string
  /** 文件服务基础 URL（用于拼接相对路径的文件地址） */
  readonly VITE_FILE_BASE_URL?: string
  /** 应用标题（显示在浏览器标签） */
  readonly VITE_APP_TITLE?: string
  /** 是否启用 MSW Mock */
  readonly VITE_ENABLE_MOCK?: string
  /** 部署路径前缀 */
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

#### 检查现有 .env 文件完整性

确认每个 `.env.*` 文件都包含所有必要变量：

```bash
# .env.development
VITE_API_BASE_URL=/api/v1
VITE_APP_TITLE=Mediverse Management (Dev)
VITE_ENABLE_MOCK=false

# .env.staging
VITE_API_BASE_URL=https://staging-api.mediverse.com/api/v1
VITE_APP_TITLE=Mediverse Management (Staging)

# .env.production
VITE_API_BASE_URL=https://api.mediverse.com/api/v1
VITE_APP_TITLE=Mediverse Management
```

### 验证方式

1. TypeScript 编译通过：`vue-tsc -b`
2. 代码中使用 `import.meta.env.VITE_XXX` 有类型提示

---

## 完整 vite.config.ts 参考（Phase 7 全部改动合并）

```typescript
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
import AutoImport from 'unplugin-auto-import/vite'
import { compression } from 'vite-plugin-compression2'
import { fileURLToPath, URL } from 'node:url'

const DEFAULT_DEV_PROXY_TARGET = 'https://mediverse-management.huaxisy.com'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const devProxyTarget = env.DEV_PROXY_TARGET || DEFAULT_DEV_PROXY_TARGET

  return {
    plugins: [
      vue(),
      Components({
        resolvers: [
          AntDesignVueResolver({
            importStyle: false,
          }),
        ],
      }),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/auto-imports.d.ts',
      }),
      // gzip 压缩
      compression({
        algorithm: 'gzip',
        threshold: 10240,
        deleteOriginalAssets: false,
      }),
      // brotli 压缩
      compression({
        algorithm: 'brotliCompress',
        threshold: 10240,
        deleteOriginalAssets: false,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: devProxyTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          timeout: 120000,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (
                id.includes('vue') ||
                id.includes('pinia') ||
                id.includes('vue-router') ||
                id.includes('vue-i18n')
              ) {
                return 'vue-vendor'
              }
              if (
                id.includes('ant-design-vue') ||
                id.includes('@ant-design') ||
                id.includes('ant-design-x-vue')
              ) {
                return 'antd'
              }
              if (id.includes('@tiptap')) {
                return 'tiptap'
              }
              if (id.includes('@vue-office')) {
                return 'vue-office'
              }
              return 'vendor'
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
    },
  }
})
```

---

## 完成标志

- [ ] `pnpm build` 成功，无报错
- [ ] dist/assets 下有 `.gz` 和 `.br` 压缩文件
- [ ] 产物按预期拆分为 vue-vendor、antd、tiptap、vue-office、vendor、index 等 chunk
- [ ] `pnpm dev` 不受影响（压缩插件仅在 build 时生效）
- [ ] TypeScript 中 `import.meta.env` 有完整类型提示
- [ ] 各环境的 `.env.*` 文件变量齐全
