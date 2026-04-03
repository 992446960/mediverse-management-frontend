<template>
  <a-layout class="main-layout h-full min-h-0">
    <a-layout-sider
      v-model:collapsed="collapsed"
      collapsible
      :trigger="null"
      class="sider"
      :style="{
        background: 'var(--color-bg-sidebar)',
        borderRight: '1px solid var(--color-bg-sidebar-border)',
      }"
    >
      <div class="logo">
        <img class="logo__img" :src="logoUrl" alt="" width="28" height="28" />
        <span v-if="!collapsed" class="logo__text">{{ t('app.brandName') }}</span>
      </div>
      <a-menu
        v-model:selected-keys="selectedKeys"
        v-model:open-keys="openKeys"
        :theme="themeStore.isDark ? 'dark' : 'light'"
        mode="inline"
        :items="menuItems"
        @click="handleMenuClick"
      />
    </a-layout-sider>
    <a-layout
      class="main-right-layout flex-1 min-h-0 min-w-0"
      :style="{ marginLeft: collapsed ? '80px' : '200px', transition: 'margin-left 0.2s' }"
    >
      <a-layout-header class="header">
        <div class="header-left">
          <menu-unfold-outlined
            v-if="collapsed"
            class="trigger"
            @click="() => (collapsed = !collapsed)"
          />
          <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
          <a-breadcrumb>
            <a-breadcrumb-item
              v-for="(item, index) in breadcrumbItems"
              :key="`${item.href}-${index}`"
            >
              <router-link v-if="item.linkable" :to="item.href">
                {{ t(item.titleKey) }}
              </router-link>
              <span v-else>{{ t(item.titleKey) }}</span>
            </a-breadcrumb-item>
          </a-breadcrumb>
        </div>
        <div class="header-right">
          <ThemeSwitcher />
          <LocaleSwitcher />
          <a-dropdown
            :trigger="['click']"
            :min-overlay-width-match-trigger="false"
            overlay-class-name="user-menu-overlay"
          >
            <div class="user-dropdown-trigger group">
              <a-avatar
                :src="user?.avatar_url ? toAbsoluteFileUrl(user.avatar_url) : undefined"
                :size="28"
                class="user-avatar"
              >
                <template #icon><UserOutlined /></template>
              </a-avatar>
              <span class="user-name">{{
                user?.full_name || user?.username || t('common.user')
              }}</span>
              <DownOutlined class="arrow-icon" />
            </div>
            <template #overlay>
              <a-menu class="user-menu" @click="handleUserMenuClick">
                <a-menu-item key="profile">
                  <UserOutlined />
                  <span class="user-menu-item-text">{{ t('common.profile') }}</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout">
                  <LogoutOutlined />
                  <span class="user-menu-item-text">{{ t('menu.logout') }}</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>
      <TagsView />
      <a-layout-content class="content">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { usePermission } from '@/composables/usePermission'
import { menuConfig } from '@/config/menu'
import { buildBreadcrumbItems } from '@/utils/breadcrumb'
import ThemeSwitcher from '@/components/ThemeSwitcher/index.vue'
import LocaleSwitcher from '@/components/LocaleSwitcher/index.vue'
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DownOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { toAbsoluteFileUrl } from '@/api/upload'
import TagsView from '@/components/TagsView/index.vue'
import type { ItemType } from 'ant-design-vue'
import logoUrl from '@/assets/logo.svg?url'

const collapsed = ref(false)
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])

const currentRoute = useRoute()
const router = useRouter()
const { t } = useI18n()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const { checkRoles } = usePermission()

const user = computed(() => authStore.user)

const breadcrumbItems = computed(() => buildBreadcrumbItems(currentRoute, menuConfig))

// Filter menu items: 工作台按 user.has_*_avatar + requiredRoles（权限矩阵），其余按 requiredRoles
const filterMenu = (items: any[]): ItemType[] => {
  return items
    .filter((item) => {
      if (item.showWhenAvatar) {
        let avatarOk = false
        if (item.showWhenAvatar === 'expert') avatarOk = authStore.hasExpertAvatar
        else if (item.showWhenAvatar === 'dept') avatarOk = authStore.hasDeptAvatar
        else if (item.showWhenAvatar === 'org') avatarOk = authStore.hasOrgAvatar
        if (!avatarOk) return false
        // 工作台需同时满足角色：我的工作台仅 user，机构工作台仅 org_admin，科室工作台仅 dept_admin
        if (item.requiredRoles && !checkRoles(item.requiredRoles)) return false
        return true
      }
      if (item.requiredRoles && !checkRoles(item.requiredRoles)) return false
      return true
    })
    .map((item) => {
      const newItem: any = {
        key: item.key,
        label: t(item.label),
        icon: item.icon,
        title: t(item.label),
      }
      if (item.children) {
        newItem.children = filterMenu(item.children)
      }
      return newItem
    })
    .filter((newItem: any) => {
      // 有 children 但被过滤成空时不再展示该父级
      if (newItem.children && newItem.children.length === 0) return false
      return true
    })
}

const menuItems = computed(() => filterMenu(menuConfig))

const handleMenuClick = ({ key }: { key: string }) => {
  const findPath = (items: any[]): string | undefined => {
    for (const item of items) {
      if (item.key === key) return item.path
      if (item.children) {
        const path = findPath(item.children)
        if (path) return path
      }
    }
  }
  const path = findPath(menuConfig)
  if (path) {
    router.push(path)
  }
}

const handleUserMenuClick = async ({ key }: { key: string }) => {
  if (key === 'logout') {
    await authStore.logout()
    router.push('/login')
  } else if (key === 'profile') {
    router.push('/my/profile')
  }
}

// Sync menu selection with route
watch(
  () => currentRoute.path,
  () => {
    const findKey = (items: any[]): string | undefined => {
      for (const item of items) {
        if (item.path === currentRoute.path) return item.key
        if (item.children) {
          const key = findKey(item.children)
          if (key) return key
        }
      }
    }
    const key = findKey(menuConfig)
    if (key) {
      selectedKeys.value = [key]
    } else {
      selectedKeys.value = []
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.main-layout {
  min-width: 1000px;
  height: 100%;
  min-height: 100%;
}

.sider {
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  overflow: hidden;
}

.logo {
  min-height: 32px;
  margin: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-primary);
  font-weight: 700;
  font-size: 18px;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--color-border-secondary);
  padding-bottom: 16px;
}

.logo__img {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  object-fit: contain;
  display: block;
}

.logo__text {
  white-space: nowrap;
}

.header {
  background: var(--color-bg-container);
  padding: 0 var(--spacing-lg);
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: none;
  border-bottom: 1px solid var(--color-border-secondary);
  position: sticky;
  top: 0;
  z-index: 99;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.header-right {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

/* 右侧图标与下拉：整体与图标均垂直居中 */
.header-right .user-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  padding: 0 12px;
  height: 36px;
  cursor: pointer;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
  margin-left: 8px;
}

.header-right .user-avatar {
  flex-shrink: 0;
  margin-right: 8px;
}

.header-right .user-dropdown-trigger:hover {
  background-color: rgba(0, 0, 0, 0.03);
}

.dark .header-right .user-dropdown-trigger:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.header-right .user-name {
  font-size: 13px;
  font-weight: 600;
  color: #475569; /* slate-600 */
  letter-spacing: 0.01em;
  transition: color 0.2s;
}

.dark .header-right .user-name {
  color: #94a3b8;
}

.header-right .user-dropdown-trigger:hover .user-name {
  color: var(--color-primary);
}

.header-right .arrow-icon {
  font-size: 11px;
  color: #94a3b8;
  margin-left: 6px;
  transition: all 0.3s ease;
}

.header-right .user-dropdown-trigger:hover .arrow-icon {
  color: var(--color-primary);
}

.trigger {
  font-size: 18px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: var(--color-primary);
}

/* 右侧主区域：flex 列布局，占满剩余高度；主内容在 .content 内纵向滚动（body 为 overflow:hidden） */
.main-right-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.content {
  margin: var(--spacing-lg) var(--spacing-md);
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: var(--radius-base);
  overflow-y: auto;
  overflow-x: hidden;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

<style>
/* 用户菜单：关闭「与触发器等宽」后，由内容决定宽度；略设 max-width 防溢出 */
.user-menu-overlay.ant-dropdown {
  width: max-content;
  max-width: min(100vw - var(--spacing-xl), 20rem);
}

.user-menu-overlay .ant-dropdown-menu {
  width: max-content;
  min-width: unset;
}

.user-menu-overlay .ant-dropdown-menu-item {
  .user-menu-item-text {
    white-space: nowrap;
    margin-left: var(--spacing-xs);
  }
}
</style>
