<script setup lang="ts">

defineProps({
  percent: Number
})
</script>

<template>
  <div class="flex justify-between mb-1">
    <span class="text-base font-medium text-blue-700 dark:text-white">Amount Spent</span>
    <span class="text-sm font-medium text-blue-700 dark:text-white">{{ percent }}%</span>
  </div>
  <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
    <div class="bg-blue-600 h-2.5 rounded-full" :style="'width:' + percent + '%'"></div>
  </div>

</template>

<style scoped>

</style>