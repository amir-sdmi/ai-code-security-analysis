import { defineConfig } from 'vitepress'

export const META_IMAGE = 'https://pinia.vuejs.org/social.png'
export const META_TITLE = 'AI Frontend Handbook'
export const META_DESCRIPTION = 'An answer Collection of Frontend powered by ChatGPT.'

export const sharedConfig = defineConfig({
  // deploy address
  base: process.env.NODE_ENV === 'production' ? '/ai-frontend-handbook/' : '',
  title: META_TITLE,
  description: META_DESCRIPTION,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/songbing97/ai-frontend-handbook' }
    ],

    footer: {
      copyright: 'Copyright © 2019-present Songbing97',
      message: 'Released under the MIT License.',
    },

    editLink: {
      pattern: 'https://github.com/songbing97/ai-frontend-handbook/edit/master/docs/:path',
      text: 'Suggest changes to this page',
    },

    // algolia: {
      // appId: '69Y3N7LHI2',
      // apiKey: '45441f4b65a2f80329fd45c7cb371fea',
      // indexName: 'pinia',
    // },
  },
})
