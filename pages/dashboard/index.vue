<script setup lang="ts">
  import {definePageMeta} from "#imports";
  const client = useKindeClient()
  definePageMeta({
    middleware: ["auth-logged-in"]
  })

  const { data: token } = await useAsyncData(async () => {
    const client = useKindeClient()
    return client?.getToken();
  })

</script>

<template>
  {{ $auth.user }}

  {{ token }}

</template>

<style scoped>

</style>