<script>
import {MdEditor} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {useRoute,useRouter } from 'vue-router';
import {getToken, handleResponse, handleUploadResponse, host} from "../../common";
import {useNotifier} from "vuetify-notifier";
import _ from "lodash";
import { VSkeletonLoader } from 'vuetify/labs/VSkeletonLoader';

export default {
  components: {MdEditor,VSkeletonLoader},
  data: () => ({
    router:useRouter(),
    id: null,
    toolbars: [
      'bold',
      'underline',
      'italic',
      'image',
      'strikeThrough',
      '-',
      'quote',
      'unorderedList',
      'orderedList',
      '-',
      'codeRow',
      'code',
      'link',
      'table',
      '=',
      'prettier',
      'pageFullscreen',
      'preview',
      'catalog',
    ],
    notifier: useNotifier(),
    article: {},
    tags: [],
    publishing: false,
    loading: true
  }),
  async mounted() {
    const {params} = useRoute();
    await this.loadTags();
    let id = params.id;
    if (!_.isEmpty(id)) {
      this.id = id;
      await this.loadArticle();
    }
    this.loading = false;
  },
  methods: {
    /**
     * 加载文章详情
     * */
    async loadArticle() {
      let response = await fetch(`${host}/Article/Detail/${this.id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
      });
      this.article = await handleResponse(response);
    },
    /**
     * 加载标签选项
     * */
    async loadTags() {
      let response = await fetch(`${host}/Article/Tags`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
      });
      this.tags = await handleResponse(response);
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
    /**
     * 保存文章
     * */
    async publish(values) {
      if (_.isEmpty(this.article.markdown)) {
        this.warning("请填写文章正文");
        return;
      }
      if (_.isEmpty(this.article.blogContents)) {
        this.warning("没有检测到文章正文")
        return;
      }
      this.publishing = true;
      // values.markdown = this.article.markdown;
      // values.blogContents = this.article.blogContents;
      // values.id = this.article.id;
      let formData = new FormData();
      for (let item in this.article) {
        formData.append(item, this.article[item]);
      }
      let response = await fetch(`${host}/Article/Publish`, {
        headers: {"Authorization": `Bearer ${getToken()}`},
        method: "post",
        body: formData
      });
      let that = this;
      await handleResponse(response, () => that.publishing = false);
      this.success("保存成功，正在跳转文章列表");
      this.publishing = false;
      await this.router.push({name: "article"});
    },
    cancel() {
      this.router.push({name: "article"});
    },
    warning(message) {
      this.notifier.toastWarning(message, {toastProps: {location: "top center"}});
    },
    success(message) {
      this.notifier.toastSuccess(message, {toastProps: {location: "top center"}})
    },
  }
}
</script>

<template>
  <v-skeleton-loader :loading="loading"  type="paragraph" style="width: 100%">
    <form @submit.prevent="publish" style="width: 100%">
      <v-text-field
          label="标题"
          v-model="article.title"
      ></v-text-field>
      <v-select
          v-model="article.tags"
          :items="tags"
          multiple
          label="标签"
      ></v-select>
      <v-text-field
          v-model="article.newTag"
          name="newTag"
          label="添加标签"
          placeholder="标签"
      ></v-text-field>
      <v-textarea
          v-model="article.introduction"
          name="introduction"
          label="文章简介"
          placeholder="标签"></v-textarea>
      <v-checkbox

          value="1"
          label="Option"
          type="checkbox"
      ></v-checkbox>
      <md-editor
          theme="dark"
          v-model="article.markdown"
          :toolbars="toolbars"
          @onUploadImg="uploadImage"
          @onHtmlChanged="onHtmlChanged"
      >
      </md-editor>
      <v-btn
          :loading="publishing"
          color="secondary"
          prepend-icon="mdi-publish"
          class="me-4"
          type="submit"
      >
        发布
      </v-btn>

      <v-btn color="info" prepend-icon="mdi-cancel" @click="cancel">
        取消
      </v-btn>
    </form>
  </v-skeleton-loader>
</template>

<style scoped>

</style>