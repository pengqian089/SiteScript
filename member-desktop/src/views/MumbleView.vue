<script>
import {
  VDataTable,
  VDataTableServer,
  VDataTableVirtual,
} from "vuetify/labs/VDataTable";
import {host, handleResponse, getToken} from "../../common";
import dayjs from "dayjs";
import {useNotifier} from "vuetify-notifier";
import {useRoute, useRouter} from 'vue-router';
import Prism from "prismjs";
import {MdPreview} from "md-editor-v3";

export default {
  components: {
    VDataTable,
    VDataTableServer,
    VDataTableVirtual,
    MdPreview
  },
  data: () => ({
    router: useRouter(),
    notifier: useNotifier(),
    headers: [
      {title: "Markdown", align: "start", sortable: false, key: "markdown"},
      {title: "Html预览", align: "start", sortable: false, key: "htmlContent"},
      {title: "点赞数", align: "start", sortable: false, key: "like"},
      {title: "回复量", align: "start", sortable: false, key: "commentCount"},
      {title: "创建时间\n", align: "start", sortable: false, key: "createTime"},
      {title: "最后修改时间", align: "start", sortable: false, key: "lastUpdateTime"},
      {title: "操作", align: "start", sortable: false, key: "actions"},
    ],
    pageIndex: 1,
    list: [],
    total: 0,
    pageSize: 20,
    content: "",
    loading: true,
    host: host,
    dialog: false,
    htmlPreviewContent: ""
  }),
  updated() {
    Prism.highlightAll();
  },
  methods: {
    /**
     * 加载碎碎念列表
     * */
    async loadMumble({page, itemsPerPage}) {
      this.pageIndex = page;
      this.pageSize = itemsPerPage;
      this.loading = true;
      let response = await fetch(`${host}/Talk/MyTalk?pageIndex=${this.pageIndex}&pageSize=${this.pageSize}&content=${encodeURIComponent(this.content)}`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      let result = await handleResponse(response);
      for (let item of result.list) {
        item.lastUpdateTime = dayjs(item.lastUpdateTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.createTime = dayjs(item.createTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.isLocalTime = true;
      }
      this.list = result.list;
      this.total = result["totalCount"];
      this.loading = false;
    },
    /**
     * 展示碎碎念markdown内容
     * */
    showMarkdown(mumble) {
      mumble.isShowMk = mumble.isShowMk ? !mumble.isShowMk : true;
    },
    /**
     * 导航到编辑碎碎念
     * */
    editMumble(mumble) {
      this.$router.push({name: "edit-mumble", params: {id: mumble.id}});
    },
    /**
     * 删除碎碎念
     * */
    async deleteMumble(mumble) {
      let result = await this.notifier.confirm("删除后不可恢复，确定要删除吗？");
      if (result !== true) return;

      this.showDelete = true;
      let formData = new FormData();
      formData.append("id", mumble.id);
      let response = await fetch("/Talk/Delete", {
        method: "post",
        body: formData
      });
      let that = this;
      await handleResponse(response, () => that.showDelete = false);
      this.notifier.toastSuccess("删除成功");
      await this.loadMumble();
      this.showDelete = false;
    },
    async reset() {
      this.content = "";
      await this.loadMumble({page: 1, itemsPerPage: this.pageSize});
    },
    publish() {

    },
    preview(item) {
      this.htmlPreviewContent = item.markdown;
      this.dialog = true;
    },
    closePreview(){
      this.htmlPreviewContent = "";
      this.dialog = false;
    }
  }
}

</script>

<template>
  <v-data-table-server
      v-model:items-per-page="pageSize"
      :headers="headers"
      :items-length="total"
      :items="list"
      :loading="loading"
      class="elevation-1"
      item-value="name"
      hover
      items-per-page-text="每页数量"
      loading-text="加载中..."
      page-text="$vuetify.dataFooter.pageText"
      @update:options="loadMumble">
    <template v-slot:top>
      <v-toolbar>
        <v-text-field
            hide-details
            label="内容"
            v-model="content"
        ></v-text-field>
        <v-spacer></v-spacer>

        <v-btn prepend-icon="mdi-magnify" color="primary" class="me-2"
               @click="loadMumble({page:1,itemsPerPage:pageSize})">
          查询
        </v-btn>
        <v-btn prepend-icon="mdi-restore" color="primary" class="me-2" @click="reset">
          重置
        </v-btn>
        <v-btn prepend-icon="mdi-new-box" color="primary" class="me-2" @click="publish">
          发布碎碎念
        </v-btn>

      </v-toolbar>
    </template>

    <template v-slot:item.markdown="{item}" style="width: 30em">
      <div>
        <pre><code class="language-markdown line-numbers match-braces">{{ item.markdown }}</code></pre>
      </div>
    </template>

    <template v-slot:item.htmlContent="{item}">
      <v-btn prepend-icon="mdi-eye" color="secondary" size="small" class="me-2" @click="preview(item)">
        预览
      </v-btn>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-btn prepend-icon="mdi-pencil" color="primary" size="small" class="me-2" @click="">
        编辑
      </v-btn>
      <v-btn prepend-icon="mdi-delete" color="error" size="small" @click="">
        删除
      </v-btn>
    </template>
  </v-data-table-server>
  <v-dialog v-model="dialog" max-width="50em">
    <v-card>
      <v-card-title>
        <span class="text-h5">HTML预览</span>
      </v-card-title>

      <v-card-text>
        <v-container>
          <md-preview theme="dark" :modelValue="htmlPreviewContent"></md-preview>
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
            color="blue-darken-1"
            variant="text" @click="closePreview">
          确认
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
div pre {
  max-width: 30em;
  white-space: pre-wrap
}
</style>