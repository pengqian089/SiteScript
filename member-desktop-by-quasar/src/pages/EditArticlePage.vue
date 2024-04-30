<script>
import {MdEditor} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {useRoute, useRouter} from 'vue-router';
import _ from "lodash";
import {fetchGetAsync, getToken, handleResponse, handleUploadResponse, host, toolbars} from "../common";


export default {
  components: {MdEditor},
  data: () => ({
    router: useRouter(),
    id: null,
    article: {
      tags:[]
    },
    toolbars: toolbars,
    tags: []
  }),
  async mounted() {
    const {params} = useRoute();
    await this.loadTags();
    console.log(params);
    let id = params.id;
    if (!_.isEmpty(id)) {
      this.id = id;
      await this.loadArticle();
    }
  },
  methods: {
    getTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    /**
     * 上传文章相关图片
     * @param {File[]} files 选择的图片
     * @param {function(string[])} callback 上传成功后的回调函数
     * */
    async uploadImage(files, callback) {
      if (files.length <= 0) {
        this.warning("请选择图片")
        return;
      }

      let file = files[0];
      if (!file.type.startsWith("image")) {
        this.warning("请选择图片上传")
        return;
      }

      let formData = new FormData();
      formData.append("image", file);

      let response = await fetch(`${host}/Article/Upload`,
        {
          headers: {"Authorization": `Bearer ${getToken()}`},
          method: "post",
          body: formData
        });
      let url = await handleUploadResponse(response);
      callback([url]);
    },
    /**
     * 保存编辑器html内容
     * */
    onHtmlChanged(html) {
      this.article.blogContents = html;
    },
    async deleteItem(item) {
      let that = this;
      this.$q.dialog({
        message: `删除后不可恢复，确定要删除《${item.title}》吗？`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        that.showDelete = true;
        let formData = new FormData();
        formData.append("id", item.id);
        let response = await fetch(`${host}/Article/Delete`, {
          method: "post",
          body: formData,
          headers: {
            "Authorization": `Bearer ${getToken()}`,
          }
        });
        //let that = this;
        await handleResponse(response, () => that.showDelete = false);
        that.showDelete = false;
        await that.loadArticles({page: 1, itemsPerPage: that.pageSize});
      });
    },
    /**
     * 加载标签选项
     * */
    async loadTags() {
      this.tags = await fetchGetAsync({
        url: "/Article/Tags"
      });
      //this.tags = await handleResponse(response);
    },
    /**
     * 加载文章详情
     * */
    async loadArticle() {
      this.article = await fetchGetAsync({
        url:`/Article/Detail/${this.id}`
      });
    },
  }
}
</script>

<template>
  <div class="q-pa-md">
    <q-form class="q-gutter-md">
      <q-input
        filled
        v-model="article.title"
        name="title"
        label="标题"
        hint="文章标题"
        lazy-rules
        :rules="[ val => val && val.length > 0 || '请输入文章标题']"
      />
      <q-select
        multiple
        v-model="article.tags"
        name="tags"
        :options="tags"
        label="标签"
        hint="文章标签"
        :rules="[ val => val && val.length > 0 || '请选择文章标签']"
      ></q-select>
      <q-input
        v-model="article.newTag"
        name="newTag"
        label="添加标签"
        placeholder="标签"
        hint="添加新的文章标签"
      ></q-input>
      <q-input
        v-model="article.introduction"
        name="introduction"
        label="简介"
        placeholder="简介"
        hint="描述该文章的简介"
        type="textarea"
      />
      <md-editor
        :theme="getTheme()"
        v-model="article.markdown"
        :toolbars="toolbars"
        @onUploadImg="uploadImage"
        @onHtmlChanged="onHtmlChanged"
      >
      </md-editor>
    </q-form>
  </div>
</template>

<style scoped>

</style>
