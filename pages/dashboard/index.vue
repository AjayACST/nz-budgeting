<script setup lang="ts">
import { ref, Ref } from 'vue';
import { definePageMeta, useAsyncData, useFetch } from '#imports';
import type { ApiGetAccounts } from '~/types/accounts.types';

definePageMeta({
  middleware: ['auth-logged-in']
});

// Define a ref for accounts
const accounts: Ref<ApiGetAccounts | null> = ref(null);

// Fetch the token using useAsyncData
const { data: tokenData, error: tokenError } = await useAsyncData(async () => {
  const client = useKindeClient();
  return client?.getToken();
});
if (tokenError.value) {
  console.error('Error fetching token:', tokenError.value);
}

// Function to fetch accounts
async function getAccounts() {
  if (!tokenData.value) {
    console.error('Token is not available');
    return; // Prevent fetching accounts if the token is not available
  }

  const { data: accountsData, error: accountsError } = await useFetch<ApiGetAccounts>('/api/v1/accounts', {
    headers: {
      'Authorization': `Bearer ${tokenData.value}`
    }
  });

  if (accountsError.value) {
    console.error('Error fetching accounts:', accountsError.value);
    return;
  }

  accounts.value = accountsData.value;
}

await getAccounts();
</script>

<template>
  <sidebar/>
  <div class="p-4 sm:ml-64">
    <div class="p-4 mt-14">

      <div class="w-full max-w-md p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-8 dark:bg-gray-800 dark:border-gray-700">
        <div class="flex items-center justify-between mb-4">
          <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Your Accounts</h5>
          <a href="#" class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
            View all
          </a>
        </div>
        <div class="flow-root">
          <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
            <li class="py-3 sm:py-4" v-for="account in accounts?.data">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <img class="w-8 h-8 rounded-full" :src="account.logo" alt="Neil image">
                </div>
                <div class="flex-1 min-w-0 ms-4">
                  <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {{ account.account_name }}
                  </p>
                  <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                    {{ account.formatted_account }}
                  </p>
                </div>
                <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                  ${{account.balance_available}}
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* Your styles here */
</style>
