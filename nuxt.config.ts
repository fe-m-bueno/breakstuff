import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@vueuse/nuxt', '@nuxtjs/color-mode'],

  css: ['~/assets/css/main.css'],

  // Tailwind v4 runs as a Vite plugin. No PostCSS config and no
  // tailwind.config.js: the theme is declared in CSS (app/assets/css/main.css).
  vite: {
    plugins: [tailwindcss()]
  },

  colorMode: {
    // `.dark` rather than `.dark-mode`, to match the @custom-variant in main.css.
    classSuffix: '',
    preference: 'system',
    fallback: 'light',
    storageKey: 'breakstuff-color-mode'
  },

  // localStorage, not cookies. The previous build kept the whole task list in a
  // cookie, so every task was uploaded again on every single request.
  piniaPluginPersistedstate: {
    storage: 'localStorage'
  },

  runtimeConfig: {
    /*
     * Declared empty on purpose. Do not reference process.env here.
     *
     * nuxt.config.ts is evaluated at build time, so `process.env.OPENROUTER_API_KEY`
     * would be read on the build machine and inlined as a string literal into the
     * server bundle. That bakes the key into a deployable artifact: Netlify's
     * secret scanner fails the build for exactly this, and rightly so.
     *
     * Keeping the keys declared but empty preserves the typed shape and the
     * standard NUXT_OPENROUTER_API_KEY runtime override, while baking nothing.
     * The handler reads process.env at request time, which is where the plain
     * unprefixed OPENROUTER_API_KEY / OPENROUTER_MODEL names are picked up.
     */
    openrouterApiKey: '',
    openrouterModel: ''
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'color-scheme', content: 'light dark' },
        // Matches --ui-canvas per theme so mobile browser chrome blends in.
        { name: 'theme-color', content: '#fdfcfb', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#17140f', media: '(prefers-color-scheme: dark)' }
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }]
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  }
});
