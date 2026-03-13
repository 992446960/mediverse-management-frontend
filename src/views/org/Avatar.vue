<template>
  <div>
    <div class="app-container p-6 mb-6">
      <h1 class="text-xl font-bold text-gray-900 dark:text-gray-100 m-0">
        {{ t('avatar.wizard.' + AVATAR_PAGE_TITLE.org) }}
      </h1>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- 左侧配置表单 -->
      <div class="flex-1 app-container p-6">
        <AvatarConfig owner-type="org" :owner-id="currentOrgId || undefined" />
      </div>

      <!-- 右侧统计与指引 -->
      <div class="w-full lg:w-80 space-y-6">
        <div class="app-container p-0 overflow-hidden">
          <AvatarStats v-if="currentOrgId" owner-type="org" :owner-id="currentOrgId" />
        </div>
        <div class="app-container p-0 overflow-hidden">
          <QuickActionGuide owner-type="org" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { AVATAR_PAGE_TITLE } from '@/constants/avatar'
import AvatarConfig from '@/components/AvatarConfig/index.vue'
import AvatarStats from '@/components/AvatarStats/index.vue'
import QuickActionGuide from '@/components/AvatarConfig/QuickActionGuide.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const { currentOrgId } = storeToRefs(authStore)
</script>
