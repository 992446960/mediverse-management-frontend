<template>
  <div
    class="knowledge-recall-test__results relative rounded-md bg-white p-5 dark:bg-[--color-bg-container]"
    :class="{ 'knowledge-recall-test__results--placeholder': !result }"
  >
    <div
      v-if="loading"
      class="absolute inset-0 z-10 flex items-center justify-center rounded-md bg-white/80 dark:bg-[--color-bg-container]/80"
      role="status"
      :aria-label="t('knowledge.recall.loading')"
    >
      <a-spin :spinning="true" :tip="t('knowledge.recall.loading')">
        <div class="min-h-[120px] min-w-[160px]" aria-hidden="true" />
      </a-spin>
    </div>

    <div v-if="!result && !loading" class="flex items-center justify-center">
      <a-empty :description="t('knowledge.recall.emptyResult')" />
    </div>

    <div v-else-if="result" class="space-y-4">
      <section
        class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 class="m-0 flex items-center gap-2 text-base font-semibold text-(--color-text-base)">
            <MessageOutlined class="text-primary" />
            {{ t('knowledge.recall.finalAnswer') }}
          </h2>
          <div class="flex flex-wrap gap-2 text-xs text-(--color-text-tertiary)">
            <a-tag v-if="queryTimeText">{{ queryTimeText }}</a-tag>
            <a-tag v-if="confidenceText">{{ confidenceText }}</a-tag>
          </div>
        </div>
        <div
          class="knowledge-recall-test__answer-body markdown-body prose prose-sm max-w-none dark:prose-invert"
        >
          <!-- eslint-disable-next-line vue/no-v-html -- 召回 answer 为 Markdown 文本，已通过 marked + DOMPurify 清洗 -->
          <div v-if="hasFinalAnswer" v-html="finalAnswerHtml" />
          <span v-else>{{ t('knowledge.recall.noAnswer') }}</span>
        </div>
      </section>

      <section
        class="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 class="m-0 flex items-center gap-2 text-base font-semibold text-(--color-text-base)">
            <FileTextOutlined class="text-primary" />
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
        <div v-else class="knowledge-recall-test__sources-list space-y-3">
          <article
            v-for="source in result.sources"
            :key="source.id"
            class="cursor-pointer rounded-md border border-slate-200 p-3 transition-colors hover:border-primary hover:bg-(--ant-color-fill-tertiary) dark:border-slate-800"
            role="button"
            tabindex="0"
            :aria-label="`${t('knowledge.recall.viewCardDetail')}: ${source.title}`"
            @click="emit('open-source-detail', source)"
            @keydown.enter.prevent="emit('open-source-detail', source)"
          >
            <div class="mb-2 flex flex-wrap items-center gap-2">
              <a-tag color="blue">{{ formatScore(source.score) }}</a-tag>
              <span
                class="inline-flex min-w-0 items-center gap-1.5 font-medium text-(--color-text-base)"
              >
                <FileTextOutlined class="shrink-0 text-primary" />
                <span class="truncate">{{ source.title }}</span>
              </span>
              <a-tag :color="getLocalizedCardTypeConfig(source.cardType).color">
                {{ getLocalizedCardTypeConfig(source.cardType).label }}
              </a-tag>
            </div>
            <p class="m-0 text-sm leading-6 text-(--color-text-secondary)">
              {{ source.excerpt }}
            </p>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FileTextOutlined, MessageOutlined } from '@ant-design/icons-vue'
import { useI18n } from 'vue-i18n'
import type { KnowledgeRecallViewModel, KnowledgeRecallViewSource } from '@/types/knowledgeRecall'
import { getCardTypeConfig } from '@/types/knowledge'
import { formatRecallConfidence } from '@/utils/knowledgeRecall'
import { renderMarkdownSafe } from '@/utils/renderMarkdownSafe'

const props = defineProps<{
  result: KnowledgeRecallViewModel | null
  loading: boolean
}>()

const emit = defineEmits<{
  'open-source-detail': [source: KnowledgeRecallViewSource]
}>()

const { t } = useI18n()
const getLocalizedCardTypeConfig = (type: string) => getCardTypeConfig(type, (key) => t(key))

const sourceCount = computed(() => props.result?.count ?? props.result?.sources.length ?? 0)
const hasFinalAnswer = computed(() => (props.result?.answer ?? '').trim() !== '')
const finalAnswerHtml = computed(() => renderMarkdownSafe(props.result?.answer))
const queryTimeText = computed(() => {
  const value = props.result?.queryTimeMs
  if (typeof value !== 'number' || !Number.isFinite(value)) return ''
  return t('knowledge.recall.queryTime', { time: `${Math.round(value)}ms` })
})
const confidenceText = computed(() => {
  const text = formatRecallConfidence(props.result?.confidence)
  return text === '-' ? '' : t('knowledge.recall.confidence', { value: text })
})

function formatScore(score: number | null) {
  if (typeof score !== 'number' || !Number.isFinite(score)) return '-'
  return score.toFixed(2)
}
</script>

<style scoped lang="scss">
.knowledge-recall-test__answer-body {
  max-height: min(420px, calc(100vh - 360px));
  overflow-y: auto;
  overflow-wrap: break-word;
  color: var(--color-text-base);
  line-height: 1.7;
}

.knowledge-recall-test__answer-body :deep(p:last-child),
.knowledge-recall-test__answer-body :deep(ul:last-child),
.knowledge-recall-test__answer-body :deep(ol:last-child) {
  margin-bottom: 0;
}

.knowledge-recall-test__answer-body :deep(pre) {
  overflow: auto;
}

.knowledge-recall-test__sources-list {
  max-height: min(520px, calc(100vh - 360px));
  overflow-y: auto;
  padding-right: 0.25rem;
  scrollbar-gutter: stable;
}

.knowledge-recall-test__results--placeholder {
  min-height: 240px;
}
</style>
