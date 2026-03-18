<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import {
  AppstoreOutlined,
  CaretDownOutlined,
  CaretRightOutlined,
  ToolOutlined,
} from '@ant-design/icons-vue'
import { getAvatarSkills } from '@/api/sessions'
import type { AvatarSkill } from '@/api/sessions'
import { useChatStore } from '@/stores/chat'

const { t } = useI18n()
const chatStore = useChatStore()
const { currentSession, messages, currentSessionId } = storeToRefs(chatStore)

const skills = ref<AvatarSkill[]>([])
const expandedSkillId = ref<string | null>(null)
const loading = ref(false)

const fetchSkills = async (avatarId: string) => {
  loading.value = true
  try {
    skills.value = await getAvatarSkills(avatarId)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  if (currentSession.value?.avatar_id) {
    fetchSkills(currentSession.value.avatar_id)
  }
})

watch(
  () => currentSession.value?.avatar_id,
  (avatarId) => {
    if (avatarId) {
      fetchSkills(avatarId)
    }
  }
)

const currentMessages = computed(() => {
  const id = currentSessionId.value
  return id ? messages.value[id] || [] : []
})

const getSkillCallRecords = (skillName: string) => {
  return currentMessages.value
    .filter((msg) => msg.tool_calls && msg.tool_calls.some((tc) => tc.skill_name === skillName))
    .flatMap((msg) => {
      const msgIndex = currentMessages.value.indexOf(msg) + 1
      return (msg.tool_calls || [])
        .filter((tc) => tc.skill_name === skillName)
        .map((tc) => ({ ...tc, messageIndex: msgIndex }))
    })
}

const toggleSkill = (skillId: string) => {
  expandedSkillId.value = expandedSkillId.value === skillId ? null : skillId
}

const summarizeJson = (obj?: Record<string, any>): string => {
  if (!obj) return '-'
  const keys = Object.keys(obj).slice(0, 3)
  return keys.map((k) => `${k}: ${JSON.stringify(obj[k])}`).join(', ')
}
</script>

<template>
  <div
    class="skill-panel h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-100 dark:border-gray-800"
  >
    <!-- Header -->
    <div
      class="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 shrink-0"
    >
      <AppstoreOutlined class="text-gray-400" />
      <span class="font-medium text-sm text-gray-700 dark:text-gray-200">{{
        t('chat.skillPanel')
      }}</span>
    </div>

    <!-- No Session State -->
    <div
      v-if="!currentSession"
      class="flex-1 flex items-center justify-center text-gray-400 text-sm p-4 text-center"
    >
      {{ t('chat.noSessions') }}
    </div>

    <!-- Skills List -->
    <div v-else class="flex-1 overflow-y-auto p-3">
      <a-spin v-if="loading" class="w-full flex justify-center pt-8" />

      <div v-else-if="skills.length === 0" class="text-center text-gray-400 text-sm pt-8">
        {{ t('chat.skillNoRecords') }}
      </div>

      <div v-else class="flex flex-col gap-2">
        <div
          v-for="skill in skills"
          :key="skill.id"
          class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          <!-- Skill Card Header -->
          <div
            class="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors select-none"
            @click="toggleSkill(skill.id)"
          >
            <ToolOutlined class="text-xs text-gray-400 shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                {{ skill.name }}
              </div>
              <div class="text-xs text-gray-400 truncate mt-0.5">{{ skill.description }}</div>
            </div>
            <CaretDownOutlined
              v-if="expandedSkillId === skill.id"
              class="text-xs text-gray-400 shrink-0"
            />
            <CaretRightOutlined v-else class="text-xs text-gray-400 shrink-0" />
          </div>

          <!-- Expanded: Call Records -->
          <div
            v-if="expandedSkillId === skill.id"
            class="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          >
            <template v-if="getSkillCallRecords(skill.name).length > 0">
              <div
                v-for="(record, idx) in getSkillCallRecords(skill.name)"
                :key="idx"
                class="px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0 text-xs"
              >
                <div class="text-gray-400 mb-1">
                  {{ t('chat.message') }} #{{ record.messageIndex }}
                </div>
                <div class="text-gray-500 mb-0.5">
                  <span class="font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('chat.skillCallArgs') }}：</span
                  >
                  <span class="font-mono break-all">{{ summarizeJson(record.args) }}</span>
                </div>
                <div class="text-gray-500 mb-0.5">
                  <span class="font-medium text-gray-600 dark:text-gray-300"
                    >{{ t('chat.skillCallResult') }}：</span
                  >
                  <span class="font-mono break-all">{{ summarizeJson(record.result) }}</span>
                </div>
                <div v-if="record.duration_ms" class="text-gray-400">
                  {{ t('chat.skillCallDuration') }}：{{ record.duration_ms }}ms
                </div>
              </div>
            </template>
            <div v-else class="px-3 py-3 text-xs text-gray-400 text-center">
              {{ t('chat.skillNoRecords') }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
