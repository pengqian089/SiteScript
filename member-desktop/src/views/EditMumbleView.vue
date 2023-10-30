<script>
import {MdEditor} from "md-editor-v3";
import "md-editor-v3/lib/style.css";
import {useRoute, useRouter} from 'vue-router';
import {getToken, handleResponse, handleUploadResponse, host, toolbars, record, setNotifier} from "../../common";
import {useNotifier} from "vuetify-notifier";
import _ from "lodash";
import {VSkeletonLoader} from 'vuetify/labs/VSkeletonLoader';
import {ref} from "vue";

export default {
  components: {MdEditor, VSkeletonLoader},
  data: () => ({
    router: useRouter(),
    id: null,
    notifier: useNotifier(),
    mumble: {},
    publishing: false,
    loading: true,
    toolbars: toolbars,
    btnStartRecord: false,
    btnPlay: true,
    btnClear: true,
    btnUpload: true,
    btnStartRecordText: "开始录音",
    btnPlayText: "试听",
    playIcon: "mdi-play",
    editorRef : {},
  }),
  async mounted() {
    const {params} = useRoute();
    setNotifier(this.notifier);
    let id = params.id;
    if (!_.isEmpty(id)) {
      this.id = id;
      await this.loadMumble();
    }
    this.loading = false;
  },
  methods: {
    async loadMumble() {
      let response = await fetch(`${host}/Talk/Detail/${this.id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
      });
      this.mumble = await handleResponse(response);
    },
    async uploadImage(files, callback) {
      if (files.length <= 0) {
        this.warning("请选择图片");
        return;
      }
      let file = files[0];
      if (!file.type.startsWith("image")) {
        this.warning("请选择图片上传");
        return;
      }

      let formData = new FormData();
      formData.append("image", file);

      let response = await fetch(`${host}/Talk/Upload`,
          {
            method: "post",
            body: formData,
            headers: {"Authorization": `Bearer ${getToken()}`}
          });
      let url = await handleUploadResponse(response);
      callback([url]);
    },
    onHtmlChanged(html) {
      this.mumble.htmlContent = html;
    },
    async publish() {
      this.publishing = false;
      if (_.isEmpty(this.mumble.markdown)) {
        this.warning("请输入碎碎念正文");
        return;
      }
      if (_.isEmpty(this.mumble.htmlContent)) {
        this.warning("没有检测到正文");
        return;
      }

      let formData = new FormData();
      formData.append("id", this.id);
      formData.append("markdown", this.mumble.markdown);
      formData.append("html", this.mumble.htmlContent);

      let response = await fetch(`${host}/Talk/Publish`, {
        method: "post",
        body: formData,
        headers: {"Authorization": `Bearer ${getToken()}`}
      });
      await handleResponse(response);
      this.success("保存成功，正在跳转碎碎念列表");
      this.publishing = false;
      await this.router.push({name: "mumble"});
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
    getTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },
    /**
     * 开始录音
     * */
    async onRecord() {
      let that = this;
      if (this.btnStartRecordText === "开始录音") {
        await record.startRecord(() => {
          that.btnStartRecordText = "结束录音";
        });
      } else {
        record.endRecord(() => {
          that.btnStartRecord = true;
          that.btnPlay = false;
          that.btnClear = false;
          that.btnUpload = false;
          that.btnStartRecordText = "开始录音";
        });
      }

    },
    onTogglePlay() {
      let that = this;
      if (this.btnPlayText === "试听" || this.btnPlayText === "继续播放") {
        record.playAudio(() => {
          that.btnPlayText = "暂停";
          that.btnStartRecord = true;
          that.btnPlay = false;
          that.btnClear = true;
          that.btnUpload = true;
          that.playIcon = "mdi-pause";
        }, () => {
          that.btnPlayText = "试听";
          that.btnStartRecord = true;
          that.btnPlay = false;
          that.btnClear = false;
          that.btnUpload = false;
          that.playIcon = "mdi-play";
        });
      } else {
        record.pauseAudio(() => {
          that.btnPlayText = "继续播放";
          that.btnStartRecord = true;
          that.btnPlay = false;
          that.btnClear = true;
          that.btnUpload = true;
        });
      }
    },
    onClear() {
      let that = this;
      record.clearAudio(() => {
        that.btnStartRecord = false;
        that.btnPlay = true;
        that.btnClear = true;
        that.btnUpload = true;
      });
    },
    async onUploadAudio() {
      let that = this;
      let result = await record.uploadAudio(() => {
        that.btnStartRecord = false;
        that.btnPlay = true;
        that.btnClear = true;
        that.btnUpload = true;
      });


      this.editorRef?.value?.insert(() => {
        return {
          targetValue: `<audio controls src="${result["accessUrl"]}" preload="metadata"></audio>`,
          select: true,
          deviationStart: 0,
          deviationEnd: 0
        };
      });

      console.log(result);
    }
  }
}
</script>

<template>
  <v-skeleton-loader :loading="loading" type="paragraph" style="width: 100%">
    <form @submit.prevent="publish" style="width: 100%">
      <v-toolbar>
        <v-btn :disabled="btnStartRecord" prepend-icon="mdi-radio" color="primary" class="me-2" @click="onRecord">
          {{ btnStartRecordText }}
        </v-btn>
        <v-btn :disabled="btnPlay" :prepend-icon="playIcon" color="primary" class="me-2" @click="onTogglePlay">
          {{ btnPlayText }}
        </v-btn>
        <v-btn :disabled="btnClear" prepend-icon="mdi-restore" color="primary" class="me-2" @click="onClear">
          清除录音
        </v-btn>
        <v-btn :disabled="btnUpload" prepend-icon="mdi-cloud" color="primary" class="me-2" @click="onUploadAudio">
          上传录音
        </v-btn>
      </v-toolbar>
      <md-editor
          :theme="getTheme()"
          v-model="mumble.markdown"
          :toolbars="toolbars"
          @onUploadImg="uploadImage"
          @onHtmlChanged="onHtmlChanged"
      >
      </md-editor>
      <v-btn
          :loading="publishing"
          :ref="editorRef"
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