<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Card, Avatar, Tag, Select, Input, Spin, Empty } from 'ant-design-vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { getAvatars } from '@/api/avatars'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import type { Avatar as AvatarType } from '@/types/avatar'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'

const emit = defineEmits<{
  (e: 'select', avatar: AvatarType): void
}>()

const loading = ref(false)
const avatars = ref<AvatarType[]>([])
const organizations = ref<Organization[]>([])
const departments = ref<Department[]>([])

const filters = ref({
  org_id: undefined as string | undefined,
  dept_id: undefined as string | undefined,
  keyword: '',
})

const loadOrganizations = async () => {
  const res = await getOrganizations({ page: 1, page_size: 100 })
  organizations.value = res.items
}

const loadDepartments = async (orgId: string) => {
  const res = await getDepartments({ org_id: orgId, page: 1, page_size: 100 })
  departments.value = res.items
}

const loadAvatars = async () => {
  loading.value = true
  try {
    const res = await getAvatars({
      page: 1,
      page_size: 20,
      org_id: filters.value.org_id,
      dept_id: filters.value.dept_id,
      keyword: filters.value.keyword,
    })
    avatars.value = res.items
  } finally {
    loading.value = false
  }
}

watch(
  () => filters.value.org_id,
  (newVal) => {
    filters.value.dept_id = undefined
    departments.value = []
    if (newVal) {
      loadDepartments(newVal)
    }
    loadAvatars()
  }
)

watch(
  () => filters.value.dept_id,
  () => {
    loadAvatars()
  }
)

const handleSearch = () => {
  loadAvatars()
}

onMounted(() => {
  loadOrganizations()
  loadAvatars()
})
</script>

<template>
  <div class="avatar-selector p-6">
    <div class="mb-6 flex gap-4 flex-wrap">
      <Select
        v-model:value="filters.org_id"
        placeholder="选择机构"
        style="width: 200px"
        allow-clear
      >
        <Select.Option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </Select.Option>
      </Select>

      <Select
        v-model:value="filters.dept_id"
        placeholder="选择科室"
        style="width: 200px"
        allow-clear
        :disabled="!filters.org_id"
      >
        <Select.Option v-for="dept in departments" :key="dept.id" :value="dept.id">
          {{ dept.name }}
        </Select.Option>
      </Select>

      <Input.Search
        v-model:value="filters.keyword"
        placeholder="搜索分身名称"
        style="width: 240px"
        @search="handleSearch"
      />
    </div>

    <Spin :spinning="loading">
      <div v-if="avatars.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card
          v-for="avatar in avatars"
          :key="avatar.id"
          hoverable
          class="cursor-pointer transition-transform hover:-translate-y-1 overflow-hidden"
          @click="emit('select', avatar)"
        >
          <Card.Meta :title="avatar.name" :description="avatar.bio || '暂无简介'">
            <template #avatar>
              <Avatar :src="avatar.avatar_url || undefined" :size="48">
                <template #icon><UserOutlined /></template>
              </Avatar>
            </template>
          </Card.Meta>
          <div class="mt-4 flex gap-2 flex-wrap">
            <Tag color="blue">{{ avatar.type.charAt(0).toUpperCase() + avatar.type.slice(1) }}</Tag>
            <Tag v-if="avatar.org_name">{{ avatar.org_name }}</Tag>
            <Tag v-if="avatar.dept_name">{{ avatar.dept_name }}</Tag>
          </div>
        </Card>
      </div>
      <Empty v-else description="暂无分身" />
    </Spin>
  </div>
</template>
