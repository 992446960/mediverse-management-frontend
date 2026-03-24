# Mediverse Management 前端优化开发计划

> 生成日期：2026-03-24
> 基于 `后台管理系统架构设计参考清单` 评估 mediverse-management-frontend 项目后制定

## 核心原则

1. **零破坏**：每个 Phase 完成后独立可部署，不影响现有功能
2. **可回滚**：每个改动点附有回滚方案
3. **渐进式**：按风险等级从低到高排序实施

---

## Phase 总览

| Phase | 内容 | 工作量 | 风险 | 状态 |
|-------|------|--------|------|------|
| [Phase 1](./Phase-1-基础架构补强.md) | NProgress 进度条 + 401 页 + Redirect 路由 | **1.5 天** | 🟢 低 | 待实施 |
| [Phase 2](./Phase-2-请求层增强.md) | 防重复提交 + 下载工具 + 错误码映射 | **2 天** | 🟡 中低 | 待实施 |
| [Phase 3](./Phase-3-多页签TagsView.md) | TagsView 多页签 + Keep-alive 缓存 | **4 天** | 🟡 中 | 待实施 |
| [Phase 4](./Phase-4-响应式布局适配.md) | App Store 抽取 + 移动端 Drawer 适配 | **3 天** | 🟠 中高 | 待实施 |
| [Phase 5](./Phase-5-布局配置系统.md) | Settings Store + 配置抽屉面板 | **2-3 天** | 🟢 低 | 待实施 |
| [Phase 6](./Phase-6-组件体系增强.md) | RightToolbar + 操作列权限 + 字典标签 | **3 天** | 🟢 低 | 待实施 |
| [Phase 7](./Phase-7-构建优化.md) | gzip/brotli + manualChunks + 环境变量 | **1.5 天** | 🟢 低 | 待实施 |
| **合计** | | **~17-18 天** | | |

---

## 实施顺序

```
Phase 1 (NProgress/错误页)  ──→  Phase 2 (请求层)  ──→  Phase 7 (构建)
  🟢 零风险启动                    🟡 独立模块            🟢 纯配置
         │
         ▼
Phase 3 (TagsView)  ──→  Phase 4 (响应式)  ──→  Phase 5 (配置面板)
  🟡 需回归测试            🟠 独立分支              🟢 纯新增
         │
         ▼
Phase 6 (组件增强)
  🟢 按需接入
```

---

## 暂缓项

| 项目 | 原因 | 前置条件 |
|------|------|---------|
| 细粒度权限码体系 | 后端 `/auth/me` 未返回 `permissions[]` | 后端接口改造 + 权限码规范对齐 |
| iframe 内链/外链 | 当前无内嵌第三方页面的业务需求 | 有实际需求时再引入 |

---

## 文件变更矩阵

| 文件 | P1 | P2 | P3 | P4 | P5 | P6 | P7 |
|------|----|----|----|----|----|----|-----|
| `src/router/guards.ts` | ✏️ | | | | ✏️ | | |
| `src/router/routes.ts` | ✏️ | | ✏️ | | | | |
| `src/types/router.ts` | | | ✏️ | | | | |
| `src/api/index.ts` | | ✏️ | | | | | |
| `src/layouts/MainLayout.vue` | | | ✏️ | ✏️ | ✏️ | | |
| `src/App.vue` | | | ✏️ | | | | |
| `src/styles/index.css` | ✏️ | | | | | | |
| `src/components/PageTable/types.ts` | | | | | | ✏️ | |
| `src/components/PageTable/OperationCell.vue` | | | | | | ✏️ | |
| `vite.config.ts` | | | | | | | ✏️ |
| `src/env.d.ts` | | | | | | | ✏️ |
| `package.json` | ✏️ | | | | | | ✏️ |

✏️ = 修改现有文件 | 新增文件未在此表中列出

---

## 新增文件清单

### Phase 1
- `src/styles/nprogress.css`
- `src/views/error/401.vue`
- `src/views/shared/Redirect.vue`

### Phase 2
- `src/utils/requestDedup.ts`
- `src/utils/download.ts`
- `src/config/errorCodes.ts`
- `src/types/axios.d.ts`

### Phase 3
- `src/stores/tagsView.ts`
- `src/components/TagsView/index.vue`
- `src/components/TagsView/ScrollPane.vue`

### Phase 4
- `src/stores/app.ts`
- `src/composables/useWindowResize.ts`

### Phase 5
- `src/stores/settings.ts`
- `src/components/SettingsDrawer/index.vue`

### Phase 6
- `src/components/RightToolbar/index.vue`
- `src/composables/useDict.ts`
- `src/components/DictTag/index.vue`
