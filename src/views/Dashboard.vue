<template>
  <div class="dashboard">
    <div class="app-container p-6 mb-6">
      <h1 class="dashboard__title">{{ t('menu.dashboard') }}</h1>
    </div>

    <a-alert
      v-if="!hasAnyAvatar"
      type="info"
      show-icon
      class="dashboard__alert"
      :message="t('dashboard.noAvatarData')"
    />

    <a-spin :spinning="loading">
      <a-row :gutter="[16, 16]" class="dashboard__stats">
        <a-col v-for="item in statCardItems" :key="item.key" :xs="24" :sm="12" :lg="6">
          <StatCard
            :title="item.title"
            :value="item.value"
            :icon="item.icon"
            :icon-color="item.iconColor"
            :value-color="item.valueColor"
            :loading="loading && hasAnyAvatar"
          />
        </a-col>
      </a-row>

      <a-row
        v-if="hasAnyAvatar && branches.length > 1"
        :gutter="[16, 16]"
        class="dashboard__section"
      >
        <a-col :span="24">
          <a-card :title="t('dashboard.tokenBreakdown')" :bordered="false">
            <a-descriptions :column="1" size="small" bordered>
              <a-descriptions-item
                v-for="b in branches"
                :key="`${b.ownerType}-${b.ownerId}`"
                :label="t(`dashboard.owner.${b.ownerType}`)"
              >
                <span class="dashboard__token-line">
                  <span class="dashboard__token-label">{{ t('dashboard.todayToken') }}</span>
                  {{ b.data.todayTokenDisplay }}
                </span>
                <span class="dashboard__token-line">
                  <span class="dashboard__token-label">{{ t('dashboard.totalToken') }}</span>
                  {{ b.data.allTokenDisplay }}
                </span>
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>

      <a-row v-if="hasAnyAvatar" :gutter="[16, 16]" class="dashboard__section">
        <a-col :span="24">
          <a-card :title="t('dashboard.knowledgeProgress')" :bordered="false">
            <p v-if="aggregatedKnowledge.total === 0" class="dashboard__muted">
              {{ t('dashboard.knowledgeProgressEmpty') }}
            </p>
            <template v-else>
              <p class="dashboard__progress-meta">
                {{
                  t('avatar.wizard.stats.knowledgeProgressFiles', {
                    indexed: aggregatedKnowledge.indexed,
                    total: aggregatedKnowledge.total,
                  })
                }}
              </p>
              <a-progress
                :percent="aggregatedKnowledge.percentage"
                :stroke-color="'var(--color-primary)'"
              />
            </template>
          </a-card>
        </a-col>
      </a-row>

      <a-row :gutter="[16, 16]" class="dashboard__section">
        <a-col :span="24">
          <a-card :title="t('dashboard.recentActivity')" :bordered="false">
            <a-empty :description="t('dashboard.emptyActivity')" />
          </a-card>
        </a-col>
      </a-row>
    </a-spin>
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
import type { Component } from 'vue'
import StatCard from '@/components/StatCard/index.vue'
import { useDashboardAvatarStats } from '@/composables/useDashboardAvatarStats'

const { t } = useI18n()

const {
  loading,
  branches,
  hasAnyAvatar,
  aggregatedSessions,
  aggregatedKnowledge,
  singleBranch,
  load,
} = useDashboardAvatarStats()

interface StatCardItem {
  key: string
  title: string
  value: string | number
  icon: Component
  iconColor: string
  valueColor: string
}

const statCardItems = computed((): StatCardItem[] => {
  const zeroCards: StatCardItem[] = [
    {
      key: 'totalSessions',
      title: t('avatar.wizard.stats.totalSessions'),
      value: 0,
      icon: MessageOutlined,
      iconColor: 'var(--color-info)',
      valueColor: 'var(--color-text-base)',
    },
    {
      key: 'todaySessions',
      title: t('avatar.wizard.stats.todaySessions'),
      value: 0,
      icon: TeamOutlined,
      iconColor: 'var(--color-primary)',
      valueColor: 'var(--color-text-base)',
    },
    {
      key: 'totalToken',
      title: t('avatar.wizard.stats.totalTokensUsed'),
      value: '0',
      icon: GlobalOutlined,
      iconColor: 'var(--color-success)',
      valueColor: 'var(--color-text-base)',
    },
    {
      key: 'todayToken',
      title: t('avatar.wizard.stats.todayTokensUsed'),
      value: '0',
      icon: ThunderboltOutlined,
      iconColor: 'var(--color-warning)',
      valueColor: 'var(--color-text-base)',
    },
  ]

  /** 无分身、加载中、或请求失败清空后：均为占位 0，避免误判多路聚合 */
  if (!hasAnyAvatar.value || branches.value.length === 0) {
    return zeroCards
  }

  const one = singleBranch.value
  if (one) {
    const d = one.data
    return [
      {
        key: 'totalSessions',
        title: t('avatar.wizard.stats.totalSessions'),
        value: d.totalSessions,
        icon: MessageOutlined,
        iconColor: 'var(--color-info)',
        valueColor: 'var(--color-info)',
      },
      {
        key: 'todaySessions',
        title: t('avatar.wizard.stats.todaySessions'),
        value: d.todaySessions,
        icon: TeamOutlined,
        iconColor: 'var(--color-primary)',
        valueColor: 'var(--color-primary)',
      },
      {
        key: 'totalToken',
        title: t('avatar.wizard.stats.totalTokensUsed'),
        value: d.allTokenDisplay,
        icon: GlobalOutlined,
        iconColor: 'var(--color-success)',
        valueColor: 'var(--color-text-base)',
      },
      {
        key: 'todayToken',
        title: t('avatar.wizard.stats.todayTokensUsed'),
        value: d.todayTokenDisplay,
        icon: ThunderboltOutlined,
        iconColor: 'var(--color-warning)',
        valueColor: 'var(--color-text-base)',
      },
    ]
  }

  const ag = aggregatedSessions.value
  const k = aggregatedKnowledge.value
  return [
    {
      key: 'totalSessions',
      title: t('avatar.wizard.stats.totalSessions'),
      value: ag.total,
      icon: MessageOutlined,
      iconColor: 'var(--color-info)',
      valueColor: 'var(--color-info)',
    },
    {
      key: 'todaySessions',
      title: t('avatar.wizard.stats.todaySessions'),
      value: ag.today,
      icon: TeamOutlined,
      iconColor: 'var(--color-primary)',
      valueColor: 'var(--color-primary)',
    },
    {
      key: 'knowledgeFiles',
      title: t('dashboard.knowledgeFilesIndexed'),
      value: t('dashboard.knowledgeFilesRatio', { indexed: k.indexed, total: k.total }),
      icon: BookOutlined,
      iconColor: 'var(--color-warning)',
      valueColor: 'var(--color-text-base)',
    },
    {
      key: 'knowledgePct',
      title: t('dashboard.knowledgeProgressPercent'),
      value: t('dashboard.percentValue', { n: k.percentage }),
      icon: BookOutlined,
      iconColor: 'var(--color-success)',
      valueColor: 'var(--color-text-base)',
    },
  ]
})

onMounted(() => {
  load()
})
</script>

<style scoped lang="scss">
.dashboard__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-base);
}

.dashboard__alert {
  margin-bottom: var(--spacing-lg);
}

.dashboard__stats {
  margin-bottom: var(--spacing-md);
}

.dashboard__section {
  margin-top: var(--spacing-md);
}

.dashboard__muted {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.dashboard__progress-meta {
  margin: 0 0 var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.dashboard__token-line {
  display: block;
  margin-bottom: var(--spacing-xs);

  &:last-child {
    margin-bottom: 0;
  }
}

.dashboard__token-label {
  margin-right: var(--spacing-sm);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>
