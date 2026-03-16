<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { getAvatars } from '@/api/avatars'
import AvatarTestPage from '@/components/AvatarTestPage/index.vue'
import { Spin, Empty, Button } from 'ant-design-vue'

const authStore = useAuthStore()
const { currentDeptId } = storeToRefs(authStore)
const avatarId = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  if (!currentDeptId.value) {
    loading.value = false
    return
  }

  try {
    const res = await getAvatars({
      page: 1,
      page_size: 1,
      type: 'specialist',
      dept_id: currentDeptId.value,
    })

    if (res.items.length > 0) {
      avatarId.value = res.items[0].id
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
      <AvatarTestPage v-if="avatarId" :avatar-id="avatarId" />
      <div v-else-if="!loading" class="h-full flex flex-col items-center justify-center">
        <Empty
          image="https://gw.alipayobjects.com/zos/antfincdn/ZHrcdLPrvN/empty.svg"
          :image-style="{ height: '60px' }"
          description="未找到本科室的专科分身"
        >
          <template #footer>
            <Button type="primary" @click="$router.push('/dept/avatar')">去配置分身</Button>
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
