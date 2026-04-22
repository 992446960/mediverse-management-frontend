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
              {{ formatStatCell(item.key, statsData[item.key]) }}
            </div>
          </div>

          <div class="stat-item">
            <div class="flex items-center justify-between mb-1">
              <span class="stat-label">{{ t('avatar.wizard.stats.knowledgeProgress') }}</span>
              <BookOutlined class="stat-icon stat-icon--progress" />
            </div>
            <p class="knowledge-progress-meta">
              {{
                t('avatar.wizard.stats.knowledgeProgressFiles', {
                  indexed: statsData.knowledgeProgress.indexedFiles,
                  total: statsData.knowledgeProgress.totalFiles,
                })
              }}
              <span class="knowledge-progress-pct">
                {{ progressPercentText }}
              </span>
            </p>
            <a-progress
              :percent="progressPercent"
              :show-info="false"
              stroke-color="var(--color-primary)"
              class="knowledge-progress-bar"
            />
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
  todayTokenDisplay: '0',
  allTokenDisplay: '0',
  knowledgeProgress: { indexedFiles: 0, totalFiles: 0, percentage: 0 },
})

const statItems = [
  {
    key: 'totalSessions' as const,
    labelKey: 'avatar.wizard.stats.totalSessions',
    icon: MessageOutlined,
    color: 'var(--color-info)',
  },
  {
    key: 'todaySessions' as const,
    labelKey: 'avatar.wizard.stats.todaySessions',
    icon: TeamOutlined,
    color: 'var(--color-primary)',
  },
  {
    key: 'todayTokenDisplay' as const,
    labelKey: 'avatar.wizard.stats.todayTokensUsed',
    icon: ThunderboltOutlined,
    color: 'var(--color-warning)',
  },
  {
    key: 'allTokenDisplay' as const,
    labelKey: 'avatar.wizard.stats.totalTokensUsed',
    icon: GlobalOutlined,
    color: 'var(--color-success)',
  },
]

type StatScalarKey = (typeof statItems)[number]['key']

const formatStatCell = (key: StatScalarKey, val: AvatarStatsData[StatScalarKey]) => {
  if (key === 'todayTokenDisplay' || key === 'allTokenDisplay') {
    return val != null && String(val).trim() !== '' ? String(val) : '0'
  }
  const n = Number(val)
  if (Number.isNaN(n)) return '0'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toLocaleString()
}

const progressPercent = computed(() => {
  const p = statsData.value.knowledgeProgress.percentage
  if (typeof p !== 'number' || Number.isNaN(p)) return 0
  return Math.min(100, Math.max(0, Math.round(p)))
})

const progressPercentText = computed(() => {
  const p = statsData.value.knowledgeProgress.percentage
  if (typeof p !== 'number' || Number.isNaN(p)) return '0%'
  const rounded = Math.round(p * 10) / 10
  return `${rounded}%`
})

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

.stat-icon--progress {
  color: var(--color-primary);
}

.knowledge-progress-meta {
  @apply text-xs text-gray-500 dark:text-gray-400 mb-2;
}

.knowledge-progress-pct {
  @apply ml-2 font-mono text-gray-700 dark:text-gray-300;
}

.knowledge-progress-bar {
  @apply mb-0;
}
</style>
