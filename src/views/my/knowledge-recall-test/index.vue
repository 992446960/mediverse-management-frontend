<template>
  <KnowledgeRecallTest owner-type="personal" :owner-id="authStore.user?.id || ''" />
</template>

<script setup lang="ts">
import KnowledgeRecallTest from '@/views/shared/knowledge-recall-test/index.vue'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'MyKnowledgeRecallTest',
})

const authStore = useAuthStore()
</script>
