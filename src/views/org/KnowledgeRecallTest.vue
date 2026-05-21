<template>
  <KnowledgeRecallTest owner-type="org" :owner-id="authStore.user?.org_id || ''" />
</template>

<script setup lang="ts">
import KnowledgeRecallTest from '@/views/shared/KnowledgeRecallTest.vue'
import { useAuthStore } from '@/stores/auth'

defineOptions({
  name: 'OrgKnowledgeRecallTest',
})

const authStore = useAuthStore()
</script>
