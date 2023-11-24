<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated>
      <q-toolbar>
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleLeftDrawer"/>
        <q-toolbar-title>
          Quasar App
        </q-toolbar-title>
        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
    >
      <q-list>
        <q-item-label header>
          代码预览
        </q-item-label>
        <q-tree
          :nodes="tree"
          node-key="name"
          @lazy-load="loadNode"
          selected-color="primary">
          <template v-slot:default-header="prop">
            <div class="row items-center">
              <img :src="prop.node.icon" alt="icon">
              <div class="visual-split"></div>
              <div class="text-weight-bold text-primary">{{ prop.node.name }}</div>
            </div>
          </template>
        </q-tree>

      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view/>
    </q-page-container>
  </q-layout>
</template>
<style scoped>
.row.items-center {
  display: flex;
  flex-wrap: nowrap;
}

.visual-split {
  width: 1em;
}

.row.items-center img {
  width: 16px;
  user-select: none;
}
</style>
<script>
import {defineComponent, ref} from 'vue'
import EssentialLink from 'components/EssentialLink.vue'
import {fetchCodeTree} from "src/fetchCode";


export default defineComponent({
  name: 'MainLayout',

  components: {
    EssentialLink,
  },
  async mounted() {
    let nodes = await fetchCodeTree();
    console.log(nodes);
    this.tree = nodes["directories"];
    for (const file of nodes["files"]) {
      this.tree.push(file);
    }

  },
  data: () => ({
    leftDrawerOpen: false,
    tree: [],
    selected: ""
  }),
  methods: {
    toggleLeftDrawer() {
      this.leftDrawerOpen = !this.leftDrawerOpen
    },
    async loadNode({node, key, done, fail}) {
      let nodes = await fetchCodeTree(node["currentPath"]);
      let tree = nodes["directories"];
      for (const file of nodes["files"]) {
        tree.push(file);
      }
      done(tree);
    }
  },
})
</script>
