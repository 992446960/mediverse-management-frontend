<template>
  <div class="knowledge-cards-page flex flex-1 flex-col overflow-hidden">
    <KnowledgeCardList owner-type="dept" :owner-id="authStore.user?.dept_id || ''" />
  </div>
</template>

<script setup lang="ts">
import KnowledgeCardList from '@/components/KnowledgeCardList/index.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
