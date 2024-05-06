<script>
import _ from "lodash";
// import * as monaco from 'monaco-editor';
import {warning} from '../common'
import loader from '@monaco-editor/loader';
import Enumerable from 'linq';

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
    addTab(icon, label, type, content = "") {
      let tabName = `tab${this.initNumber}`;
      this.allTabs.push({
        icon: icon,
        name: tabName,
        label: label,
        content: content,
        type: type
      });
      this.initNumber++;
      return tabName;
    },
    addHtml() {
      return this.addTab('html', `HTML TAB ${this.initNumber}`, 1, this.initHtmlContent);
    },
    addCss() {
      return this.addTab('css', `CSS TAB ${this.initNumber}`, 2);
    },
    addScript() {
      return this.addTab('javascript', `SCRIPT TAB ${this.initNumber}`, 3);
    },
    changeTab() {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          this.pageName = item.label;
          break;
        }
      }
      console.log("change tab", document.getElementById(`${this.tab}_editor`));
    },
    changePageName() {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          item.label = this.pageName;
          return;
        }
      }
    },
    getTabData() {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          this.pageName = item.label;
          return item;
        }
      }
      return null;
    },
    setCurrentTabContent(content) {
      for (const item of this.allTabs) {
        if (item.name === this.tab) {
          item.content = content;
          return;
        }
      }
    },
    closeTab(tabName) {
      console.log(tabName);
      if (this.allTabs.length === 1) {
        warning("至少要保留一个标签");
        return;
      }
      if (Enumerable.from(this.allTabs).count(x => x.name === tabName && x.type === 1) === 1) {
        warning("至少要保留一个HTML标签");
        return;
      }
      let index = Enumerable.from(this.allTabs).indexOf(x => x.name === tabName);
      if (index >= 0) {
        this.allTabs.splice(index, 1);
      }
      console.log(index);
    }
  },
  mounted() {
    if (this.allTabs.length === 0) {
      this.tab = this.addHtml();
    }
  },
  updated() {
    let elementEditor = document.getElementById(`${this.tab}_editor`);
    if (!_.isEmpty(this.tab) && elementEditor !== null) {
      let {content, type} = this.getTabData();
      let language = "plaintext";
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
      loader.config({
        'vs/nls': {availableLanguages: {'*': 'zh-cn'}},
        paths: {vs: 'https://dpangzi.com/scripts/monaco-editor/min/vs'}
      });
      loader.init().then(monacoInstance => {
        let editor = monacoInstance.editor.create(elementEditor, {
          value: content,
          language: language,
          theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? "vs-dark" : "vs",
        });
        let that = this;
        editor.getModel().onDidChangeContent((e) => {
          let editorContent = editor.getValue();
          that.setCurrentTabContent(editorContent);
        });
      });

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
        <q-tab v-for="item in allTabs" :key="item.name" :name="item.name" :label="item.label" :icon="item.icon" no-caps>
          <template v-slot>
            <q-btn color="primary" flat round dense icon="close" title="关闭当前Tab" @click="closeTab(item.name)"/>
          </template>
        </q-tab>
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
  height: calc(100vh - 191px - 24px);
}

.tab-item {
  display: flex;
  flex-wrap: r;
}
</style>
