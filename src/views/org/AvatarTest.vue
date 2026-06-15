<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'

defineOptions({ name: 'OrgAvatarTest' })
import { useAuthStore } from '@/stores/auth'
import { getAvatars } from '@/api/avatars'
import AvatarTestPage from '@/components/AvatarTestPage/index.vue'
import { Spin, Empty, Button } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const { currentOrgId } = storeToRefs(authStore)
const avatarId = ref<string>('')
const avatarName = ref<string>('')
const loading = ref(true)

onMounted(async () => {
  if (!currentOrgId.value) {
    loading.value = false
    return
  }

  try {
    const res = await getAvatars({
      page: 1,
      page_size: 1,
      type: 'general',
      org_id: currentOrgId.value,
    })

    if (res.items.length > 0) {
      const row = res.items[0]
      if (row) {
        avatarId.value = row.id
        avatarName.value = row.name
      }
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
          :description="t('avatarTest.orgEmpty')"
        >
          <template #footer>
            <Button type="primary" @click="$router.push('/org/avatar')">
              {{ t('avatarTest.configureAvatar') }}
            </Button>
          </template>
        </Empty>
      </div>
    </Spin>
  </div>
</template>

<style scoped lang="scss">
:deep(.ant-spin-container) {
  height: 100%;
}
</style>
