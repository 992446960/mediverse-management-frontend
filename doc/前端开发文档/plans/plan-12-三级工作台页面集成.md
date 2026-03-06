# Plan 12: 三级工作台页面集成

> 来源阶段：Phase 3（任务 3.13~3.23）  
> 前置依赖：Plan 09（文件管理组件）、Plan 10（知识卡组件）、Plan 11（分身配置与统计组件）  
> 项目目录：`mediverse-management-frontend/`

---

## 一、设计文档

| 文档 | 路径 | 参考章节 |
|------|------|---------|
| 产品规划 | `doc/初始文档/产品规划.md` | 三级工作台功能范围 |
| 原型交互 | `doc/初始文档/原型交互设计.md` | 机构/科室/个人工作台页面布局 |
| 前端架构与阶段规划 | `doc/前端开发文档/前端开发架构与阶段规划.md` | Phase 3 任务 3.13~3.23、四.2 工作台组件复用架构 |
| 前端实施指南 | `doc/前端开发文档/前端开发实施指南.md` | 五.1 工作台上下文注入（薄壳模式示例） |

### 关键设计要点

- 本计划为**薄壳页面集成**：所有核心逻辑已在 Plan 09/10/11 的通用组件中实现
- 页面组件仅负责注入 ownerType/ownerId 上下文 + 组合通用组件
- 三级工作台（机构/科室/个人）每级包含：分身配置页、文件管理页、知识卡管理页
- 科室/机构工作台顶部使用 WorkspaceScopeSelector
- 对话测试页先创建占位，Phase 4 完成后接入

---

## 二、参与的智能体与 Skills

| 角色 | 智能体/Skill | 职责 |
|------|-------------|------|
| 执行 | `frontend-developer` | 创建全部薄壳页面，注入 workspace context，注册路由 |
| 参考 | Skill: `vue-best-practices` | provide/inject、script setup |
| 参考 | Skill: `vue-router-best-practices` | 路由参数、嵌套路由 |

---

## 三、计划内容

### 3.1 任务清单

| 编号 | 任务 | 描述 | 涉及文件 |
|------|------|------|---------|
| **机构工作台** | | | |
| 12-1 | 机构分身配置页 | 注入 ownerType='org' + WorkspaceScopeSelector(level='org') + AvatarConfig + AvatarStats | `src/views/org/Avatar.vue` |
| 12-2 | 机构文件管理页 | 注入 ownerType='org' + DirectoryTree + FileTable + FileUploader | `src/views/org/Files.vue` |
| 12-3 | 机构知识卡页 | 注入 ownerType='org' + KnowledgeCardList + KnowledgeCardEditor + KnowledgeCardViewer | `src/views/org/KnowledgeCards.vue` |
| 12-4 | 机构对话测试页（占位） | 占位页面，显示"请先完成 Phase 4"提示 | `src/views/org/AvatarTest.vue` |
| **科室工作台** | | | |
| 12-5 | 科室分身配置页 | WorkspaceScopeSelector(level='dept') + AvatarConfig + AvatarStats | `src/views/dept/Avatar.vue` |
| 12-6 | 科室文件管理页 | 同 12-2 但 ownerType='dept' | `src/views/dept/Files.vue` |
| 12-7 | 科室知识卡页 | 同 12-3 但 ownerType='dept' | `src/views/dept/KnowledgeCards.vue` |
| 12-8 | 科室对话测试页（占位） | 占位 | `src/views/dept/AvatarTest.vue` |
| **个人工作台** | | | |
| 12-9 | 我的分身配置页 | ownerType='personal' + AvatarConfig + AvatarStats，使用 `/api/v1/my/avatar` | `src/views/my/Avatar.vue` |
| 12-10 | 我的文件管理页 | ownerType='personal' + DirectoryTree + FileTable + FileUploader | `src/views/my/Files.vue` |
| 12-11 | 我的文件预览页 | 路由 `/my/files/:id` + FilePreview 组件 | `src/views/my/FileDetail.vue` |
| 12-12 | 我的知识卡页 | ownerType='personal' + 知识卡全家桶 | `src/views/my/KnowledgeCards.vue` |
| **路由注册** | | | |
| 12-13 | 补全路由 | 在 router 中注册所有工作台页面路由，含 meta.requiredRoles | `src/router/routes.ts`（补充） |

### 3.2 薄壳页面代码模式

```vue
<!-- 所有工作台页面遵循此模式 -->
<template>
  <WorkspaceScopeSelector v-if="needSelector" :level="level" v-model:org-id="orgId" v-model:dept-id="deptId" />
  <TargetComponent v-if="ownerId" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { provideWorkspaceContext } from '@/composables/useWorkspaceContext'

provideWorkspaceContext({
  ownerType: 'org',  // 或 'dept' 或 'personal'
  ownerId: computed(() => selectedOrgId.value),
})
</script>
```

### 3.3 页面与路由映射

| 路由 | 页面文件 | requiredRoles |
|------|---------|---------------|
| `/org/avatar` | `org/Avatar.vue` | `sysadmin`, `org_admin` |
| `/org/files` | `org/Files.vue` | `sysadmin`, `org_admin` |
| `/org/knowledge-cards` | `org/KnowledgeCards.vue` | `sysadmin`, `org_admin` |
| `/org/avatar/test` | `org/AvatarTest.vue` | `sysadmin`, `org_admin` |
| `/dept/avatar` | `dept/Avatar.vue` | `sysadmin`, `org_admin`, `dept_admin` |
| `/dept/files` | `dept/Files.vue` | `sysadmin`, `org_admin`, `dept_admin` |
| `/dept/knowledge-cards` | `dept/KnowledgeCards.vue` | `sysadmin`, `org_admin`, `dept_admin` |
| `/dept/avatar/test` | `dept/AvatarTest.vue` | `sysadmin`, `org_admin`, `dept_admin` |
| `/my/avatar` | `my/Avatar.vue` | 所有已登录用户 |
| `/my/files` | `my/Files.vue` | 所有已登录用户 |
| `/my/files/:id` | `my/FileDetail.vue` | 所有已登录用户 |
| `/my/knowledge-cards` | `my/KnowledgeCards.vue` | 所有已登录用户 |

---

## 四、验收效果

- [ ] 机构工作台三个页面（分身配置/文件管理/知识卡）正常渲染
- [ ] 机构工作台顶部机构选择器工作正常，切换后数据刷新
- [ ] 科室工作台三个页面正常渲染
- [ ] 科室工作台联动选择器（机构→科室）工作正常
- [ ] 个人工作台三个页面 + 文件预览页正常渲染
- [ ] 所有页面的 ownerType/ownerId 通过 provide/inject 正确传递
- [ ] 通用组件（DirectoryTree/FileTable/KnowledgeCardList 等）在三级工作台中均可正常使用
- [ ] 路由权限控制正确：user 角色无法访问科室/机构工作台
- [ ] 对话测试页占位正常，显示待实现提示
- [ ] 页面组件代码量极少（薄壳模式），无重复业务逻辑
