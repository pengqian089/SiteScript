<template>
  <v-layout class="rounded rounded-md">
    <v-app-bar>
      <v-app-bar-nav-icon variant="text" @click="taggerDrawer"></v-app-bar-nav-icon>
      <v-toolbar-title>个人中心</v-toolbar-title>
    </v-app-bar>

    <v-navigation-drawer v-model="showDrawer">
      <v-list>
        <v-list-item title="基本设置" value="基本设置" prepend-icon="mdi-tune-variant" to="/">
        </v-list-item>
        <v-list-item title="我的文章" value="我的文章" prepend-icon="mdi-clipboard-text-multiple-outline" to="/article">
        </v-list-item>
        <v-list-item title="碎碎念" value="碎碎念" prepend-icon="mdi-message-flash" to="/mumble">
        </v-list-item>
        <v-list-item title="时间轴" value="时间轴" prepend-icon="mdi-timeline" to="/timeline">
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="d-flex align-center justify-center">
      <RouterView/>
    </v-main>
  </v-layout>
</template>

<script>
import {RouterView} from 'vue-router';

export default {
  components: {RouterView},
  data: () => ({
    showDrawer: true,
  }),
  methods: {
    taggerDrawer() {
      this.showDrawer = !this.showDrawer;
    }
  }
}
</script>
