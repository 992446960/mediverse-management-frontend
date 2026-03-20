<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { getAvatars } from '@/api/avatars'
import AvatarTestPage from '@/components/AvatarTestPage/index.vue'
import { Spin, Empty, Button } from 'ant-design-vue'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const avatarId = ref<string>('')
const avatarName = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  if (!user.value?.id) {
    loading.value = false
    return
  }

  try {
    // Fetch expert avatar for current user
    const res = await getAvatars({
      page: 1,
      page_size: 100,
      type: 'expert',
    })

    // Filter by user_id in case the API returns all experts (though in real backend it might filter by context)
    // Ideally backend should filter, but let's be safe.
    const myAvatar = res.items.find((a) => a.user_id === user.value?.id)
    if (myAvatar) {
      avatarId.value = myAvatar.id
      avatarName.value = myAvatar.name
    }
  } catch (error) {
    console.error('Failed to fetch avatar', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="h-full">
    <Spin :spinning="loading" wrapper-class-name="h-full">
      <AvatarTestPage v-if="avatarId" :avatar-id="avatarId" :avatar-name="avatarName" />
      <div v-else-if="!loading" class="h-full flex flex-col items-center justify-center">
        <Empty
          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          :image-style="{ height: '60px' }"
          description="未找到您的专家分身"
        >
          <template #footer>
            <Button type="primary" @click="$router.push('/my/avatar')">去配置分身</Button>
          </template>
        </Empty>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
:deep(.ant-spin-container) {
  height: 100%;
}
</style>
