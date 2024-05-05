<script>
import _ from "lodash";
import * as monaco from 'monaco-editor'

export default {
  data: () => ({
    title: "SaveDynamicPage",
    tab: null,
    allTabs: [],
    initNumber: 1,
    pageName: null,
    initHtmlContent:
`<!DOCTYPE html>

<html lang="zh-cn">
    <head>
        <title>new page</title>
    </head>
    <body>
        <h1>NEW PAGE</h1>
    </body>
</html>`,
  }),
  methods: {
    addTab(icon,label,type,content = ""){
      let tabName = `tab${this.initNumber}`;
      this.allTabs.push({
        icon: icon,
        name: tabName,
        label: label,
        content: content,
        type: type
      });
      console.log(document.getElementById(tabName + "_editor"));
      this.initNumber++;
      return tabName;
    },
    addHtml() {
      return this.addTab('html',`HTML TAB ${this.initNumber}`,1,this.initHtmlContent);
    },
    addCss() {
      return this.addTab('css',`CSS TAB ${this.initNumber}`,2);
    },
    addScript() {
      return this.addTab('javascript',`SCRIPT TAB ${this.initNumber}`,3);
    },
    changeTab() {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          this.pageName = item.label;
          return;
        }
      }
    },
    changePageName() {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          item.label = this.pageName;
          return;
        }
      }
    },
    getTabData(){
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          this.pageName = item.label;
          return item;
        }
      }
      return null;
    }
  },
  mounted() {
    if (this.allTabs.length === 0) {
      this.tab = this.addHtml();
    }
  },
  updated() {
    let elementEditor = document.getElementById(`${this.tab}_editor`);
    console.log("!_.isEmpty(this.tab) && elementEditor !== null", !_.isEmpty(this.tab), elementEditor !== null, !_.isEmpty(this.tab) && elementEditor !== null);
    if (!_.isEmpty(this.tab) && elementEditor !== null) {
      let {content, type} = this.getTabData();
      let language = "";
      switch (type) {
        case 1:
          language = "html";
          break;
        case 2:
          language = "css";
          break;
        case 3:
          language = "javascript";
          break;
      }
      let editor = monaco.editor.create(elementEditor, {
        value: content,
        language: language,
        theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? "vs-dark" : "vs",
      });
      console.log(editor);
    }
  }
}
</script>

<template>
  <div class="q-pa-md">
    <q-toolbar class="bg-purple text-white shadow-2 rounded-borders">
      <q-btn color="primary" icon="menu" label="新建TAB">
        <q-menu>
          <q-list style="min-width: 100px">
            <q-item clickable v-close-popup @click="addHtml">
              <q-item-section>新建HTML</q-item-section>
            </q-item>
            <q-item clickable v-close-popup @click="addScript">
              <q-item-section>新建JavaScript</q-item-section>
            </q-item>
            <q-separator/>
            <q-item clickable v-close-popup @click="addCss">
              <q-item-section>新建CSS</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
      <q-space/>
      <q-input dense style="width: 200px" v-model="pageName" placeholder="页面名称" label="页面名称"
               @update:model-value="changePageName">
      </q-input>
      <q-space/>

      <q-tabs v-model="tab" shrink stretch @update:model-value="changeTab">
        <q-tab v-for="item in allTabs" :key="item.name" :name="item.name" :label="item.label" :icon="item.icon"/>
      </q-tabs>
    </q-toolbar>
    <q-tab-panels v-model="tab">
      <q-tab-panel v-for="item in allTabs" :key="item.name" :name="item.name">
        <div :id="item.name + '_editor'" class="editor">
        </div>
      </q-tab-panel>
    </q-tab-panels>
  </div>
</template>

<style scoped>
.editor {
  width: 100%;
  height: calc(100vh - 191px);
}
</style>
