<template>
  <div class="knowledge-recall-test flex flex-1 flex-col overflow-hidden">
    <div class="app-container p-4 mb-4">
      <PageHead :head-conf="headConf" />
    </div>

    <div class="app-container p-4 mb-4">
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-4">
        <section class="min-w-0">
          <div class="mb-2 text-sm font-medium text-(--color-text-base)">
            {{ t('knowledge.recall.queryLabel') }}
          </div>
          <a-textarea
            v-model:value="query"
            :placeholder="t('knowledge.recall.queryPlaceholder')"
            :auto-size="{ minRows: 7, maxRows: 10 }"
            :maxlength="2000"
            :disabled="loading"
            show-count
          />
        </section>

        <section class="min-w-0">
          <div class="mb-4">
            <div class="mb-2 text-sm font-medium text-(--color-text-base)">
              {{ t('knowledge.recall.cardTypeLabel') }}
            </div>
            <a-select
              v-model:value="selectedCardTypes"
              mode="multiple"
              allow-clear
              :placeholder="t('knowledge.recall.allTypes')"
              :options="cardTypeOptions"
              :loading="cardTypesLoading"
              :disabled="loading"
            />
          </div>

          <div>
            <div class="mb-2 flex items-center justify-between gap-2">
              <span class="text-sm font-medium text-(--color-text-base)">
                {{ t('knowledge.recall.topKLabel') }}
              </span>
              <a-input-number
                v-model:value="topK"
                :min="1"
                :max="20"
                :precision="0"
                :disabled="loading"
              />
            </div>
            <a-slider v-model:value="topK" :min="1" :max="20" :disabled="loading" />
          </div>

          <a-button
            type="primary"
            block
            class="mt-4"
            :loading="loading"
            :disabled="!canSubmit"
            @click="handleRecall"
          >
            <template #icon>
              <SearchOutlined />
            </template>
            {{ t('knowledge.recall.execute') }}
          </a-button>
        </section>
      </div>
    </div>

    <div class="app-container p-4 flex-1 overflow-y-auto min-h-0">
      <a-spin :spinning="loading" :tip="t('knowledge.recall.loading')">
        <a-empty v-if="!result && !loading" :description="t('knowledge.recall.emptyResult')" />

        <div v-else-if="result" class="space-y-4">
          <section
            class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
                {{ t('knowledge.recall.finalAnswer') }}
              </h2>
              <div class="flex flex-wrap gap-2 text-xs text-(--color-text-tertiary)">
                <a-tag v-if="queryTimeText">{{ queryTimeText }}</a-tag>
                <a-tag v-if="confidenceText">{{ confidenceText }}</a-tag>
              </div>
            </div>
            <div class="whitespace-pre-wrap text-sm leading-6 text-(--color-text-base)">
              {{ result.answer || t('knowledge.recall.noAnswer') }}
            </div>
          </section>

          <section
            class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h2 class="m-0 text-base font-semibold text-(--color-text-base)">
                {{ t('knowledge.recall.retrievedSources') }}
              </h2>
              <span class="text-sm text-(--color-text-secondary)">
                {{ t('knowledge.recall.sourceCount', { count: sourceCount }) }}
              </span>
            </div>

            <a-empty
              v-if="result.sources.length === 0"
              :description="t('knowledge.recall.noSources')"
            />
            <div v-else class="space-y-3">
              <article
                v-for="source in result.sources"
                :key="source.id"
                class="rounded-md border border-slate-200 p-3 dark:border-slate-800"
              >
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <a-tag color="blue">{{ formatScore(source.relevance_score) }}</a-tag>
                  <span class="font-medium text-(--color-text-base)">{{ source.title }}</span>
                  <a-tag :color="getCardTypeConfig(source.card_type).color">
                    {{ getCardTypeConfig(source.card_type).label }}
                  </a-tag>
                </div>
                <p class="m-0 text-sm leading-6 text-(--color-text-secondary)">
                  {{ source.excerpt }}
                </p>
              </article>
            </div>
          </section>
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import PageHead from '@/components/PageHead/index.vue'
import type { PageHeadConfig } from '@/components/PageHead/types'
import { getCardTypes } from '@/api/knowledge'
import { recallKnowledgeCards } from '@/api/knowledgeRecall'
import type { CardType, CardTypeOption } from '@/types/knowledge'
import { getCardTypeConfig } from '@/types/knowledge'
import type { KnowledgeRecallOwnerType, KnowledgeRecallResult } from '@/types/knowledgeRecall'

const props = defineProps<{
  ownerType: KnowledgeRecallOwnerType
  ownerId: string
}>()

const { t } = useI18n()

const query = ref('')
const topK = ref(5)
const selectedCardTypes = ref<CardType[]>([])
const cardTypes = ref<CardTypeOption[]>([])
const cardTypesLoading = ref(false)
const loading = ref(false)
const result = ref<KnowledgeRecallResult | null>(null)

const headConf = computed<PageHeadConfig>(() => ({
  title: t('knowledge.recall.title'),
  backLeft: true,
}))

const cardTypeOptions = computed(() =>
  cardTypes.value.map((item) => ({
    label: item.name,
    value: item.code,
  }))
)

const normalizedTopK = computed(() => Math.min(20, Math.max(1, Number(topK.value) || 5)))
const canSubmit = computed(() => query.value.trim().length > 0 && props.ownerId !== '')
const sourceCount = computed(() => result.value?.count ?? result.value?.sources.length ?? 0)
const queryTimeText = computed(() => {
  const value = result.value?.query_time_ms
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.queryTime', { time: `${Math.round(value)}ms` })
})
const confidenceText = computed(() => {
  const value = result.value?.confidence
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.confidence', { value: `${Math.round(value * 100)}%` })
})

async function fetchCardTypes() {
  cardTypesLoading.value = true
  try {
    cardTypes.value = await getCardTypes()
  } catch (err) {
    console.error('Fetch card types failed:', err)
  } finally {
    cardTypesLoading.value = false
  }
}

async function handleRecall() {
  const text = query.value.trim()
  if (!text) {
    message.warning(t('knowledge.recall.queryRequired'))
    return
  }
  if (!props.ownerId) {
    message.warning(t('knowledge.recall.ownerMissing'))
    return
  }

  loading.value = true
  result.value = null
  try {
    result.value = await recallKnowledgeCards(props.ownerType, props.ownerId, {
      query: text,
      topK: normalizedTopK.value,
      cardTypes: selectedCardTypes.value,
    })
  } catch (err) {
    console.error('Knowledge recall failed:', err)
  } finally {
    loading.value = false
  }
}

function formatScore(score: number) {
  if (!Number.isFinite(score)) return '-'
  return score.toFixed(2)
}

onMounted(fetchCardTypes)
</script>
