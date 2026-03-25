<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Card, Avatar, Select, Input, Spin } from 'ant-design-vue'
import { UserOutlined } from '@ant-design/icons-vue'
import { getChatAvatars } from '@/api/avatars'
import type { ChatAvatar } from '@/api/avatars'
import { getOrganizations } from '@/api/organizations'
import { getDepartments } from '@/api/departments'
import type { AvatarType as Type } from '@/types/avatar'
import { AVATAR_TYPE_DISPLAY_KEYS, AVATAR_TYPE_TAG_COLORS } from '@/types/avatar'
import type { Organization } from '@/types/organization'
import type { Department } from '@/types/department'

const { t } = useI18n()
const emit = defineEmits<{
  (e: 'select', avatar: ChatAvatar): void
}>()

const getTypeLabel = (type: Type) => AVATAR_TYPE_DISPLAY_KEYS[type]
const getTypeColor = (type: Type) => AVATAR_TYPE_TAG_COLORS[type]

const loading = ref(false)
const avatars = ref<ChatAvatar[]>([])
const organizations = ref<Organization[]>([])
const departments = ref<Department[]>([])

const pagination = ref({
  current: 1,
  pageSize: 12,
  total: 0,
})

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
    const res = await getChatAvatars({
      page: pagination.value.current,
      page_size: pagination.value.pageSize,
      org_id: filters.value.org_id,
      dept_id: filters.value.dept_id,
      keyword: filters.value.keyword,
    })
    avatars.value = res.items
    pagination.value.total = res.total
  } finally {
    loading.value = false
  }
}

const onPageChange = (page: number, pageSize: number) => {
  pagination.value.current = page
  pagination.value.pageSize = pageSize
  loadAvatars()
}

watch(
  () => filters.value.org_id,
  (newVal) => {
    filters.value.dept_id = undefined
    departments.value = []
    pagination.value.current = 1
    if (newVal) {
      loadDepartments(newVal)
    }
    loadAvatars()
  }
)

watch(
  () => filters.value.dept_id,
  () => {
    pagination.value.current = 1
    loadAvatars()
  }
)

const handleSearch = () => {
  pagination.value.current = 1
  loadAvatars()
}

onMounted(() => {
  loadOrganizations()
  loadAvatars()
})
</script>

<template>
  <div class="avatar-selector flex flex-col h-full">
    <div class="p-6 pb-4 flex gap-4 flex-wrap shrink-0">
      <Select
        v-model:value="filters.org_id"
        :placeholder="t('avatar.selectOrg')"
        style="width: 200px"
        allow-clear
      >
        <Select.Option v-for="org in organizations" :key="org.id" :value="org.id">
          {{ org.name }}
        </Select.Option>
      </Select>

      <Select
        v-model:value="filters.dept_id"
        :placeholder="t('avatar.selectDept')"
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
        :placeholder="t('avatar.searchName')"
        style="width: 240px"
        @search="handleSearch"
      />
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto">
      <Spin :spinning="loading" class="block">
        <div class="p-6 pt-0">
          <div v-if="avatars.length > 0" class="avatar-grid grid gap-4">
            <Card
              v-for="avatar in avatars"
              :key="avatar.id"
              hoverable
              class="avatar-card cursor-pointer transition-transform hover:-translate-y-0.5 overflow-hidden"
              @click="emit('select', avatar)"
            >
              <div class="flex gap-4">
                <Avatar
                  :src="avatar.avatar_url || undefined"
                  :size="80"
                  shape="circle"
                  class="avatar-card__avatar shrink-0"
                >
                  <template #icon><UserOutlined /></template>
                </Avatar>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2 flex-wrap">
                    <span
                      class="avatar-card__name text-lg font-bold text-gray-900 dark:text-gray-100"
                    >
                      {{ avatar.name }}
                    </span>
                    <a-tag :color="getTypeColor(avatar.type)" class="avatar-card__type-tag">
                      {{ t(getTypeLabel(avatar.type)) }}
                    </a-tag>
                  </div>
                  <div
                    v-if="avatar.org_name || avatar.dept_name"
                    class="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ [avatar.org_name, avatar.dept_name].filter(Boolean).join(' | ') }}
                  </div>
                  <div v-if="avatar.tags?.length" class="mt-2 flex gap-2 flex-wrap">
                    <a-tag v-for="tag in avatar.tags" :key="tag" class="avatar-card__spec-tag">
                      {{ tag }}
                    </a-tag>
                  </div>
                  <div class="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {{ avatar.bio || t('avatar.noBio') }}
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <a-empty v-else :description="t('avatar.noAvatars')" />
        </div>
      </Spin>
    </div>

    <div
      v-if="avatars.length > 0 || pagination.total > 0"
      class="avatar-selector__footer shrink-0 px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex justify-end"
    >
      <a-pagination
        v-model:current="pagination.current"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :show-size-changer="true"
        :show-quick-jumper="true"
        :page-size-options="['6', '12', '24', '48']"
        :show-total="(total: number) => t('common.totalCount', { count: total })"
        @change="onPageChange"
        @show-size-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.avatar-selector__footer {
  background: var(--color-bg-container);
}

.avatar-grid {
  grid-template-columns: repeat(auto-fit, minmax(300px, 400px));
}
.avatar-card {
  min-width: 300px;
}
.avatar-card__avatar {
  border-radius: 8px;
}
.avatar-card__type-tag {
  font-size: 12px;
  line-height: 1.4;
}
.avatar-card__spec-tag {
  font-size: 12px;
  background: var(--color-fill-quaternary, #f5f5f5);
  border: none;
  color: var(--color-text-secondary, rgba(0, 0, 0, 0.65));
}
.dark .avatar-card__spec-tag {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.65);
}
</style>
