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
      <div class="logo" :class="{ 'logo--collapsed': collapsed }">
        <div class="logo__inner">
          <img class="logo__img" :src="logoUrl" :alt="brandName" width="28" height="28" />
          <div v-if="!collapsed" class="logo__text-wrap">
            <a-tooltip
              placement="right"
              :mouse-enter-delay="0.2"
              :get-popup-container="getTooltipContainer"
            >
              <template #title>{{ brandName }}</template>
              <div class="logo__text" :title="brandName" :aria-label="brandName">
                <span class="logo__title">{{ brandNameParts.title }}</span>
                <span class="logo__subtitle">{{ brandNameParts.subtitle }}</span>
              </div>
            </a-tooltip>
          </div>
        </div>
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
const brandName = computed(() => t('app.brandName'))
const brandNameParts = computed(() => {
  const [title, ...rest] = brandName.value.split(/\s+/)
  return {
    title: title || brandName.value,
    subtitle: rest.join(' '),
  }
})

function getTooltipContainer(triggerNode: HTMLElement) {
  return triggerNode?.ownerDocument?.body ?? document.body
}

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
    const activeMenu = currentRoute.meta.activeMenu
    if (typeof activeMenu === 'string' && activeMenu !== '') {
      selectedKeys.value = [activeMenu]
      return
    }

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

<style scoped lang="scss">
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

.sider :deep(.ant-menu),
.sider :deep(.ant-menu-sub),
.sider :deep(.ant-menu-inline) {
  background: var(--color-bg-sidebar) !important;
}

.logo {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 78px;
  margin: 0;
  padding: 18px 18px 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  overflow: hidden;
  color: var(--color-text-inverse);
  font-weight: 700;
  border-bottom: 1px solid var(--color-border-secondary);
}

.logo--collapsed {
  padding-left: 0;
  padding-right: 0;
  justify-content: center;
}

.logo__inner {
  display: flex;
  align-items: center;
  gap: 10px;
  width: max-content;
  max-width: 100%;
  min-width: 0;
}

.logo__img {
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  min-width: 34px;
  min-height: 34px;
  object-fit: contain;
  display: block;
}

.logo__text-wrap {
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
}

.logo__text-wrap :deep(.ant-tooltip-disabled-compatible-wrapper) {
  display: block;
  width: 100%;
  min-width: 0;
}

.logo__text {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  cursor: default;
  line-height: 1.05;
}

.logo__title,
.logo__subtitle {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.logo__title {
  color: var(--color-text-inverse);
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 0;
}

.logo__subtitle {
  margin-top: 3px;
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0;
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
</style>
