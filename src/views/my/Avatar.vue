<template>
  <div>
    <div class="app-container p-6 mb-6">
      <h1 class="text-xl font-bold m-0">
        {{ t('avatar.wizard.' + AVATAR_PAGE_TITLE.personal) }}
      </h1>
    </div>

    <div class="flex flex-col lg:flex-row gap-6">
      <!-- 左侧配置表单 -->
      <div class="flex-1 app-container p-6">
        <AvatarConfig owner-type="personal" :owner-id="user?.id" />
      </div>

      <!-- 右侧统计与指引 -->
      <div class="w-full lg:w-80 space-y-6">
        <div class="app-container p-0 overflow-hidden">
          <AvatarStats v-if="user?.id" owner-type="personal" :owner-id="user.id" />
        </div>
        <div class="app-container p-0 overflow-hidden">
          <QuickActionGuide owner-type="personal" />
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

defineOptions({ name: 'MyAvatar' })

const { t } = useI18n()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
</script>
