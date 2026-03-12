# Plan 11: 分身配置与统计组件

> 来源阶段：Phase 3（任务 3.10、3.11、3.12）  
> 前置依赖：Plan 09（文件管理通用组件集，复用 useWorkspaceContext）  
> 项目目录：`mediverse-management-frontend/`  
> 依据：`doc/前端开发文档/think/分身配置v1.1.think.md`  
> 原型参考：UI 原型图（见附图）

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| API 设计 | `doc/初始文档/API设计V2.0.md` | Ecosys 域 → 分身配置更新、统计数据接口 |
| 产品规划 | `doc/初始文档/产品规划.md` | 分身配置项（头像/名称/简介/开场白/风格/标签） |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 分身配置页面布局、统计卡片、工作台顶部选择器 |
| 分身配置 think | `doc/前端开发文档/think/分身配置v1.1.think.md` | 角色路由、标题枚举、统计 API 路径 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.10~3.12、四.1 复用分析矩阵 |

### 关键设计要点

- **一一对应**：机构/科室/用户与分身一一对应，角色只能通过对应工作台设置自己的分身
- **标题枚举**：个人工作台 →「我的数字分身」；科室工作台 →「科室数字医生」；机构工作台 →「机构数字医生」（便于维护）
- **角色路由**：根据 `has_expert_avatar` / `has_dept_avatar` / `has_org_avatar` 控制工作台菜单展示；系统管理员在 v1.1 中不展示工作台（仅开发环境展示）
- AvatarConfig：通用分身配置表单组件，个人/科室/机构三处复用
- AvatarStats：统计卡片组件（纵向列表布局，五项指标带彩色数值与图标）
- WorkspaceScopeSelector：科室/机构工作台顶部的范围选择器（机构→科室联动）
- 三个组件均通过 Props 参数化，不耦合特定业务场景

### 角色与工作台展示（v1.1）

| 角色 | 展示路由 |
|------|----------|
| 用户 | 个人工作台 |
| 用户、科室 | 个人、科室工作台 |
| 用户、科室、机构 | 个人、科室、机构工作台 |
| 用户、机构 | 个人、机构工作台 |
| 用户、系统管理员 | 不展示，仅开发环境展示 |

> 菜单可见性由登录接口返回的 `has_expert_avatar` / `has_dept_avatar` / `has_org_avatar` 决定。

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 实现配置组件、统计组件、范围选择器 |
| 参考 | Skill: `vue-best-practices` | 组件解耦 |
| 参考 | Skill: `vue` | v-model、defineModel |

---

## 三、页面布局（按原型图）

### 3.0 整体布局

页面采用**两栏布局**，外层容器水平排列：

```
┌─────────────────────────────────────────────────────────────────────┐
│  页面标题（AVATAR_PAGE_TITLE[ownerType]）                            │
├────────────────────────────────────────┬────────────────────────────┤
│  AvatarConfig 表单区（~70%）            │  右侧栏（~30%）              │
│                                        │                            │
│  ┌──────────────────────────────────┐  │  ┌────────────────────────┐│
│  │ ▎基础信息配置                     │  │  │ 数字分身服务统计数据      ││
│  │                                  │  │  │ AvatarStats            ││
│  │  [圆形头像] 点击上传头像           │  │  │                        ││
│  │            格式/尺寸提示           │  │  │  累计接诊数   12,840    ││
│  │            [更改头像]             │  │  │  今日接诊数     458     ││
│  │                                  │  │  │  今日Token    2.5k     ││
│  │  名称 ___________________________│  │  │  累计Token   84.2k     ││
│  │  角色简介 ________________________│  │  │  知识库引用     941     ││
│  └──────────────────────────────────┘  │  └────────────────────────┘│
│                                        │                            │
│  ┌──────────────────────────────────┐  │  ┌────────────────────────┐│
│  │ ▎对话策略                         │  │  │ 快速操作指引             ││
│  │                                  │  │  │                        ││
│  │  开场白内容 ______________________│  │  │ 完成配置后，您可以直接   ││
│  │  沟通风格  [正式] [简洁] [亲切]...│  │  │ 在控制台进入对话测试      ││
│  │  关联知识库标签 [标签] [+添加]     │  │  │ 进行实时调试。           ││
│  └──────────────────────────────────┘  │  │  [立即测试 →]            ││
│                                        │  └────────────────────────┘│
│            [取消]   [保存配置]          │                            │
└────────────────────────────────────────┴────────────────────────────┘
```

> 页面标题使用文档约定的枚举值![1773311683414](image/plan-11-分身配置与统计组件/1773311683414.png)。

---

## 四、计划内容

### 4.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| 11-1 | 分身配置 API | 获取分身配置 / 更新分身配置（个人用 `/api/v1/my/avatar`，科室/机构用 `owner_type`+`owner_id` 路径） | `src/api/avatarConfig.ts` |
| 11-2 | 分身统计 API | 按 think v1.1：`GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}`，`owner_type`=personal/dept/org，`owner_id`=user_id/dept_id/org_id | `src/api/avatarStats.ts` |
| 11-3 | 标题枚举常量 | 定义 `AVATAR_PAGE_TITLE` 枚举：personal→我的数字分身，dept→科室数字医生，org→机构数字医生；副标题常量 | `src/constants/avatar.ts` |
| 11-4 | AvatarConfig 组件 | 通用分身配置表单（详见 4.3），分「基础信息配置」与「对话策略」两个分区。**表单样式参考** `src/views/admin/Avatars/components/steps/StepInfo.vue` 的输入框、标签、沟通风格卡片等样式 | `src/components/AvatarConfig/index.vue` |
| 11-5 | AvatarStats 组件 | 统计面板（详见 4.4），纵向列表布局，五项指标带彩色数值与彩色图标 | `src/components/AvatarStats/index.vue` |
| 11-6 | QuickActionGuide 组件 | 快速操作指引卡片（渐变背景），提示"完成配置后可进入对话测试进行实时调试"，含"立即测试"按钮，点击跳转对话测试页 | `src/components/AvatarConfig/QuickActionGuide.vue` |
| 11-7 | Mock 补充 | 分身配置/统计相关 Mock handler 和数据，支持 `owner_type`+`owner_id` 路径 | `src/mocks/handlers/avatarConfig.ts` |

### 4.2 统计 API 路径（think v1.1）

```
GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}
```

| 参数 | 取值 | 说明 |
|------|------|------|
| owner_type | personal / dept / org | 分身归属类型 |
| owner_id | user_id / dept_id / org_id | 从登录用户信息中取对应 ID |

### 4.3 AvatarConfig 组件设计

#### Props & Emits

```typescript
type OwnerType = 'personal' | 'dept' | 'org'

interface AvatarConfigProps {
  avatarId: string
  ownerType: OwnerType
  apiEndpoint?: string  // 个人分身使用 /api/v1/my/avatar，科室/机构使用 owner_type+owner_id 路径
  readonly?: boolean    // 只读模式（无权限时）
}

interface AvatarConfigEmits {
  (e: 'saved'): void
  (e: 'cancel'): void
}
```

> 页面标题通过 `AVATAR_PAGE_TITLE[ownerType]` 获取，便于维护。

#### 表单分区结构

表单分为两个带蓝色左侧竖线标识的分区（使用 `border-left` 样式）：

**分区一：基础信息配置**

| 字段 | 控件类型 | 说明 |
|------|---------|------|
| 头像 | 圆形上传区域 | 圆形头像展示区 + "点击上传头像"提示 + 格式/尺寸提示（支持 JPG, PNG 格式，建议尺寸 512x512px）+ "更改头像"按钮；已有头像时显示预览 |
| 名称 | Input | placeholder: "请输入数字分身名称，例如：临床助手-小蓝"，maxlength=100 |
| 角色简介 | Textarea | placeholder: "请简要描述该数字分身的背景及职责"，rows=4，maxlength=500 |

**分区二：对话策略**

| 字段 | 控件类型 | 说明 |
|------|---------|------|
| 开场白内容 | Input | placeholder: "你好！我是您的数字临床助理，有什么可以帮您的？"，maxlength=200 |
| 沟通风格 | Pill 单选卡片组 | 选项：正式严谨 / 简洁高效 / 亲切温和 / 详尽细致 / 自定义；**样式复用** StepInfo.vue 中的 `.step-info-style-card` 系列样式 |
| 自定义风格 | Input（条件显示） | 仅当沟通风格选择「自定义」时显示 |
| 关联知识库标签 | Tag 管理 | 已选标签显示为蓝色 pill（可删除）+ "+ 添加标签"虚线 pill；**样式复用** StepInfo.vue 中的 `.step-info-tag-pill` 系列样式 |

**操作按钮**：底部右对齐，「取消」（默认样式）+「保存配置」（primary 样式）

#### 与 StepInfo.vue 的样式复用说明

表单的输入框、标签管理、沟通风格选择卡片直接复用 `src/views/admin/Avatars/components/steps/StepInfo.vue` 中的样式类名和交互模式：
- 输入框：`.step-info-input` 灰底圆角风格
- 标签 pill：`.step-info-tag-pill` 蓝色胶囊 + `.step-info-tag-add-pill` 虚线添加按钮
- 沟通风格卡片：`.step-info-style-card` 带圆点的单选卡片

> 建议将上述可复用样式提取到共享样式文件或 AvatarConfig 中重新定义，避免 scoped style 不跨组件生效。

### 4.4 AvatarStats 组件设计

#### 布局：纵向列表

统计面板位于页面右侧，标题为「数字分身服务统计数据」，五项指标从上到下排列：

| 指标 | 字段名 | 值颜色 | 图标 | 图标颜色 |
|------|--------|--------|------|----------|
| 累计接诊数 | totalSessions | 蓝色 `#1890ff` | 消息/聊天图标 | 蓝色 |
| 今日接诊数 | todaySessions | 紫色 `#722ed1` | 用户组图标 | 紫色 |
| 今日Token使用量 | todayTokensUsed | 橙色 `#fa8c16` | Token/闪电图标 | 橙色 |
| 累计Token使用量 | totalTokensUsed | 绿色 `#52c41a` | 全球/地球图标 | 绿色 |
| 知识库引用次数 | totalReferences | 红色 `#f5222d` | 书籍/文档图标 | 红色 |

#### 单项布局

```
┌─────────────────────────────────┐
│  指标标签（灰色小字）        图标 │
│  数值（大号彩色字）              │
├─────────────────────────────────┤
│  ...下一项                      │
└─────────────────────────────────┘
```

#### 数据模型

```typescript
interface AvatarStatsData {
  totalSessions: number      // 累计接诊数
  todaySessions: number      // 今日接诊数
  todayTokensUsed: number    // 今日 Token 使用量
  totalTokensUsed: number    // 累计 Token 使用量
  totalReferences: number    // 知识库引用次数
}
```

#### Props

```typescript
interface AvatarStatsProps {
  ownerType: OwnerType
  ownerId: string
}
```

> 组件内部根据 Props 调用统计 API，支持 loading 骨架屏。数值较大时自动格式化（如 12840 → 12,840；84200 → 84.2k）。

### 4.5 QuickActionGuide 组件设计

位于右侧 AvatarStats 下方，青色渐变背景卡片：

```
┌─────────────────────────────────┐
│  快速操作指引                     │ ← 白色加粗标题
│                                  │
│  完成配置后，您可以直接在控制台    │ ← 白色正文
│  进入对话测试进行实时调试。        │
│                                  │
│  ┌──────────────────────┐       │
│  │   立即测试  →         │       │ ← 白色圆角按钮
│  └──────────────────────┘       │
└─────────────────────────────────┘
```

#### Props

```typescript
interface QuickActionGuideProps {
  ownerType: OwnerType  // 用于拼接对话测试路由
}
```

---

## 五、验收效果

- [ ] 页面标题按 `AVATAR_PAGE_TITLE` 枚举正确展示（个人→我的数字分身 / 科室→科室数字医生 / 机构→机构数字医生）
- [ ] 页面为两栏布局：左侧表单区 ~70%、右侧统计+指引 ~30%
- [ ] 统计 API 使用 `GET /api/v1/my/avatar/stats/{owner_type}/{owner_id}` 格式，`owner_id` 从用户信息正确取值
- [ ] AvatarConfig 表单分为「基础信息配置」和「对话策略」两个带蓝色左侧竖线的分区
- [ ] 头像上传区域为圆形展示，含"点击上传头像"提示、格式/尺寸说明、"更改头像"按钮
- [ ] 名称/角色简介/开场白内容表单字段渲染完整，placeholder 与原型一致
- [ ] 沟通风格为 pill 单选卡片样式（参考 StepInfo.vue），选中态为蓝色边框+浅蓝底+蓝字
- [ ] 选择「自定义」风格时显示自由输入框
- [ ] 关联知识库标签支持添加/移除，样式为蓝色 pill + 虚线添加按钮
- [ ] 底部操作按钮：「取消」+「保存配置」，右对齐
- [ ] 保存配置成功后有 Toast 提示
- [ ] AvatarStats 纵向列表展示五项指标：累计接诊数（蓝）、今日接诊数（紫）、今日Token（橙）、累计Token（绿）、知识库引用（红）
- [ ] 统计数值支持千分位/缩写格式化（12,840 / 84.2k）
- [ ] 快速操作指引卡片展示在统计下方，青色渐变背景，含"立即测试"按钮
- [ ] 所有组件通过 Props 参数化，不硬编码 ownerType
