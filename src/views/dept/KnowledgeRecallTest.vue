<template>
  <KnowledgeRecallTest owner-type="dept" :owner-id="authStore.user?.dept_id || ''" />
</template>

<script setup lang="ts">
import KnowledgeRecallTest from '@/views/shared/KnowledgeRecallTest.vue'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'DeptKnowledgeRecallTest',
})

const authStore = useAuthStore()
</script>
