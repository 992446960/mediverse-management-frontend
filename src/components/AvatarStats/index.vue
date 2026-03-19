<template>
  <div class="avatar-stats">
    <div class="stats-card">
      <h3 class="stats-title">{{ t('avatar.wizard.stats.title') }}</h3>

      <a-spin :spinning="loading">
        <div class="stats-list space-y-6">
          <div v-for="item in statItems" :key="item.key" class="stat-item">
            <div class="flex items-center justify-between mb-1">
              <span class="stat-label">{{ t(item.labelKey) }}</span>
              <component :is="item.icon" class="stat-icon" :style="{ color: item.color }" />
            </div>
            <div class="stat-value" :style="{ color: item.color }">
              {{ formatValue(statsData[item.key as keyof AvatarStatsData]) }}
            </div>
          </div>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import {
  MessageOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  GlobalOutlined,
  BookOutlined,
} from '@ant-design/icons-vue'
import type { OwnerType } from '@/constants/avatar'
import type { AvatarStatsData } from '@/types/avatarConfig'
import { getAvatarStats } from '@/api/avatarStats'

const props = defineProps<{
  ownerType: OwnerType
  ownerId: string
}>()

const { t } = useI18n()
const loading = ref(false)
const statsData = ref<AvatarStatsData>({
  totalSessions: 0,
  todaySessions: 0,
  todayTokensUsed: 0,
  totalTokensUsed: 0,
  totalReferences: 0,
})

const statItems = [
  {
    key: 'totalSessions',
    labelKey: 'avatar.wizard.stats.totalSessions',
    icon: MessageOutlined,
    color: '#1890ff',
  },
  {
    key: 'todaySessions',
    labelKey: 'avatar.wizard.stats.todaySessions',
    icon: TeamOutlined,
    color: '#722ed1',
  },
  {
    key: 'todayTokensUsed',
    labelKey: 'avatar.wizard.stats.todayTokensUsed',
    icon: ThunderboltOutlined,
    color: '#fa8c16',
  },
  {
    key: 'totalTokensUsed',
    labelKey: 'avatar.wizard.stats.totalTokensUsed',
    icon: GlobalOutlined,
    color: '#52c41a',
  },
  {
    key: 'totalReferences',
    labelKey: 'avatar.wizard.stats.totalReferences',
    icon: BookOutlined,
    color: '#f5222d',
  },
]

const formatValue = (val: number | undefined | null) => {
  const n = Number(val)
  if (Number.isNaN(n)) return '0'
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n.toLocaleString()
}

const fetchStats = async () => {
  if (!props.ownerId) return
  loading.value = true
  try {
    const res = await getAvatarStats(props.ownerType, props.ownerId)
    statsData.value = res
  } catch (err) {
    console.error('Failed to fetch avatar stats:', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.ownerId, fetchStats)
onMounted(fetchStats)
</script>

<style scoped>
@reference "../../styles/index.css";

.stats-card {
  @apply p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700;
}

.stats-title {
  @apply text-base font-bold mb-6 text-gray-800 dark:text-gray-200;
}

.stat-label {
  @apply text-xs text-gray-400 dark:text-gray-500;
}

.stat-icon {
  @apply text-lg opacity-80;
}

.stat-value {
  @apply text-2xl font-bold font-mono;
}

.stat-item {
  @apply pb-4 border-b border-gray-50 dark:border-gray-700 last:border-0 last:pb-0;
}
</style>
