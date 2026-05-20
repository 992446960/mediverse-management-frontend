# 上海市第一人民医院项目定制需求整理

## 1. 背景

面向管理端前端项目，需分别完成通用知识卡管理能力改造和上海市第一人民医院品牌样式定制。

项目定制建议开发分支：`feature/shanghai-first-hospital-customization`

## 2. 需求范围

本次需求分为两类：

1. 知识卡管理页面改造
2. 上海市第一人民医院项目样式与菜单定制

### 2.1 分支适用范围

| 需求类别                             | 分支要求                                               |
| ------------------------------------ | ------------------------------------------------------ |
| 知识卡管理页面改造                   | 属于通用能力，需要在主分支和其他相关业务分支同步更新   |
| 上海市第一人民医院项目样式与菜单定制 | 属于项目定制能力，仅在上海市第一人民医院独立分支中修改 |

## 3. 视觉素材

### 3.1 医院 Logo 参考

![上海市第一人民医院 Logo 参考](./assets/shanghai-first-hospital-logo-reference.jpg)

用途：

- 主页左上角 Logo
- 登录页品牌区域 Logo
- 后续如需 favicon 或加载页品牌图，可复用同一套品牌素材

### 3.2 登录页背景图参考

![公济临床乐谱登录背景参考](./assets/gongji-login-background-reference.jpg)

用途：

- 登录页面背景图
- 品牌名称、医院视觉风格和整体浅蓝医疗科技感参考

## 4. 功能需求

### 4.1 知识卡详情改造

#### 4.1.1 目标

知识详情页面正文内容改为左右双栏展示：

| 区域 | 内容     | 交互要求                                            |
| ---- | -------- | --------------------------------------------------- |
| 左侧 | JSON     | 使用 JSON 编辑器展示，只读，不允许编辑              |
| 右侧 | Markdown | 展示 Markdown 内容；编辑知识卡时只允许编辑 Markdown |

#### 4.1.2 展示态

- 知识卡详情打开后，正文区域默认展示 JSON 与 Markdown 双栏。
- JSON 区域以结构化 JSON 编辑器展示，需支持格式化、折叠、复制等基础阅读能力。
- Markdown 区域按 Markdown 渲染，保持现有知识卡正文阅读体验。
- 当知识卡没有可展示 JSON 时，应显示空状态或空对象，不影响 Markdown 展示。

#### 4.1.3 编辑态

- 编辑知识卡时，正文编辑入口只允许编辑 Markdown。
- JSON 区域保持只读，不提供保存、输入、粘贴修改等编辑能力。
- 保存时仅提交 Markdown 内容及现有可编辑字段。
- 如果后端需要根据 Markdown 重新生成 JSON，由后端或既有解析流程处理，前端不自行推断转换规则。

#### 4.1.4 关联现状

当前代码中知识卡查看和编辑主要关联：

- `src/components/KnowledgeCardViewer/index.vue`
- `src/components/KnowledgeCardEditor/index.vue`
- `src/components/KnowledgeCardEditor/TiptapEditor.vue`
- `src/api/knowledge.ts`
- `src/types/knowledge.ts`

### 4.2 增加知识召回测试页面

#### 4.2.1 目标

新增知识召回测试页面，用于输入 Query 后验证知识召回效果，并展示相关知识卡与回答内容。

#### 4.2.2 页面能力

页面需要包含：

| 模块           | 要求                                                               |
| -------------- | ------------------------------------------------------------------ |
| Query 输入区   | 支持输入测试问题，点击提交后发起召回测试                           |
| 回答展示区     | 展示模型或服务返回的回答内容                                       |
| 相关知识卡列表 | 展示被召回的知识卡，包含标题、摘要、来源、相似度或相关度等可用字段 |
| 加载与空状态   | 查询中显示 loading；无召回结果时显示空状态                         |

#### 4.2.3 建议入口

可在知识卡管理相关页面增加入口，例如：

- 知识卡管理页顶部操作按钮：`召回测试`
- 或知识卡管理模块下新增二级页面：`知识召回测试`

具体入口形式以现有菜单结构和权限模型为准。

#### 4.2.4 关联现状

项目中已存在知识库搜索相关能力，可作为实现参考：

- `src/views/knowledge-base/index.vue`
- `src/views/knowledge-base/Search.vue`
- `src/components/SearchResultThread/index.vue`
- `src/api/knowledgeSearch.ts`

## 5. 项目样式定制需求

### 5.1 分支要求

本节仅针对上海市第一人民医院项目定制。项目定制样式与菜单裁剪需在上海市第一人民医院独立分支中修改，避免影响通用版本。

建议分支命名：

```text
feature/shanghai-first-hospital-customization
```

### 5.2 登录页面

#### 5.2.1 背景图

- 登录页面增加医院定制背景图。
- 背景视觉参考 `公济临床乐谱登录背景参考`。
- 需适配常见桌面分辨率，保证登录表单可读性。

#### 5.2.2 品牌名称

| 当前文案 | 修改后   |
| -------- | -------- |
| 医数智台 | 公济乐谱 |

需覆盖：

- 登录页品牌名称
- 加载页文案
- 页面标题中使用的品牌名称
- 其他读取 `app.brandName` 的位置

### 5.3 主页面 Logo 与名称

主页左上角品牌区调整为：

| 元素     | 要求                 |
| -------- | -------------------- |
| Logo     | 使用医院 Logo        |
| 中文名称 | 公济乐谱             |
| 英文名称 | Mediverse Management |

当前关联位置：

- `src/layouts/MainLayout.vue`
- `src/assets/logo.svg`
- `src/i18n/locales/zh-CN.ts`
- `src/i18n/locales/en-US.ts`
- `index.html`

### 5.4 菜单裁剪

#### 5.4.1 原则

菜单定制**仅影响侧边栏展示**，不改变通用版既有行为：

| 维度 | 要求 |
| ---- | ---- |
| 路由 | **不删除、不修改** `src/router/routes.ts` 中的路由定义；保留菜单继续使用原有 `path` |
| 权限 | **不调整** `meta.requiredRoles`、路由守卫及既有角色/工作台判断逻辑 |
| 页面 | **不改动** 各业务页面、API 调用、Store 与页面内跳转逻辑 |
| 侧边栏 | 通过 `menu.ts` 配置项控制展示；`filterMenu` 仅增加与 `hidden` / `flattenChildren` 相关的展示过滤 |

被裁剪的菜单项：**在侧边栏对应父级分组下不展示**，用户无法从侧边栏点击进入；若通过书签、历史标签、页面内链接等方式访问，行为与通用版一致（路由仍可命中、权限仍按原规则校验）。

#### 5.4.2 侧边栏保留项

侧边栏仅展示以下 6 类业务入口（具体 `path` 仍随当前用户角色与工作台上下文决定，与通用版一致）：

| 序号 | 菜单名称 | 说明 |
| ---- | -------- | ---- |
| 1 | 文件管理 | 沿用工作台下的文件路由，如 `/my/files`、`/dept/files`、`/org/files` |
| 2 | 知识卡管理 | 沿用工作台下的知识卡路由，如 `/my/knowledge-cards` 等 |
| 3 | 分身管理 | 沿用工作台分身配置或管理端分身管理路由（按角色展示对应入口） |
| 4 | 机构管理 | `/admin/organizations` |
| 5 | 科室管理 | `/admin/departments` |
| 6 | 用户管理 | `/admin/users` |

工作台分组（`my` / `dept` / `org`）下的文件、知识卡、分身子项**路径与权限不变**；侧栏通过 `flattenChildren` 隐藏分组标题，将子项提升为顶层菜单展示。

#### 5.4.3 侧边栏隐藏项

以下入口在侧边栏**对应分组下不展示**（包括但不限于）：

| 隐藏项 | 典型归属分组 / 位置 | 路由是否保留 |
| ------ | ------------------- | ------------ |
| 仪表盘 | 顶层 | 保留，如 `/` |
| 我的工作台 / 科室工作台 / 机构工作台 **分组标题** | 工作台分组外壳 | 分组本身不展示；其下保留子项按 5.4.2 单独展示 |
| 数字医生体验 | 顶层 | 保留，如 `/chat` |
| 知识库搜索 | 顶层 | 保留，如 `/knowledge-base` |
| API Token 管理 | 系统管理 | 保留，如 `/admin/api-tokens` |
| 个人资料等 | 用户下拉等非侧边栏入口 | 按产品决定是否同步隐藏；**不在**本次侧边栏裁剪范围内强制要求 |

#### 5.4.4 实现方案（最小改动）

采用「**配置打标 + 侧栏过滤一次接入**」，仅改动 2 个文件，其余模块不动。

##### 改动范围

| 文件 | 是否修改 | 说明 |
| ---- | -------- | ---- |
| `src/config/menu.ts` | **是** | 扩展 `MenuConfig`；为本项目定制项补充 `hidden` / `flattenChildren` |
| `src/layouts/MainLayout.vue` | **是** | 在现有 `filterMenu` 中读取上述字段（约 10 行内） |
| `src/router/routes.ts` | **否** | 路由定义、`meta.hidden`（TagsView 用）保持原样 |
| `src/views/**`、API、Store | **否** | 业务逻辑与页面内跳转不变 |
| `src/utils/breadcrumb.ts` | **否** | 仍传入完整 `menuConfig`，面包屑链路不受影响 |

> 说明：路由 `meta.hidden` 仅用于 TagsView / 详情页等，**不驱动侧边栏**。侧边栏与路由菜单是两套机制，本次只扩展 `MenuConfig`。

##### `MenuConfig` 新增字段

```ts
export interface MenuConfig {
  // ...既有字段
  /** 为 true 时不在侧边栏展示该项（不删配置、不改 path） */
  hidden?: boolean
  /**
   * 为 true 时：父级分组标题不在侧栏展示，
   * 将经权限过滤后的 children 提升到当前层级（用于工作台分组扁平化）
   */
  flattenChildren?: boolean
}
```

##### `MainLayout.filterMenu` 行为（在既有权限过滤之前/之后均可，不改变权限结论）

1. 遍历前：若 `item.hidden === true`，跳过该项。
2. 若 `item.flattenChildren === true` 且存在 `children`：不渲染父级 SubMenu，对 `children` 递归 `filterMenu` 后**拼接到当前层级**（仍走 `showWhenAvatar` / `requiredRoles`）。
3. 其余逻辑（角色、工作台、`children` 为空则隐藏父级）与通用版一致。
4. `menuItems` 使用过滤结果；`breadcrumbItems`、`findKey` / `findPath` 仍基于**完整** `menuConfig`（未裁剪的 import），保证直接访问 URL 时高亮与面包屑可用。

##### 上海市第一人民医院分支：`menu.ts` 配置清单

在 `feature/shanghai-first-hospital-customization` 分支中，对 `menuConfig` 增加如下标记（通用主分支可不加这些字段，字段默认为 `undefined` 即展示）：

| `key` | `hidden` | `flattenChildren` | 侧栏效果 |
| ----- | -------- | ----------------- | -------- |
| `dashboard` | `true` | — | 不展示仪表盘 |
| `my` | — | `true` | 不展示「我的工作台」标题；展示文件 / 知识卡 / 分身（有权限时） |
| `dept` | — | `true` | 不展示「科室工作台」标题；展示子项 |
| `org` | — | `true` | 不展示「机构工作台」标题；展示子项 |
| `chat` | `true` | — | 不展示数字医生 |
| `knowledge-base` | `true` | — | 不展示知识库搜索 |
| `admin` | — | — | 保留「系统管理」分组 |
| `admin-org` | — | — | 保留机构管理 |
| `admin-dept` | — | — | 保留科室管理 |
| `admin-user` | — | — | 保留用户管理 |
| `admin-avatar` | `true` | — | 不展示管理端分身列表（分身入口走工作台 `/my/avatar` 等） |
| `admin-token` | `true` | — | 不展示 API Token |

配置示例（节选）：

```ts
{
  key: 'dashboard',
  label: 'menu.dashboard',
  icon: () => h(DashboardOutlined),
  path: '/',
  hidden: true,
},
{
  key: 'my',
  label: 'menu.myWorkbench',
  flattenChildren: true,
  // ...其余字段不变
},
```

##### 实施步骤

1. 在 `MenuConfig` 增加 `hidden?`、`flattenChildren?`（主分支可合入类型定义，默认不赋值即与现网一致）。
2. 在 `MainLayout.vue` 的 `filterMenu` 实现上述 2 条展示规则。
3. 在定制分支 `menu.ts` 按 5.4.4 配置表打标。
4. 本地验证：侧栏仅见 6 类入口；直接访问 `/`、`/chat`、`/admin/api-tokens` 等仍可打开且权限正常；面包屑与 TagsView 无异常。

##### 禁止事项

- **禁止**从 `menuConfig` 中删除节点以「实现裁剪」（会导致面包屑 `leafPaths`、菜单 key 与路由同步缺失）。
- **禁止**为裁剪而在 `routes.ts` 或路由守卫中禁用访问。
- **禁止**改动 `requiredRoles` / `showWhenAvatar` 以变相隐藏菜单。

#### 5.4.5 关联文件

- `src/config/menu.ts` — 菜单事实来源与定制打标
- `src/layouts/MainLayout.vue` — 侧边栏 `filterMenu` 唯一接入点
- `src/router/routes.ts` — 只读对照，定制分支不修改
- `src/utils/breadcrumb.ts` — 使用完整 `menuConfig`，无需为本需求修改

## 6. 验收标准

### 6.1 知识卡详情

- 打开知识卡详情时，可以同时看到 JSON 与 Markdown 两栏。
- JSON 栏只读，无法编辑。
- Markdown 栏正常渲染原正文。
- 编辑知识卡时只能修改 Markdown 正文。
- 保存后知识卡 Markdown 内容正确更新，JSON 不被前端直接修改。

### 6.2 知识召回测试

- 页面可以输入 Query 并发起测试。
- 查询完成后展示回答内容。
- 查询完成后展示相关知识卡列表。
- 查询失败、无结果、加载中均有明确状态。

### 6.3 品牌定制

- 登录页展示医院定制背景图。
- 系统中文名称统一显示为 `公济乐谱`。
- 系统英文名称显示为 `Mediverse Management`。
- 主页面左上角显示医院 Logo 与 `公济乐谱`。
- 浏览器标题、加载页、登录页品牌文案无残留 `医数智台`。

### 6.4 菜单定制

- 侧边栏只显示 5.4.2 中指定的 6 类业务入口；保留项 `path` 与通用版一致。
- 5.4.3 所列入口及 5.4.4 配置表中 `hidden: true` 的项不在侧栏展示；工作台分组标题通过 `flattenChildren` 隐藏，子项扁平展示。
- 实现仅涉及 `menu.ts` 打标与 `MainLayout.filterMenu` 展示逻辑，未修改 `routes.ts`、路由守卫、权限字段与业务页面。
- 直接输入 URL、已打开标签页或页面内链接访问被隐藏路由时，权限与页面行为与通用版一致；面包屑仍可根据完整 `menuConfig` 与路由 `meta.title` 正常工作。

## 7. 待确认点

1. JSON 数据来源：知识卡详情中的 JSON 是后端新增字段、现有字段解析结果，还是由 Markdown 派生。
2. JSON 编辑器选型：是否允许新增依赖，或基于现有组件实现只读 JSON 展示。
3. 知识召回测试接口：是否已有后端接口；如没有，需要确认请求路径、入参和返回结构。
4. ~~菜单裁剪方式~~：已确认——`MenuConfig.hidden` + `flattenChildren`，仅改 `menu.ts` 与 `MainLayout.filterMenu`；见 5.4.4。
5. 医院 Logo 是否使用当前参考图裁切，还是由设计方提供透明底正式文件。
6. 登录背景图是否使用当前参考图，还是由设计方提供无文字/可适配登录框的正式背景图。
