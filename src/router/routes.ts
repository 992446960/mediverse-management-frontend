import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
        path: 'files',
        name: 'MyFiles',
        component: () => import('@/views/my/Files.vue'),
        meta: { title: 'menu.files' },
      },
      {
        path: 'files/preview/:id',
        name: 'MyFilesPreview',
        component: () => import('@/views/shared/FilePreviewPage.vue'),
        meta: { title: 'knowledge.preview', hidden: true },
      },
      {
        path: 'knowledge-cards',
        name: 'MyKnowledgeCards',
        component: () => import('@/views/my/KnowledgeCards.vue'),
        meta: { title: 'menu.knowledgeCards' },
      },
      {
        path: 'avatar',
        name: 'MyAvatar',
        component: () => import('@/views/my/Avatar.vue'),
        meta: { title: 'menu.avatarConfig' },
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
        name: 'DeptFiles',
        component: () => import('@/views/dept/Files.vue'),
        meta: { title: 'menu.files' },
      },
      {
        path: 'files/preview/:id',
        name: 'DeptFilesPreview',
        component: () => import('@/views/shared/FilePreviewPage.vue'),
        meta: { title: 'knowledge.preview', hidden: true },
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
        name: 'OrgFiles',
        component: () => import('@/views/org/Files.vue'),
        meta: { title: 'menu.files' },
      },
      {
        path: 'files/preview/:id',
        name: 'OrgFilesPreview',
        component: () => import('@/views/shared/FilePreviewPage.vue'),
        meta: { title: 'knowledge.preview', hidden: true },
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
    ],
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('@/views/chat/index.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.digitalDoctor',
      requiresAuth: true,
    },
  },
  {
    path: '/chat/session/:id',
    name: 'ChatSession',
    component: () => import('@/views/chat/Session.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.digitalDoctor',
      requiresAuth: true,
      hidden: true,
    },
  },
  {
    path: '/knowledge-base',
    name: 'KnowledgeBase',
    component: () => import('@/views/knowledge-base/index.vue'),
    meta: {
      layout: 'MainLayout',
      title: 'menu.knowledgeBase',
      requiresAuth: true,
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
        meta: { title: 'menu.apiToken', requiredRoles: ['sysadmin'] },
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
