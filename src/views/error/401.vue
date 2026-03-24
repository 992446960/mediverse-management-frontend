<template>
  <a-result
    status="403"
    title="401"
    sub-title="Sorry, you are not authenticated. Please log in first."
  >
    <template #extra>
      <a-space>
        <a-button v-if="!noGoBack" @click="$router.go(-1)"> Go Back </a-button>
        <a-button type="primary" @click="$router.push('/login')"> Go to Login </a-button>
      </a-space>
    </template>
  </a-result>
</template>

<script setup lang="ts">
const route = useRoute()
const noGoBack = computed(() => route.query.noGoBack === '1')
</script>
