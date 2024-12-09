<script setup lang="ts">
  import {Splitpanes, Pane} from "splitpanes";
  import 'splitpanes/dist/splitpanes.css'
</script>

<template>
  <sidebar/>
  <div class="p-4 sm:ml-64 test">
    <div class="p-4 mt-14">
        <Splitpanes class="default-theme">
          <Pane v-for="i in 3" :key="i">
            {{i}}
          </Pane>
        </Splitpanes>

    </div>
  </div>
</template>

<style scoped>

</style>