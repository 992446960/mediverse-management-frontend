<template>
  <div class="knowledge-cards-page flex flex-1 flex-col overflow-hidden">
    <KnowledgeCardList owner-type="org" :owner-id="authStore.user?.org_id || ''" />
  </div>
</template>

<script setup lang="ts">
import KnowledgeCardList from '@/components/KnowledgeCardList/index.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
