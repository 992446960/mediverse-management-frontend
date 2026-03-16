<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getAvatars } from '@/api/avatars'
import AvatarTestPage from '@/components/AvatarTestPage/index.vue'
import { Spin, Empty } from 'ant-design-vue'

const authStore = useAuthStore()
const avatarId = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  if (!authStore.user?.dept_id) {
    loading.value = false
    return
  }

  try {
    const res = await getAvatars({
      page: 1,
      page_size: 1,
      type: 'specialist', // Assuming 'specialist' maps to 'dept' type or I should check the enum
      dept_id: authStore.user.dept_id,
    })

    // Check AVATAR_TYPE_VALUES in src/types/avatar.ts
    // 'general', 'specialist', 'expert'
    // 'specialist' -> dept

    if (res.items.length > 0) {
      avatarId.value = res.items[0].id
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-full">
    <Spin :spinning="loading" class="h-full">
      <AvatarTestPage v-if="avatarId" :avatar-id="avatarId" />
      <div v-else-if="!loading" class="h-full flex items-center justify-center">
        <Empty description="未找到本科室的专科分身" />
      </div>
    </Spin>
  </div>
</template>
