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
  if (!authStore.user?.id) return

  try {
    // Fetch expert avatar for current user
    const res = await getAvatars({
      page: 1,
      page_size: 100,
      type: 'expert',
    })

    const myAvatar = res.items.find((a) => a.user_id === authStore.user?.id)
    if (myAvatar) {
      avatarId.value = myAvatar.id
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
        <Empty description="未找到您的专家分身" />
      </div>
    </Spin>
  </div>
</template>
