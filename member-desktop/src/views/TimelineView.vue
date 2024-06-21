<script>
import {
  VDataTable,
  VDataTableServer,
  VDataTableVirtual,
} from "vuetify/labs/VDataTable";
import {fetchGetAsync} from "../../common";
import dayjs from "dayjs";
import Prism from "prismjs";
import {MdPreview} from "md-editor-v3";
import _ from "lodash";

export default {
  components: {
    VDataTable,
    VDataTableServer,
    VDataTableVirtual,
    MdPreview
  },
  data: () => ({
    headers: [
      {title: "标题", align: "start", sortable: false, key: "title"},
      {title: "内容", align: "start", sortable: false, key: "content"},
      {title: "预览", align: "start", sortable: false, key: "preview"},
      {title: "时间轴日期", align: "start", sortable: false, key: "date"},
      {title: "最后修改时间", align: "start", sortable: false, key: "lastUpdateTime"},
      {title: "操作", align: "start", sortable: false, key: "actions"},
    ],
    content: "",
    list: [],
    pageIndex: 0,
    pageSize: 20,
    total: 0,
    loading: false,
    htmlPreviewContent: "",
    dialog: false
  }),
  updated() {
    Prism.highlightAll();
  },
  methods: {
    /**
     * 加载时间轴列表
     * */
    async loadTimeline({page, itemsPerPage}) {
      this.pageIndex = page;
      this.pageSize = itemsPerPage;
      this.loading = true;
      let data = await fetchGetAsync({
        url: `/Timeline/MyTimeline`,
        parameters: [
          {name: "pageIndex", value: this.pageIndex},
          {name: "pageSize", value: this.pageSize},
          {name: "content", value: this.content}
        ]
      });

      for (let item of data.list) {
        item.lastUpdateTime = dayjs(item.lastUpdateTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.createTime = dayjs(item.createTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.date = dayjs(item.date).format("YYYY年MM月DD日");
        item.isLocalTime = true;
      }
      this.list = data.list;
      this.total = data["totalCount"];
      this.loading = false;
    },
    async reset() {
      if(_.isEmpty(this.content)){
        return;
      }
      this.content = "";
      await this.loadTimeline({page: 1, itemsPerPage: this.pageSize});
    },
    publish() {
    },
    preview(item) {
      this.htmlPreviewContent = item.content;
      this.dialog = true;
    },
    closePreview() {
      this.htmlPreviewContent = "";
      this.dialog = false;
    },
    editTimeline() {
    },
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
      @update:options="loadTimeline">
    <template v-slot:top>
      <v-toolbar>
        <v-text-field
            hide-details
            label="内容"
            v-model="content"
        ></v-text-field>
        <v-spacer></v-spacer>

        <v-btn prepend-icon="mdi-magnify" color="primary" class="me-2"
               @click="loadTimeline({page:1,itemsPerPage:pageSize})">
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

    <template v-slot:item.content="{item}" style="width: 30em">
      <div>
        <pre><code class="language-markdown line-numbers match-braces">{{ item.content }}</code></pre>
      </div>
    </template>

    <template v-slot:item.preview="{item}">
      <v-btn prepend-icon="mdi-eye" color="secondary" size="small" class="me-2" @click="preview(item)">
        预览
      </v-btn>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-btn prepend-icon="mdi-pencil" color="primary" size="small" class="me-2" @click="editTimeline(item)">
        编辑
      </v-btn>
      <v-btn prepend-icon="mdi-delete" color="error" size="small" @click="">
        删除
      </v-btn>
    </template>
  </v-data-table-server>
  <v-dialog v-model="dialog" persistent max-width="50em">
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