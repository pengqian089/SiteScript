<script>
import _ from "lodash";
// import * as monaco from 'monaco-editor';
import {warning, postAsync, fetchGetAsync, success} from '../common'
import loader from '@monaco-editor/loader';
import Enumerable from 'linq';
import {useRouter, useRoute} from "vue-router";

export default {
  data: () => ({
    title: "SaveDynamicPage",
    tab: null,
    allTabs: [],
    initNumber: 1,
    pageName: null,
    saving: false,
    router: useRouter(),
    loading: false,
    canUseTab: true
  }),
  methods: {
    addTab(icon, label, type, content = "") {
      if (!this.canUseTab) {
        warning("不能添加标签");
        return;
      }
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
    initHtmlContent() {
      return `<!DOCTYPE html>

<html lang="zh-cn">
    <head>
        <title>new page ${this.initNumber}</title>
    </head>
    <body>
        <h1>NEW PAGE ${this.initNumber}</h1>
    </body>
</html>`
    },
    addHtml(content = null) {
      if (Enumerable.from(this.allTabs).any(x => x.type === 1)) {
        warning("已有HTML，不能继续添加！");
        return;
      }
      if (content === null) {
        return this.addTab('html', `HTML TAB ${this.initNumber}`, 1, this.initHtmlContent());
      } else {
        return this.addTab('html', content.label, 1, content.content);
      }
    },
    addCss(content = null) {
      if (content === null) {
        return this.addTab('css', `CSS TAB ${this.initNumber}`, 2);
      } else {
        return this.addTab('css', content.label, 2, content.content);
      }
    },
    addScript(content = null) {
      if (content === null) {
        return this.addTab('javascript', `SCRIPT TAB ${this.initNumber}`, 3);
      } else {
        return this.addTab('javascript', content.label, 3, content.content);
      }
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
      if (!this.canUseTab) {
        warning("不能移除标签");
        return;
      }
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
    },
    save() {
      this.saving = true;

      const allTabs = Enumerable.from(this.allTabs);
      const htmlTab = allTabs.firstOrDefault(x => x.type === 1);

      console.log(allTabs);

      if (htmlTab == null) {
        this.saving = false;
        warning("没有HTML");
        return;
      }
      if (_.isEmpty(htmlTab.label)) {
        this.saving = false;
        warning("请输入名称");
        return;
      }
      if (_.isEmpty(htmlTab.content)) {
        this.saving = false;
        warning("请输入内容");
        return;
      }

      let styleContents = {};
      allTabs.where(x => x.type === 2)
        .where(x => !_.isEmpty(x.label) && !_.isEmpty(x.content))
        .forEach((x, y) => {
          styleContents[y] = {name: x.label, content: x.content}
        });

      let scriptContents = {};
      allTabs.where(x => x.type === 3)
        .where(x => !_.isEmpty(x.label) && !_.isEmpty(x.content))
        .forEach((x, y) => {
          scriptContents[y] = {name: x.label, content: x.content}
        });

      let pageInformation = {
        htmlContent: {
          name: htmlTab.label,
          content: htmlTab.content
        },
        styleContents: styleContents,
        scriptContents: scriptContents
      };
      console.log(pageInformation);
      let that = this;
      let url = this.canUseTab ? "/Dynamic/Create" : "/Dynamic/Save";
      postAsync({url: url, data: pageInformation})
        .then(() => {
          success("保存成功");
          this.router.push({name: 'dynamic-pages'});
        })
        .finally(() => {
          that.saving = false;
        });

    },
    back() {
      this.router.push({name: 'dynamic-pages'});
    }
  },
  async mounted() {
    this.loading = true;
    const {params} = useRoute();
    let id = params.id;
    let pageInformation = null;
    if (!_.isEmpty(id)) {
      pageInformation = await fetchGetAsync({url: `/Dynamic/Find/${id}`});
    }
    if (this.allTabs.length === 0) {
      if (pageInformation != null) {
        console.log(pageInformation);
        let content = {label: pageInformation.id, content: pageInformation.content};
        this.tab = this.addHtml(content);
        if (!_.isEmpty(pageInformation.scripts)) {
          for (const item of pageInformation.scripts) {
            let scriptContent = {label: item.name, content: item.content};
            this.addScript(scriptContent);
          }
        }
        if (!_.isEmpty(pageInformation.styles)) {
          for (const item of pageInformation.styles) {
            let styleContent = {label: item.name, content: item.content};
            this.addCss(styleContent);
          }
        }
      } else {
        this.tab = this.addHtml();
      }
    }

    this.canUseTab = pageInformation === null;
    this.loading = false;
  },
  updated() {
    let elementEditor = document.getElementById(`${this.tab}_editor`);
    let loaded = elementEditor?.dataset?.loaded;
    if (!_.isEmpty(this.tab) && elementEditor !== null && loaded !== "true") {
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
        elementEditor.dataset.loaded = "true";
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
  <div class="q-pa-md" v-if="loading">
    <q-card>
      <q-item>
        <q-item-section avatar>
          <q-skeleton type="QAvatar"/>
        </q-item-section>

        <q-item-section>
          <q-item-label>
            <q-skeleton type="text"/>
          </q-item-label>
          <q-item-label caption>
            <q-skeleton type="text"/>
          </q-item-label>
        </q-item-section>
      </q-item>

      <q-skeleton height="200px" square/>

      <q-card-actions align="right" class="q-gutter-md">
        <q-skeleton type="QBtn"/>
        <q-skeleton type="QBtn"/>
      </q-card-actions>
    </q-card>

  </div>
  <div class="q-pa-md" v-else>
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
    <q-btn color="primary" label="保存&发布" :loading="saving" @click="save">
      <template v-slot:loading>
        <q-spinner-hourglass class="on-left"/>
        保存中...
      </template>
    </q-btn>
    <q-btn color="secondary" label="返回列表" @click="back">
    </q-btn>
  </div>
</template>

<style scoped>
.editor {
  width: 100%;
  height: calc(100vh - 191px - 40px);
}
</style>
