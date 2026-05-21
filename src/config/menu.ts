import type { VNode } from 'vue'
import type { UserRole } from '@/types/auth'
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  BankOutlined,
  RobotOutlined,
  SearchOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  ApartmentOutlined,
  IdcardOutlined,
} from '@ant-design/icons-vue'
import { h } from 'vue'

/** 工作台显示条件：由登录接口 user.has_*_avatar 决定 */
export type WorkbenchAvatarKind = 'expert' | 'dept' | 'org'

export interface MenuConfig {
  key: string
  label: string // i18n key
  icon?: () => VNode
  path?: string
  requiredRoles?: UserRole[]
  /** 存在时按 user.has_*_avatar 显示工作台，不按 requiredRoles */
  showWhenAvatar?: WorkbenchAvatarKind
  /** 为 true 时不在侧边栏展示该项，不影响路由访问 */
  hidden?: boolean
  children?: MenuConfig[]
}

export const menuConfig: MenuConfig[] = [
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
    icon: () => h(UserOutlined),
    showWhenAvatar: 'expert',
    requiredRoles: ['user'],
    children: [
      { key: 'my-files', label: 'menu.files', path: '/my/files' },
      { key: 'my-knowledge', label: 'menu.knowledgeCards', path: '/my/knowledge-cards' },
      { key: 'my-avatar', label: 'menu.avatarConfig', path: '/my/avatar', hidden: true },
    ],
  },
  {
    key: 'dept',
    label: 'menu.deptWorkbench',
    icon: () => h(TeamOutlined),
    showWhenAvatar: 'dept',
    requiredRoles: ['dept_admin'],
    children: [
      { key: 'dept-files', label: 'menu.files', path: '/dept/files' },
      { key: 'dept-knowledge', label: 'menu.knowledgeCards', path: '/dept/knowledge-cards' },
      { key: 'dept-avatar', label: 'menu.avatarConfig', path: '/dept/avatar', hidden: true },
    ],
  },
  {
    key: 'org',
    label: 'menu.orgWorkbench',
    icon: () => h(BankOutlined),
    showWhenAvatar: 'org',
    requiredRoles: ['org_admin'],
    children: [
      { key: 'org-files', label: 'menu.files', path: '/org/files' },
      { key: 'org-knowledge', label: 'menu.knowledgeCards', path: '/org/knowledge-cards' },
      { key: 'org-avatar', label: 'menu.avatarConfig', path: '/org/avatar', hidden: true },
    ],
  },
  {
    key: 'chat',
    label: 'menu.digitalDoctor',
    icon: () => h(RobotOutlined),
    path: '/chat',
    hidden: true,
  },
  {
    key: 'knowledge-base',
    label: 'menu.knowledgeBase',
    icon: () => h(SearchOutlined),
    path: '/knowledge-base',
    hidden: true,
  },
  {
    key: 'admin',
    label: 'menu.systemManagement',
    icon: () => h(SettingOutlined),
    requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
    children: [
      {
        key: 'admin-org',
        label: 'menu.orgManagement',
        path: '/admin/organizations',
        requiredRoles: ['sysadmin'],
        icon: () => h(BankOutlined),
      },
      {
        key: 'admin-dept',
        label: 'menu.deptManagement',
        path: '/admin/departments',
        requiredRoles: ['sysadmin', 'org_admin'],
        icon: () => h(ApartmentOutlined),
      },
      {
        key: 'admin-user',
        label: 'menu.userManagement',
        path: '/admin/users',
        requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
        icon: () => h(TeamOutlined),
      },
      {
        key: 'admin-avatar',
        label: 'menu.avatarManagement',
        path: '/admin/avatars',
        requiredRoles: ['sysadmin', 'org_admin', 'dept_admin'],
        icon: () => h(IdcardOutlined),
      },
      {
        key: 'admin-token',
        label: 'menu.apiToken',
        path: '/admin/api-tokens',
        requiredRoles: ['sysadmin', 'org_admin'],
        icon: () => h(SafetyCertificateOutlined),
        hidden: true,
      },
    ],
  },
]
