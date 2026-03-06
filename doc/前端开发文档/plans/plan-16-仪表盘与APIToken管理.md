# Plan 16: 仪表盘与 API Token 管理

> 来源阶段：Phase 6（任务 6.1~6.4）  
> 前置依赖：Plan 04（主布局与权限体系）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计.md` | Management 域 → 仪表盘统计接口、API Token CRUD |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 仪表盘页面布局（统计卡片+时间线+分身列表）、Token 管理列表 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 6 任务 6.1~6.4 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 八、API Token 管理模块 |

### 关键设计要点

- 仪表盘需安装 `echarts` + `vue-echarts`（图表可视化）
- 仪表盘使用四格统计卡片 + 最近活动时间线 + 我的分身卡片列表
- API Token 管理：Token 码默认遮掩，支持切换显示/隐藏
- Token 创建后仅显示一次完整 Token，需复制到剪贴板
- 仅 `sysadmin` 可访问 API Token 管理

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现仪表盘、Token 管理页面、图表集成 |
| 参考 | Skill: `vue-best-practices` | 组件规范 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 16-1 | 安装依赖 | `pnpm add echarts vue-echarts` | `package.json` |
| 16-2 | Dashboard API | 获取仪表盘统计数据（接诊数/Token消耗/知识引用）+ 最近活动列表 + 我的分身列表 | `src/api/dashboard.ts` |
| 16-3 | Dashboard 页面 | 四格统计卡片（配置化渲染）+ 趋势图（可选 echarts）+ 最近活动 Timeline + 我的分身卡片列表 | `src/views/Dashboard.vue` |
| 16-4 | StatCard 组件 | 统计卡片通用组件：图标+数值+标题+趋势指示（可选） | `src/components/StatCard/index.vue` |
| 16-5 | API Token API | getApiTokens/createApiToken/deleteApiToken/updateTokenStatus | `src/api/apiTokens.ts` |
| 16-6 | API Token 列表页 | 搜索栏+TokenTable+创建弹窗 | `src/views/admin/ApiTokens/index.vue` |
| 16-7 | TokenTable 组件 | 配置化列（名称/Token码-遮掩切换/所属机构/创建时间/最后使用时间/状态Badge/操作） | `src/views/admin/ApiTokens/components/TokenTable.vue` |
| 16-8 | TokenForm 组件 | 创建弹窗：名称+所属机构选择，创建成功后展示完整 Token + 一键复制 | `src/views/admin/ApiTokens/components/TokenForm.vue` |
| 16-9 | Token 显隐与复制 | maskToken 遮掩函数、toggleVisibility 切换、clipboard API 复制 | 集成在 TokenTable |
| 16-10 | Mock Handler | 仪表盘统计+Token CRUD Mock | `src/mocks/handlers/dashboard.ts`、`src/mocks/handlers/apiTokens.ts` |

### 3.2 仪表盘布局

```
┌─────────────────────────────────────────────────────────┐
│ Dashboard                                               │
├──────────┬──────────┬──────────┬──────────┐             │
│ 📊 累计   │ 📊 今日   │ 📊 累计   │ 📊 今日   │             │
│ 接诊      │ 接诊      │ 知识引用  │ Token    │             │
│ 1,234    │ 56       │ 8,901    │ 12,345   │             │
├──────────┴──────────┴──────────┴──────────┘             │
│                                                         │
│ ┌─── 最近活动 ───────┐  ┌─── 我的分身 ─────────────┐    │
│ │ Timeline           │  │ [分身卡片1] [分身卡片2]   │    │
│ │ · 张三完成了对话    │  │ [分身卡片3]               │    │
│ │ · 新增知识卡 5 张   │  │                          │    │
│ │ · 文件处理完成      │  │                          │    │
│ └────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 3.3 统计卡片配置

```typescript
const statsConfig = [
  { key: 'totalSessions', title: t('dashboard.totalSessions'), icon: 'MedicineBoxOutlined', color: '#1890ff' },
  { key: 'todaySessions', title: t('dashboard.todaySessions'), icon: 'CalendarOutlined', color: '#52c41a' },
  { key: 'totalReferences', title: t('dashboard.totalReferences'), icon: 'BookOutlined', color: '#722ed1' },
  { key: 'todayTokens', title: t('dashboard.todayTokens'), icon: 'ThunderboltOutlined', color: '#fa8c16' },
]
```

### 3.4 Token 遮掩逻辑

```
完整 Token: med_abc123...xyz789
遮掩显示:   med_ab••••••••89
切换按钮:   👁 / 👁‍🗨
```

---

## 四、验收效果

- [ ] 仪表盘四格统计卡片正确展示数据
- [ ] 统计卡片使用配置数组驱动渲染
- [ ] 最近活动 Timeline 展示正确
- [ ] 我的分身卡片列表展示正确
- [ ] API Token 列表正常展示，默认 Token 码为遮掩状态
- [ ] 点击显示/隐藏按钮可切换 Token 码展示
- [ ] 创建 Token 成功后弹窗展示完整 Token
- [ ] "复制到剪贴板"功能正常，有成功提示
- [ ] Token 启用/停用操作正常
- [ ] 删除 Token 有二次确认
- [ ] 仅 sysadmin 可访问 API Token 管理页面
