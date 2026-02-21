// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/content', '@nuxtjs/tailwindcss', 'shadcn-nuxt'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',

  app: {
    head: {
      title: 'শব্দবিশারদ ২১',
      htmlAttrs: { lang: 'bn' },
      link: [
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com',
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: '',
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@300;400;500;600;700&display=swap',
        },
      ],
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'আন্তর্জাতিক মাতৃভাষা দিবস ২০২৬ — আপনার বাংলা শব্দভান্ডার যাচাই করুন' },
      ],
    },
  },

  shadcn: {
    prefix: '',
    componentDir: '@/components/ui',
  },
})