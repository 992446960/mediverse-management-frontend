<script setup lang="ts">
const route = useRoute()
const router = useRouter()

onMounted(() => {
  const { params, query } = route
  const path = Array.isArray(params.path) ? `/${params.path.join('/')}` : `/${params.path}`
  router.replace({ path, query })
})
</script>

<template>
  <div />
</template>
