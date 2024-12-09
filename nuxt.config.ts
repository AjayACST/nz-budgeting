// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  modules: ["@nuxtjs/tailwindcss", "@nuxtjs/kinde", "nuxt-cron"],
  cron: {
    runOnInit: true,
    timeZone: 'Pacific/Auckland',
    jobsDir: 'cron'
  },
  kinde: {
    audience: 'spendcents.io/api/v1'
  }
})