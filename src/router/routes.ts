import type { RouteRecordRaw } from 'vue-router'

/**
 * 路由配置约定（与 `guards.ts` 权限守卫、`App.vue` 布局选择配合使用）
 *
 * ## `meta` 常用字段（扩展见 `@/types/router.ts`）
 *
 * ```ts
 * {
 *   layout:
 *     "'MainLayout' 侧栏主布局；'FullscreenLayout' 全屏（登录、错误页等）",
 *   title:
 *     '侧栏/标签页标题，一般为 i18n key（如 menu.dashboard）；setDocumentTitle 会用于 document.title',
 *   requiresAuth: '需登录；未登录会跳转 /login?redirect=原路径',
 *   requiredRoles: '需具备任一角色，否则跳转 /403（类型为 UserRole[]）',
 *   hidden: 'true 时不显示在菜单里（详情、预览、404 等）',
 *   affix: 'true 时标签页可固定（如首页）',
 *   noCache: 'true 时不做 keep-alive 缓存',
 *   icon: '菜单图标（若侧栏读取）',
 *   order: '菜单排序（若侧栏读取）',
 * }
 * ```
 *
 * ## 路径规则
 *
 * - 子路由 `path` 不以 `/` 开头时为相对路径，最终 URL 为父 path + 子 path（如父 `/my` + 子 `profile` → `/my/profile`）。
 * - 动态段：`preview/:id`；可选/重复匹配见 Vue Router 文档。
 * - 全站兜底：`/:pathMatch(.*)*` 放**最后**，避免吞掉其他路由。
 *
 * ## 完整配置示例（注释模板，勿直接粘贴进数组；按业务改名、改路径与组件）
 *
 * ```ts
 * // 1) 重定向
 * {
 *   path: '/redirect/:path(.*)',
 *   name: 'Redirect',
 *   component: () => import('@/views/shared/Redirect.vue'),
 *   meta: { layout: 'MainLayout', title: '', hidden: true },
 * }
 *
 * // 2) 全屏公开页
 * {
 *   path: '/login',
 *   name: 'Login',
 *   component: () => import('@/views/auth/Login.vue'),
 *   meta: { layout: 'FullscreenLayout', title: 'menu.login', hidden: true },
 * }
 *
 * // 3) 单页 + 主布局 + 登录 + 固定标签
 * {
 *   path: '/',
 *   name: 'Dashboard',
 *   component: () => import('@/views/Dashboard.vue'),
 *   meta: {
 *     layout: 'MainLayout',
 *     title: 'menu.dashboard',
 *     requiresAuth: true,
 *     affix: true,
 *   },
 * }
 *
 * // 4) 父级仅分组（无 component），子路由挂实际页面
 * {
 *   path: '/example',
 *   name: 'ExampleGroup',
 *   meta: {
 *     layout: 'MainLayout',
 *     title: 'menu.example',
 *     requiresAuth: true,
 *     requiredRoles: ['org_admin'],
 *   },
 *   children: [
 *     {
 *       path: 'list',
 *       name: 'ExampleList',
 *       component: () => import('@/views/example/List.vue'),
 *       meta: { title: 'menu.exampleList' },
 *     },
 *     {
 *       path: 'detail/:id',
 *       name: 'ExampleDetail',
 *       component: () => import('@/views/example/Detail.vue'),
 *       meta: { title: 'menu.exampleDetail', hidden: true },
 *     },
 *   ],
 * }
 *
 * // 5) 布局壳子路由（父 component 为 Layout，默认子路由 path: ''）
 * {
 *   path: '/nested',
 *   component: () => import('@/views/example/NestedLayout.vue'),
 *   meta: {
 *     layout: 'MainLayout',
 *     title: 'menu.nested',
 *     requiresAuth: true,
 *   },
 *   children: [
 *     {
 *       path: '',
 *       name: 'NestedHome',
 *       component: () => import('@/views/example/NestedHome.vue'),
 *       meta: { title: 'menu.nested', noCache: true },
 *     },
 *     {
 *       path: 'sub/:sid',
 *       name: 'NestedSub',
 *       component: () => import('@/views/example/NestedSub.vue'),
 *       meta: { title: 'menu.nestedSub' },
 *     },
 *   ],
 * }
 *
 * // 6) 错误页与兜底
 * {
 *   path: '/403',
 *   name: 'Forbidden',
 *   component: () => import('@/views/error/403.vue'),
 *   meta: { layout: 'FullscreenLayout', title: '403 Forbidden', hidden: true },
 * }
 * {
 *   path: '/:pathMatch(.*)*',
 *   name: 'NotFound',
 *   component: () => import('@/views/error/404.vue'),
 *   meta: { layout: 'FullscreenLayout', title: '404 Not Found', hidden: true },
 * }
 * ```
 */
const routes: RouteRecordRaw[] = [
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
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: 'menu.login',
      hidden: true,
    },
  },
  {
    path: '/change-password',
    name: 'ChangePassword',
    component: () => import('@/views/auth/ChangePassword.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: 'menu.changePassword',
      requiresAuth: true,
      hidden: true,
    },
  },
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.dashboard',
      requiresAuth: true,
      affix: true,
    },
  },
  {
    path: '/my',
    name: 'MyWorkbench',
    meta: {
      layout: 'MainLayout',
      title: 'menu.myWorkbench',
      requiresAuth: true,
    },
    children: [
      {
        path: 'profile',
        name: 'MyProfile',
        component: () => import('@/views/my/Profile.vue'),
        meta: { title: 'menu.profile' },
      },
      {
        path: 'files',
        component: () => import('@/views/shared/FilesLayout.vue'),
        meta: { title: 'menu.files', requiredRoles: ['user'] },
        children: [
          { path: '', name: 'MyFiles', component: () => import('@/views/my/Files.vue') },
          {
            path: 'preview/:id',
            name: 'MyFilesPreview',
            component: () => import('@/views/shared/FilePreviewPage.vue'),
            meta: { title: 'knowledge.preview', hidden: true, requiredRoles: ['user'] },
          },
        ],
      },
      {
        path: 'knowledge-cards',
        name: 'MyKnowledgeCards',
        component: () => import('@/views/my/KnowledgeCards.vue'),
        meta: { title: 'menu.knowledgeCards', requiredRoles: ['user'] },
      },
      {
        path: 'avatar',
        name: 'MyAvatar',
        component: () => import('@/views/my/Avatar.vue'),
        meta: { title: 'menu.avatarConfig', requiredRoles: ['user'] },
      },
      {
        path: 'avatar/test',
        name: 'MyAvatarTest',
        component: () => import('@/views/my/AvatarTest.vue'),
        meta: { title: 'menu.avatarTest', requiredRoles: ['user'] },
      },
    ],
  },
  {
    path: '/dept',
    name: 'DeptWorkbench',
    meta: {
      layout: 'MainLayout',
      title: 'menu.deptWorkbench',
      requiresAuth: true,
      requiredRoles: ['dept_admin'],
    },
    children: [
      {
        path: 'files',
        component: () => import('@/views/shared/FilesLayout.vue'),
        meta: { title: 'menu.files' },
        children: [
          { path: '', name: 'DeptFiles', component: () => import('@/views/dept/Files.vue') },
          {
            path: 'preview/:id',
            name: 'DeptFilesPreview',
            component: () => import('@/views/shared/FilePreviewPage.vue'),
            meta: { title: 'knowledge.preview', hidden: true },
          },
        ],
      },
      {
        path: 'knowledge-cards',
        name: 'DeptKnowledgeCards',
        component: () => import('@/views/dept/KnowledgeCards.vue'),
        meta: { title: 'menu.knowledgeCards' },
      },
      {
        path: 'avatar',
        name: 'DeptAvatar',
        component: () => import('@/views/dept/Avatar.vue'),
        meta: { title: 'menu.avatarConfig' },
      },
      {
        path: 'avatar/test',
        name: 'DeptAvatarTest',
        component: () => import('@/views/dept/AvatarTest.vue'),
        meta: { title: 'menu.avatarTest' },
      },
    ],
  },
  {
    path: '/org',
    name: 'OrgWorkbench',
    meta: {
      layout: 'MainLayout',
      title: 'menu.orgWorkbench',
      requiresAuth: true,
      requiredRoles: ['org_admin'],
    },
    children: [
      {
        path: 'files',
        component: () => import('@/views/shared/FilesLayout.vue'),
        meta: { title: 'menu.files' },
        children: [
          { path: '', name: 'OrgFiles', component: () => import('@/views/org/Files.vue') },
          {
            path: 'preview/:id',
            name: 'OrgFilesPreview',
            component: () => import('@/views/shared/FilePreviewPage.vue'),
            meta: { title: 'knowledge.preview', hidden: true },
          },
        ],
      },
      {
        path: 'knowledge-cards',
        name: 'OrgKnowledgeCards',
        component: () => import('@/views/org/KnowledgeCards.vue'),
        meta: { title: 'menu.knowledgeCards' },
      },
      {
        path: 'avatar',
        name: 'OrgAvatar',
        component: () => import('@/views/org/Avatar.vue'),
        meta: { title: 'menu.avatarConfig' },
      },
      {
        path: 'avatar/test',
        name: 'OrgAvatarTest',
        component: () => import('@/views/org/AvatarTest.vue'),
        meta: { title: 'menu.avatarTest' },
      },
    ],
  },
  {
    path: '/chat',
    component: () => import('@/views/chat/layout.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.digitalDoctor',
      requiresAuth: true,
    },
    children: [
      {
        path: '',
        name: 'ChatHome',
        component: () => import('@/views/chat/index.vue'),
        meta: { title: 'menu.digitalDoctor', noCache: true },
      },
      {
        path: 'session/:id',
        name: 'ChatSession',
        component: () => import('@/views/chat/Session.vue'),
        meta: { title: 'menu.avatarChat' },
      },
    ],
  },
  {
    path: '/knowledge-base',
    name: 'KnowledgeBase',
    component: () => import('@/views/knowledge-base/index.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.knowledgeBase',
      requiresAuth: true,
      noCache: true,
    },
  },
  {
    path: '/knowledge-base/search/new',
    name: 'KnowledgeBaseSearchNew',
    component: () => import('@/views/knowledge-base/Search.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.knowledgeBase',
      requiresAuth: true,
      hidden: true,
      noCache: true,
    },
  },
  {
    path: '/knowledge-base/search/:id',
    name: 'KnowledgeBaseSearch',
    component: () => import('@/views/knowledge-base/Search.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.knowledgeBase',
      requiresAuth: true,
      hidden: true,
      noCache: true,
    },
  },
  {
    path: '/admin',
    name: 'Admin',
    meta: {
      layout: 'MainLayout',
      title: 'menu.systemManagement',
      requiresAuth: true,
      requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
    },
    children: [
      {
        path: 'organizations',
        name: 'AdminOrganizations',
        component: () => import('@/views/admin/Organizations/index.vue'),
        meta: { title: 'menu.orgManagement', requiredRoles: ['sysadmin'] },
      },
      {
        path: 'departments',
        name: 'AdminDepartments',
        component: () => import('@/views/admin/Departments/index.vue'),
        meta: { title: 'menu.deptManagement', requiredRoles: ['sysadmin', 'org_admin'] },
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users/index.vue'),
        meta: {
          title: 'menu.userManagement',
          requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
        },
      },
      {
        path: 'avatars',
        name: 'AdminAvatars',
        component: () => import('@/views/admin/Avatars/index.vue'),
        meta: {
          title: 'menu.avatarManagement',
          requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
        },
      },
      {
        path: 'api-tokens',
        name: 'AdminApiTokens',
        component: () => import('@/views/admin/ApiTokens/index.vue'),
        meta: { title: 'menu.apiToken', requiredRoles: ['sysadmin', 'org_admin'] },
      },
    ],
  },
  {
    path: '/403',
    name: 'Forbidden',
    component: () => import('@/views/error/403.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: '403 Forbidden',
      hidden: true,
    },
  },
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
  {
    path: '/preview',
    name: 'UniversalFilePreview',
    component: () => import('@/views/shared/UniversalPreviewPage.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: 'knowledge.filePreview',
      hidden: true,
      requiresAuth: true,
    },
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: {
      layout: 'FullscreenLayout',
      title: '404 Not Found',
      hidden: true,
    },
  },
]

export default routes
