<template>
  <div class="relative wrapper bg-fullscreen-background">
    <component
      v-if="headerComponent"
      :is="headerComponent"
      v-bind="headerProps"
    />
    <router-view class="default-root-container" v-slot="{ Component }" style="overflow-x: hidden">
      <transition
        name="route-transition"
        enter-active-class="animate__animated animate__slideInUp animated__faster animate__faster">
        <component :is="Component" :class="`flex flex-col h-full w-full self-center items-center ${route.meta.limitWidth ? 'max-w-7xl' : ''} bg-background ${$route.meta.centered ? 'place-content-center' : ''}`" />
      </transition>
    </router-view>
    <footer>
      <component
        v-if="route.meta.footerComponent"
        :is="route.meta.footerComponent.component"
        v-bind="route.meta.footerComponent.props"
      />
    </footer>
  </div>
</template>

<script setup lang="ts">
import { RouteRecordNormalized, useRoute } from 'vue-router'
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useGeneralStore } from '@/stores/general'

interface CustomRouteInterface extends RouteRecordNormalized {
  meta: any
}
const route = useRoute() as unknown as CustomRouteInterface

const store = useGeneralStore()
const headerComponent = shallowRef(route.meta.headerComponent?.component)
const headerProps = ref(route.meta.headerComponent?.props)
watch(() => store.headerComponents, async (headerComponents) => {
  await nextTick()
  headerComponent.value = headerComponents[route.name].component
  headerProps.value = headerComponents[route.name].props
  route.meta.headerComponent = {
    component: headerComponent.value,
    props: headerProps.value
  }
}, { deep: true })

watch(route, (params) => {
  headerComponent.value = route.meta.headerComponent?.component
  const routesName = ['Login']
  if (routesName.includes(params.name)) {
    headerComponent.value = null
  }
})
</script>

<style lang="scss">
html, body {
  height: 100% !important;
  margin: 0 !important;
}
.wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.header, .footer {
  height: 3rem;
}
.content {
  flex: 1;
  overflow: auto;
}
.default-root-container {
  overflow: auto;
}
h1 {
  display: block !important;
  font-size: 2em !important;
  margin-block-start: 0.67em !important;
  margin-block-end: 0.67em !important;
  margin-inline-start: 0px !important;
  margin-inline-end: 0px !important;
  font-weight: bold !important;
}
</style>
