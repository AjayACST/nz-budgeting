<script setup lang="ts">
import {Splitpanes, Pane} from "splitpanes";
import 'splitpanes/dist/splitpanes.css'
import Plus from "~/components/icons/plus.vue";
import {type DatepickerOptions, type DrawerOptions, type InstanceOptions} from "flowbite";
import {useFetch} from "#imports";
import type {BaseAPIArray} from "~/types/api.types";
import type {NZFCCGroup, NZFCCServices} from "~/types/nzfcc.types";
import ArrowRight from "~/components/icons/arrow-right.vue";
import type {CreateBudget, BudgetList} from "~/types/budgets.types";
import {DateTime} from "luxon";
import {BaseAPI} from "@kinde-oss/kinde-typescript-sdk";

const drawer: Ref<Drawer | null> = ref(null)
const datepicker: Ref<Datepicker | null> = ref(null)

const showCategoryAdd: Ref<Boolean> = ref(false)
const showWarning: Ref<Boolean> = ref(false)
// List of groups from API
const nzfccGroups: Ref<NZFCCGroup[]> = ref([])
// The selected group, used to show further categories
const selectedGroup: Ref<NZFCCGroup | null> = ref(null)

// The currently selected budgets for edit mode
const budgetGroups: Ref<NZFCCGroup[]> = ref([])

const editBudget: Ref<CreateBudget | null> = ref(null)

const budgetList: Ref<BudgetList[]> = ref([])

setBlankBudget()

// Fetch the token using useAsyncData
const { data: tokenData, error: tokenError } = await useAsyncData(async () => {
  const client = useKindeClient();
  return client?.getToken();
});
if (tokenError.value) {
  console.error('Error fetching token:', tokenError.value);
}

onMounted(() => {
  const $targetEL: HTMLElement | null = document.getElementById('budget-edit-drawer')
  const $targetDate: HTMLElement | null = document.getElementById('datepicker-start-date')

  const dateOptions: DatepickerOptions = {
    autohide: false,
    format: 'dd/mm/yyyy',
    buttons: true,
    autoSelectToday: 1
  }

  const drawOptions: DrawerOptions = {
    placement: 'right',
    backdrop: true
  }
  const instanceOptions: InstanceOptions = {
    id: 'budget-edit-drawer',
    override: true
  }

  const dateInstnace: InstanceOptions = {
    id: 'datepicker-start-date',
    override: true
  }

  drawer.value = new Drawer($targetEL, drawOptions, instanceOptions)
  datepicker.value = new Datepicker($targetDate, dateOptions, dateInstnace)
})

await loadCategories()
await loadBudgets()

async function loadCategories() {
  if (!tokenData.value) {
    console.error('Token is not available');
    return;
  }
  const { data: groups, error: fetchError } = await useFetch<BaseAPIArray<NZFCCGroup>>('/api/v1/nzfcc', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenData.value}`
    }
  })

  if (fetchError.value) {
    console.error('Error fetching categories: ', fetchError.value)
    return
  }
  if (!groups.value) {
    return
  }
  nzfccGroups.value = groups.value.data;
}

async function loadBudgets() {
  if (!tokenData.value) {
    console.error('Token is not available')
    return
  }
  const {data: budgets, error: fetchError} = await useFetch<BaseAPIArray<BudgetList>>('/api/v1/budgets', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${tokenData.value}`
    }
  })

  if (fetchError.value) {
    console.error('Error fetching budgets: ', fetchError.value)
    return
  }

  if (!budgets.value) {
    return
  }
  budgetList.value = budgets.value.data
}

function selectService(group: NZFCCGroup, service: NZFCCServices) {
//   Check if group already in budgetList
  const findIndex: number = budgetGroups.value.findIndex((element) => element.groupName == group.groupName)
  if (findIndex >= 0) {
    // Check the service doesn't already exist
    const findIndexService: number = budgetGroups.value[findIndex].groupServices.findIndex((element) => element.id == service.id)
    if (findIndexService >= 0) {
      // Service already exists, remove it
      budgetGroups.value[findIndex].groupServices.splice(findIndexService, 1)
      // Check if we need to remove group
      if (budgetGroups.value[findIndex].groupServices.length == 0) {
        budgetGroups.value.splice(findIndex, 1)
      }
    } else {
      budgetGroups.value[findIndex].groupServices.push(service)
    }

  } else {
    // Create it
    budgetGroups.value.push({
      groupName: group.groupName,
      groupServices: [service]
    })
  }
}

function setBlankBudget() {
  editBudget.value = {
    name: '',
    description: '',
    amount: 0,
    start_date: '',
    refresh_every: 'week',
    budgetIDs: ['']
  }
}

async function submitBudget() {
   if (budgetGroups.value.length == 0) {
      showWarning.value = true
     return
   }

   // Get service IDs
  const serviceIds: string[] = budgetGroups.value.flatMap(group => group.groupServices.map(service => service.id))

  // setup submit values

  editBudget.value!.start_date = DateTime.fromJSDate(datepicker.value.getDate()).toUTC().toISO() || DateTime.now().toUTC().toISO()
  editBudget.value!.budgetIDs = serviceIds

  const {data: submitRes, error: submitErr} = await useFetch<BaseAPI>('/api/v1/budgets/create', {
    method: "POST",
    headers: {
      'Authorization': `Bearer ${tokenData.value}`
    },
    body: editBudget.value
  })

  if (submitErr.value) {
    console.error('Error fetching accounts: ', submitErr.value)
    return
  }

  // add in refresh function
  drawer.value.hide()
}

</script>

<template>
  <sidebar/>
  <div class="p-4 sm:ml-64 test">
    <div class="p-4 mt-14">
      <Splitpanes class="default-theme">
        <Pane>
          <button @click="drawer.show(); setBlankBudget()" type="button" class="px-5 py-2.5 text-sm font-medium text-white inline-flex items-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            <plus class="w-3.5 h-3.5 text-white me-2"/>
            Create New Budget
          </button>
          <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
            <li v-for="budget of budgetList" class="py-3 sm:py-4 hover:cursor-pointer hover:bg-gray-300 transition-colors hover:rounded-md p-4" @click="console.log('hello')">
              <div class="flex items-center">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {{ budget.name }}
                  </p>
                  <p class="text-sm text-gray-500 truncate dark:text-gray-400">
                    {{ budget.description }}
                  </p>
                </div>
                <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                  ${{budget.spent}} / ${{budget.amount}} remaining
                </div>
              </div>
              <div class="pt-2">
                <progress-bar :percent="Math.round((budget.spent / budget.amount) * 100)"/>
              </div>

            </li>
          </ul>
        </Pane>
      </Splitpanes>

      <!-- Create budget drawer -->
      <div id="budget-edit-drawer" class="fixed top-0 right-0 z-50 h-screen p-4 overflow-y-auto transition-transform translate-x-full min-w-80 bg-white dark:bg-gray-800" tabindex="-1" aria-labelledby="drawer-right-label">
        <h5 id="drawer-label" class="inline-flex items-center mb-4 text-base font-semibold  "><plus class="w-4 h-4 me-2.5"/> Create New Budget</h5>
        <button type="button" data-drawer-hide="budget-edit-drawer" aria-controls="budget-edit-drawer" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 absolute top-2.5 end-2.5 flex items-center justify-center dark:hover:bg-gray-600 dark:hover:text-white" >
          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
          </svg>
          <span class="sr-only">Close menu</span>
        </button>

        <!--        Drawer body -->
        <div class="flex gap-5 basis-1/2">
          <div id="new-budget-form-main">
            <form @submit.prevent="submitBudget">
              <div class="mb-5">
                <label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Budget Name</label>
                <input v-model="editBudget!.name" type="text" id="name" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="e.g. Transport" required />
              </div>

              <div class="mb-5">
                <label for="amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Budget Amount</label>
                <input v-model="editBudget!.amount" type="number" min="0" id="amount" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="$200" required />
              </div>

              <div class="relative max-w-sm mb-5">
                <label for="amount" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Budget Start Date</label>
                <div class="absolute inset-y-12 start-0 flex items-center ps-3 pointer-events-none">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/>
                  </svg>
                </div>
                <input id="datepicker-start-date" required type="text" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Select date">
              </div>

              <div class="mb-5">
                <label for="countries" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Refresh Cycle</label>
                <select id="countries" class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
                  <option value="week">Weekly</option>
                  <option value="fortnight">Fortnightly</option>
                  <option value="month">Monthly</option>
                  <option value="quarter">Quarterly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>

              <div class="mb-5">
                <label for="message" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Budget Description</label>
                <textarea v-model="editBudget!.description" id="message" rows="4" class="block p-2.5 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Give it a helpful description (optional)"></textarea>
              </div>

              <button type="button" @click="showCategoryAdd = !showCategoryAdd" class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Choose Categories
                <svg class="rtl:rotate-180 w-3.5 h-3.5 ms-2" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
                </svg>
              </button>

              <p class="block pt-2 text-sm font-medium text-gray-900">Categories in budget</p>
              <ul class="space-y-4 text-gray-500 list-disc list-inside dark:text-gray-400">
                <li v-for="group in budgetGroups">
                  {{ group.groupName }}
                  <ul class="ps-5 mt-1 space-y-1 list-disc list-inside">
                    <li v-for="service in group.groupServices">{{ service.name }}</li>
                  </ul>
                </li>
              </ul>
              <button type="submit" class="mt-5 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                Create Budget
              </button>
            </form>
          </div>

          <div v-if="showCategoryAdd" id="new-budget-form-categories">
            <ul class="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
              <li @click="selectedGroup = group" :class="{ 'bg-gray-300': selectedGroup == group }" class="hover:cursor-pointer pb-3 sm:pb-4 hover:bg-gray-300 rounded-md" v-for="group in nzfccGroups">
                <div class="flex items-center space-x-4 rtl:space-x-reverse">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {{ group.groupName }}
                    </p>
                  </div>
                  <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                    <arrow-right/>
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div v-if="selectedGroup" id="new-budget-form-services">
            <ul class="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
              <li @click="selectService(selectedGroup, services)" :class="{'bg-gray-300': budgetGroups.find((element) => element.groupName == selectedGroup?.groupName)?.groupServices.find((element) => element.id == services.id) }" class="pb-3 sm:pb-4 hover:bg-gray-300 rounded-md" v-for="services in selectedGroup?.groupServices">
                <div class="flex items-center space-x-4 rtl:space-x-reverse">
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                      {{ services.name }}
                    </p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
  <toasts-warning warning-text="Can't create a budget with no categories!" v-if="showWarning" @click="showWarning = false" class="hover:cursor-pointer"/>
</template>

<style scoped>

.splitpanes__pane {
  background-color: white !important;
}

.splitpanes--vertical > .splitpanes__splitter {
  min-width: 6px;
  background: linear-gradient(90deg, #ccc, #111);
}

</style>