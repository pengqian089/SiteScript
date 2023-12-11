<template>
<!--  <q-page class="flex flex-center">-->
<!--    <img-->
<!--      alt="Quasar logo"-->
<!--      src="~assets/quasar-logo-vertical.svg"-->
<!--      style="width: 200px; height: 200px"-->
<!--    >-->
<!--  </q-page>-->
  <code-tabs read-me="gg"></code-tabs>
</template>

<script>
import { defineComponent } from 'vue';
import CodeTabs from "components/CodeTabs.vue";

export default defineComponent({
  name: 'IndexPage',
  components:{CodeTabs}
})
</script>
