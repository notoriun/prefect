import { defineStore } from 'pinia'
import pjson from '@/../package.json' assert { type: 'json' }
import { GeneralStoreInterface } from '@/models'

export const useGeneralStore = defineStore('general', {
  state: (): GeneralStoreInterface => ({
    version: pjson.version,
    loadingPulse: true,
    isDebugger: false,
    userData: null
  }),
  getters: {},
  actions: {
    loadingDots: (status: boolean) => {
      const app = document.getElementById('app')
      const div = document.createElement('div')
      div.id = 'loader'
      div.style.position = 'fixed'
      div.style.transform = 'translate(-50%, 0)'
      div.style.top = '50%'
      div.style.left = '50%'
      div.style.zIndex = '1000'

      const loading = document.createElement('span')
      loading.classList.add('loader-dots')

      div.appendChild(loading)
      if (status && app) {
        app.style.transition = 'all 0.5s linear'
        app.style.filter = 'blur(4px)'
        document.body.insertBefore(div, document.body.firstChild)
      } else if (!status && app) {
        app.style.filter = ''
        const loader = document.getElementById('loader')
        if (loader) {
          loader.remove()
        }
      }
    },
    clearStorage: async () => {

    }
  }
})
