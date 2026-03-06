# Plan 17: 国际化完善与性能优化

> 来源阶段：Phase 6（任务 6.5、6.6、6.7、6.8）  
> 前置依赖：Plan 01~16 基本完成  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| PRD | `doc/初始文档/PRD.md` | 非功能需求（国际化、无障碍、性能） |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 6 任务 6.5~6.8 |

### 关键设计要点

- 国际化：补全所有模块的中英文翻译文案，确保切换英文后无中文残留
- 无障碍：为所有交互元素添加 aria-label，键盘导航支持，色彩对比度
- 性能：路由懒加载验证、组件按需引入、虚拟滚动、图片懒加载、防抖节流
- 错误边界：全局错误捕获 + 页面级 ErrorBoundary + 网络异常 Fallback
- Loading/Empty/Error 三态全覆盖检查

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 补全国际化文案、无障碍优化、性能调优、错误处理 |
| 验证 | `verifier` | 验证国际化完整性、性能指标、三态覆盖 |
| 参考 | Skill: `vue-best-practices` | 性能优化模式 |
| 参考 | Skill: `web-design-guidelines` | 无障碍审查 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| **国际化** | | | |
| 17-1 | 中文文案补全 | 遍历所有模块，补全 zh-CN 翻译键值：页面标题、表格列头、表单标签、校验提示、操作反馈、错误信息 | `src/i18n/locales/zh-CN.ts` |
| 17-2 | 英文文案补全 | 对照 zh-CN 逐条翻译 en-US | `src/i18n/locales/en-US.ts` |
| 17-3 | 硬编码中文扫描 | 扫描所有 .vue 和 .ts 文件，查找未使用 `t()` 的硬编码中文字符串，替换为 i18n 调用 | 全局 |
| **无障碍** | | | |
| 17-4 | aria-label 添加 | 为所有按钮、链接、图标按钮、表单控件添加 aria-label | 全局 |
| 17-5 | 语义化 HTML | 检查并优化语义标签（header/nav/main/section/aside/footer），图片添加 alt | 全局 |
| 17-6 | 键盘导航 | 确保 Tab 键可遍历主要操作元素，Enter/Space 触发交互，ESC 关闭弹窗 | 全局 |
| 17-7 | 色彩对比度 | 检查主要文本/背景色对比度 ≥ 4.5:1（WCAG AA） | `src/styles/` |
| **性能优化** | | | |
| 17-8 | 路由懒加载验证 | 确认所有路由均使用 `() => import(...)` 懒加载 | `src/router/routes.ts` |
| 17-9 | 组件按需引入 | 验证 unplugin-vue-components 自动导入生效，无全量引入 | `vite.config.ts`、全局 |
| 17-10 | 虚拟滚动检查 | 消息列表使用 @tanstack/vue-virtual，确认长列表（>100条）不卡顿 | `src/components/ChatWindow/MessageList.vue` |
| 17-11 | 防抖节流审查 | 搜索输入框防抖（300ms）、窗口 resize 节流、滚动事件节流 | 全局 |
| 17-12 | 图片懒加载 | 头像、文件预览缩略图使用 loading="lazy" | 全局 |
| **错误处理** | | | |
| 17-13 | 全局错误捕获 | Vue app.config.errorHandler + window.onerror + unhandledrejection | `src/main.ts` |
| 17-14 | ErrorBoundary 完善 | 确保每个路由页面被 ErrorBoundary 包裹，错误时展示友好界面 | `src/components/ErrorBoundary/` |
| 17-15 | 网络异常 Fallback | 断网/接口超时/5xx 时展示友好错误页面，提供重试操作 | 全局 |
| 17-16 | 三态覆盖检查 | 遍历所有列表/内容区，确认 Loading/Empty/Error 三态完整覆盖 | 全局 |

### 3.2 国际化文案结构

```typescript
// zh-CN 文案结构（按模块组织）
export default {
  common: { /* 通用：操作按钮、状态、确认弹窗 */ },
  menu: { /* 侧边栏菜单 */ },
  auth: { /* 登录/登出/改密 */ },
  org: { /* 机构管理 */ },
  dept: { /* 科室管理 */ },
  user: { /* 用户管理 */ },
  avatar: { /* 分身管理/配置 */ },
  file: { /* 文件管理 */ },
  card: { /* 知识卡 */ },
  chat: { /* 数字医生对话 */ },
  search: { /* 知识库搜索 */ },
  dashboard: { /* 仪表盘 */ },
  apiToken: { /* API Token */ },
  rating: { /* 评分 */ },
  error: { /* 错误信息 */ },
  validation: { /* 表单校验 */ },
}
```

### 3.3 性能目标

| 指标 | 目标 |
|------|------|
| Lighthouse Performance | > 80 |
| 首屏加载时间（FCP） | < 2s |
| 最大内容绘制（LCP） | < 3s |
| 路由切换耗时 | < 500ms |
| 消息列表虚拟滚动（1000条） | 滚动 60fps |

---

## 四、验收效果

- [ ] 切换英文后所有 UI 文案为英文（业务数据除外），无中文残留
- [ ] Ant Design Vue 内置文案（日期选择器、分页等）随语言切换
- [ ] 所有交互按钮有 aria-label
- [ ] 键盘 Tab 可遍历侧边栏+顶部栏+内容区主要操作
- [ ] ESC 可关闭所有 Modal/Drawer
- [ ] 所有路由使用懒加载，`pnpm build` 产出多个 chunk
- [ ] 搜索输入框输入有 300ms 防抖
- [ ] 消息列表 1000 条消息时滚动流畅（虚拟滚动）
- [ ] 断网时显示友好错误页面（非白屏），恢复网络后可重试
- [ ] 接口 5xx 时页面展示错误状态+重试按钮
- [ ] 所有列表页面完整覆盖 Loading/Empty/Error 三态
- [ ] `pnpm build` 产出无 warning，总包体积合理
