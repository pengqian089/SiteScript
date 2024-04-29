<script>
import {host, handleResponse, getToken, fetchGetAsync} from "../common";
import {useRoute, useRouter} from 'vue-router';
import dayjs from "dayjs";

export default {
  data: () => ({
    rows: [],
    columns: [
      {label: "标题", align: "center", name: "title", field: "title"},
      {label: "查看量", align: "center", name: "viewCount", field: "viewCount"},
      {label: "标签", align: "center", name: "tags", field: "tags"},
      {label: "回复量", align: "center", name: "commentCount", field: "commentCount"},
      {label: "最后修改时间", align: "center", name: "lastUpdateTime", field: "lastUpdateTime"},
      {label: "操作", align: "center", name: "actions", field: "actions"},
    ],
    pageIndex: 1,
    initialPagination: {
      sortBy: 'desc',
      descending: false,
      page: 1,
      rowsPerPage: 15,
      rowsNumber: 0
    },
    title: "",
    tag: "",
    tags: [],
    loading: true,
  }),
  async mounted() {
    await this.loadTags();
    await this.loadArticles();
  },
  methods: {
    /**
     * 加载文章列表
     * */
    async loadArticles() {
      // this.pageIndex = page;
      // this.pageSize = itemsPerPage;
      this.loading = true;
      let result = await fetchGetAsync({
        url: "/Article/MyArticle",
        parameters: [
          {name: "pageIndex", value: this.initialPagination.page},
          {name: "pageSize", value: this.initialPagination.rowsPerPage},
          {name: "title", value: this.title},
          {name: "tag", value: this.tag},
        ]
      });
      for (let item of result.list) {
        item.lastUpdateTime = dayjs(item.lastUpdateTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.createTime = dayjs(item.createTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.tag = item.tags.join(";");
        item.isLocalTime = true;
      }
      this.rows = result.list;
      this.initialPagination.page = result["currentPage"];
      this.initialPagination.rowsNumber = result["totalCount"];
      this.loading = false;
    },
    editItem(item) {
      this.router.push({name: `edit-article`, params: {id: item.id}});
    },
    async deleteItem(item) {
      let result = await this.notifier.confirm(`删除后不可恢复，确定要删除《${item.title}》吗？`);
      if (result !== true) return;
      this.showDelete = true;
      let formData = new FormData();
      formData.append("id", item.id);
      let response = await fetch(`${host}/Article/Delete`, {
        method: "post",
        body: formData,
        headers: {
          "Authorization": `Bearer ${getToken()}`,
        }
      });
      let that = this;
      await handleResponse(response, () => that.showDelete = false);
      this.showDelete = false;
      await this.loadArticles({page: 1, itemsPerPage: this.pageSize});
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
    async reset() {
      this.tag = "";
      this.title = "";
      await this.loadArticles({page: 1, itemsPerPage: this.pageSize});
    },
    publish() {
      this.router.push({name: `edit-article`});
    },
    test() {

    }
  },
}
</script>

<template>
  <div class="q-pa-md">
    <q-table
      :rows="rows"
      :columns="columns"
      :loading="loading"
      @request="loadArticles"
      :pagination="initialPagination"
      row-key="name"
    />
  </div>
</template>

<style scoped>

</style>
