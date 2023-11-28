<template>
  <div class="flex relative justify-center content-center h-full items-center">
    <div class="flex justify-center !w-full !xl:w-3/6">
      <div class="bg-secondary login-container rounded-lg animate__animated animate__bounceInRight animated-faster">
        <div class="flex flex-col w-full h-full justify-center gap-2">
          <div class="w-full flex justify-center">
            <img src="logo.png" class="w-[350px]">
          </div>
          <div class="text-white self-center animate__animated animate__zoomIn animated-faster">
            <span class="mr-5 nt-font-size-1.4">E-mail</span>
            <input class="w-full rounded border-none p-2" type="email">
          </div>
          <div class="text-white self-center animate__animated animate__zoomIn animated-faster">
            <span class="mr-5 nt-font-size-1.4">Senha</span>
            <input class="w-full rounded-md border-none p-2" type="password">
          </div>
          <div class="text-white self-center animate__animated animate__zoomIn animated-faster">
            <button class="nt-btn" @click="login">
              <span>Entrar</span>
              <div class="fas i-fa6-angles-right" />
            </button>
          </div>
          <div>
            <div class="text-white self-center w-full text-center p-2">
              <span class="text-sm"> Ao entrar, você automaticamente concorda com os nossos termos de privacidade. Descubra como processamos seus dados lendo nossa política de Privacidade</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useGeneralStore } from '@/stores/general'

const store = useGeneralStore()
const router = useRouter()
const login = () => {
  store.userData = {
    name: 'fakeName'
  }
  router.push({ path: '/' })
}

</script>
<style lang="scss">
.login-container {
  height: 600px;
  width: 50%;
  @media (max-width:640px) {
    height: 100vh;
    width: 100%
  }
}

.welcome-container {
  top: 21px;
  left: 23px;
  position: relative
}
</style>
