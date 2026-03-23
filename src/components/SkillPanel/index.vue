<script setup lang="ts">
import { ref, computed, onMounted, inject, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { buildSkillExecuteArgs } from '@/utils/skillArgs'
import {
  AppstoreOutlined,
  ArrowLeftOutlined,
  SearchOutlined,
  FileTextOutlined,
  ToolOutlined,
  CheckOutlined,
} from '@ant-design/icons-vue'
import { getSkills } from '@/api/skills'
import type { Skill } from '@/types/skill'
import type { SkillCitation } from '@/types/skill'
import { CARD_TYPE_CONFIG } from '@/types/knowledge'
import type { CardType } from '@/types/knowledge'
import { useChatStore } from '@/stores/chat'
import { useSkillExecute } from '@/composables/useSkillExecute'
import BubbleRenderer from '@/components/ChatWindow/BubbleRenderer.vue'

const { t } = useI18n()
const chatStore = useChatStore()
const authStore = useAuthStore()
const { currentSession } = storeToRefs(chatStore)
const { user } = storeToRefs(authStore)

const skills = ref<Skill[]>([])
const loading = ref(false)

const selectedSkill = ref<Skill | null>(null)

const skillInputContext = inject<any>(
  'skillInputContext',
  computed(() => ({ inputText: '', fileList: [] }))
)

const {
  execute: executeSkill,
  currentText,
  thinkingProcess,
  result,
  error,
  reset: resetExecute,
} = useSkillExecute()

const fetchSkills = async () => {
  loading.value = true
  try {
    skills.value = await getSkills()
  } catch (err) {
    console.error('Failed to fetch skills', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSkills()
})

const getSkillIcon = (skillCode: string) => {
  if (skillCode.includes('search') || skillCode.includes('retrieval')) {
    return SearchOutlined
  }
  if (skillCode.includes('document') || skillCode.includes('parsing')) {
    return FileTextOutlined
  }
  return ToolOutlined
}

const getSkillIconColor = (skillCode: string) => {
  if (skillCode.includes('search') || skillCode.includes('retrieval')) {
    return 'text-blue-500'
  }
  if (skillCode.includes('document') || skillCode.includes('parsing')) {
    return 'text-orange-500'
  }
  return 'text-purple-500'
}

const handleSkillClick = async (skill: Skill) => {
  const args = buildSkillExecuteArgs({
    skill,
    inputText: skillInputContext.value.inputText,
    fileList: skillInputContext.value.fileList,
    user: user.value,
    t,
  })
  if (!args) return

  selectedSkill.value = skill
  resetExecute()
  await nextTick()

  const context = {
    session_id: currentSession.value?.id,
    avatar_id: currentSession.value?.avatar_id,
  }

  await executeSkill(skill.skill_code, args, context)
}

const goBack = () => {
  selectedSkill.value = null
  resetExecute()
}

const CARD_TYPE_CLASSES: Record<CardType, string> = {
  evidence:
    'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800',
  rule: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800',
  experience:
    'bg-green-50 text-green-600 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800',
}

const getBadgeClass = (type?: string) => {
  if (type && type in CARD_TYPE_CONFIG) {
    return CARD_TYPE_CLASSES[type as CardType]
  }
  return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
}

const CARD_TYPE_I18N_KEYS: Record<CardType, string> = {
  evidence: 'knowledge.card.typeEvidence',
  rule: 'knowledge.card.typeRule',
  experience: 'knowledge.card.typeExperience',
}

const getBadgeLabel = (citation: SkillCitation) => {
  if (citation.type && citation.type in CARD_TYPE_CONFIG) {
    return t(CARD_TYPE_I18N_KEYS[citation.type as CardType])
  }
  return citation.type?.toUpperCase() ?? ''
}
</script>

<template>
  <div
    class="skill-panel h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800"
  >
    <!-- List View -->
    <template v-if="!selectedSkill">
      <div
        class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0"
      >
        <AppstoreOutlined class="text-gray-600 dark:text-gray-300" />
        <span class="font-medium text-sm text-gray-800 dark:text-gray-200">{{
          t('chat.skillPanelTitle')
        }}</span>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <a-spin v-if="loading" class="w-full flex justify-center pt-8" />

        <div v-else-if="skills.length === 0" class="text-center text-gray-400 text-sm pt-8">
          {{ t('chat.skillNoRecords') }}
        </div>

        <div v-else class="flex flex-col gap-4">
          <div
            v-for="skill in skills"
            :key="skill.skill_code"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
            @click="handleSkillClick(skill)"
          >
            <div class="flex items-center gap-2 mb-2">
              <component
                :is="getSkillIcon(skill.skill_code)"
                :class="['text-lg', getSkillIconColor(skill.skill_code)]"
              />
              <div class="font-medium text-gray-800 dark:text-gray-200">
                {{ skill.title }}
              </div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {{ skill.description }}
            </div>
            <!-- Optional Tags (Mocked for now as they are not in API response) -->
            <div v-if="skill.skill_code === 'knowledge-retrieval'" class="flex flex-wrap gap-2">
              <span
                class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded-full"
                >高血压指南</span
              >
              <span
                class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] rounded-full"
                >糖尿病饮食</span
              >
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Execute View -->
    <template v-else>
      <div
        class="flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0"
      >
        <a-button type="text" size="small" class="mr-1" @click="goBack">
          <template #icon><ArrowLeftOutlined /></template>
        </a-button>
        <span class="font-medium text-sm text-gray-800 dark:text-gray-200">
          {{ t('chat.skillExecute') }}: {{ selectedSkill.title }}
        </span>
      </div>

      <div class="flex-1 overflow-y-auto p-4 bg-white dark:bg-gray-900">
        <!-- Thinking Process Timeline -->
        <div v-if="thinkingProcess.length > 0" class="mb-6">
          <div class="relative pl-6">
            <div
              v-for="(step, index) in thinkingProcess"
              :key="index"
              class="mb-4 last:mb-0 relative"
            >
              <!-- Timeline line (与聊天窗口一致) -->
              <div v-if="index !== thinkingProcess.length - 1" class="skill-panel-step-line"></div>

              <!-- Timeline icon (与聊天窗口 thinking-process-step-dot 颜色一致) -->
              <div class="skill-panel-step-icon">
                <span
                  class="skill-panel-step-dot"
                  :class="{ 'skill-panel-step-dot--done': step.status === 'done' }"
                >
                  <CheckOutlined v-if="step.status === 'done'" />
                  <span v-else class="skill-panel-step-dot-loading" />
                </span>
              </div>

              <div class="font-medium text-sm text-gray-800 dark:text-gray-200 mb-1">
                {{ step.title }}
              </div>
              <div
                v-if="step.description"
                class="w-fit bg-gray-50 dark:bg-gray-800 rounded-md p-2 text-xs text-gray-600 dark:text-gray-400"
              >
                {{ step.description }}
              </div>
            </div>
          </div>
        </div>

        <!-- Error -->
        <div
          v-if="error"
          class="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
        >
          {{ error }}
        </div>

        <!-- Result Divider -->
        <div v-if="result || error" class="flex items-center my-6">
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
          <span class="px-3 text-xs text-gray-400">{{ t('chat.skillExecutionResult') }}</span>
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-700"></div>
        </div>

        <!-- Result Content -->
        <div>
          <!-- Streaming Text -->
          <div v-if="currentText" class="mb-4 text-sm text-gray-700 dark:text-gray-300">
            <BubbleRenderer :content="currentText" :show-copy-button="false" />
          </div>

          <!-- Parts (Final) -->
          <div
            v-if="result && result.parts && result.parts.length > 0 && !currentText"
            class="mb-4 text-sm text-gray-700 dark:text-gray-300"
          >
            <template v-for="(part, idx) in result.parts" :key="idx">
              <BubbleRenderer
                v-if="part.type === 'text'"
                :content="part.text"
                :show-copy-button="false"
              />
            </template>
          </div>

          <!-- Citations -->
          <div
            v-if="result && result.citations && result.citations.length > 0"
            class="flex flex-col gap-3"
          >
            <div
              v-for="(citation, idx) in result.citations"
              :key="citation.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white dark:bg-gray-800"
            >
              <div class="flex items-start justify-between gap-2 mb-2">
                <div class="font-medium text-sm text-gray-800 dark:text-gray-200">
                  {{ idx + 1 }}. {{ citation.title }}
                </div>
                <span
                  v-if="citation.type"
                  class="shrink-0 px-1.5 py-0.5 text-[10px] border rounded uppercase"
                  :class="getBadgeClass(citation.type)"
                >
                  {{ getBadgeLabel(citation) }}
                </span>
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-3">
                {{ citation.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.skill-panel {
  width: 100%;
}

/* 与聊天窗口 thinking-process-step-dot 颜色一致 */
.skill-panel-step-icon {
  position: absolute;
  left: -21px;
  top: 4px;
  flex-shrink: 0;
}

.skill-panel-step-dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--color-border);
  color: white;
  font-size: 12px;
}

.skill-panel-step-dot--done {
  background: var(--color-primary);
}

.skill-panel-step-dot-loading {
  width: 8px;
  height: 8px;
  border: 2px solid white;
  border-top-color: transparent;
  border-radius: 50%;
  animation: skill-panel-step-spin 0.8s linear infinite;
}

@keyframes skill-panel-step-spin {
  to {
    transform: rotate(360deg);
  }
}

.skill-panel-step-line {
  position: absolute;
  left: -15px;
  top: 20px;
  bottom: -20px;
  width: 2px;
  background: var(--color-border);
}
</style>
