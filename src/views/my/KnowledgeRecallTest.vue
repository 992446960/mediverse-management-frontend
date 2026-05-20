<template>
  <KnowledgeRecallTest owner-type="personal" :owner-id="authStore.user?.id || ''" />
</template>

<script setup lang="ts">
import KnowledgeRecallTest from '@/views/shared/KnowledgeRecallTest.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
