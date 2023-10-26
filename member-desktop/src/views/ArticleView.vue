<script>
import {
  VDataTable,
  VDataTableServer,
  VDataTableVirtual,
} from "vuetify/labs/VDataTable";
import {host,handleResponse} from "../../common";
import dayjs from "dayjs";

export default {
  components: {
    VDataTable,
    VDataTableServer,
    VDataTableVirtual,
  },
  data: () => ({
    headers: [
      {title: "标题", align: "start", key: "title"},
      {title: "预览", align: "start", key: "preview"},
      {title: "查看量", align: "start", key: "viewCount"},
      {title: "标签", align: "start", key: "tags"},
      {title: "回复量", align: "start", key: "commentCount"},
      {title: "回复量", align: "start", key: "commentCount"},
      {title: "最后修改时间", align: "start", key: "lastUpdateTime"},
      {title: "操作", align: "start", key: "action"},
    ],
    pageIndex: 1,
    list: [],
    total: 0,
    pageSize: 20,
    title: "",
    tag: "",
    loading: true,

  }),
  methods: {
    /**
     * 加载文章列表
     * */
    async loadArticles() {
      this.loading = true;
      let response = await fetch(`${host}/Article/MyArticle?pageIndex=${this.pageIndex}&title=${encodeURIComponent(this.title)}&tag=${encodeURIComponent(this.tag)}`);
      let result = await handleResponse(response);
      for (let item of result.list) {
        item.lastUpdateTime = dayjs(item.lastUpdateTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.createTime = dayjs(item.createTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.tag = item.tags.join(";");
        item.isLocalTime = true;
      }
      this.list = result.list;
      this.pageIndex = result.currentPage;
      this.total = result["totalCount"];
      this.loading = false;
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
      @update:options="loadArticles"
  ></v-data-table-server>
</template>

<style scoped>

</style>