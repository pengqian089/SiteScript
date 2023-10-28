<script>
import {
  VDataTable,
  VDataTableServer,
  VDataTableVirtual,
} from "vuetify/labs/VDataTable";
import {host, handleResponse, getToken} from "../../common";
import {useRouter} from 'vue-router';
import dayjs from "dayjs";
import {useNotifier} from "vuetify-notifier";

export default {
  components: {
    VDataTable,
    VDataTableServer,
    VDataTableVirtual,
  },
  data: () => ({
    router: useRouter(),
    notifier: useNotifier(),
    headers: [
      {title: "标题", align: "start", sortable: false, key: "title"},
      {title: "预览", align: "start", sortable: false, key: "preview"},
      {title: "查看量", align: "start", sortable: false, key: "viewCount"},
      {title: "标签", align: "start", sortable: false, key: "tags"},
      {title: "回复量", align: "start", sortable: false, key: "commentCount"},
      {title: "最后修改时间", align: "start", sortable: false, key: "lastUpdateTime"},
      {title: "操作", align: "start", sortable: false, key: "actions"},
    ],
    itemsPage: [
      {value: 10, title: '10'},
      {value: 20, title: '25'},
      {value: 30, title: '50'},
      {value: 50, title: '100'},
    ],
    pageIndex: 1,
    list: [],
    total: 0,
    pageSize: 20,
    title: "",
    tag: "",
    loading: true,
    host: host
  }),
  methods: {
    /**
     * 加载文章列表
     * */
    async loadArticles({page, itemsPerPage}) {
      this.pageIndex = page;
      this.pageSize = itemsPerPage;
      this.loading = true;
      let response = await fetch(`${host}/Article/MyArticle?pageIndex=${this.pageIndex}&pageSize=${this.pageSize}&title=${encodeURIComponent(this.title)}&tag=${encodeURIComponent(this.tag)}`, {
        headers: {
          "Authorization": `Bearer ${getToken()}`
        }
      });
      let result = await handleResponse(response);
      for (let item of result.list) {
        item.lastUpdateTime = dayjs(item.lastUpdateTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.createTime = dayjs(item.createTime).format("YYYY年MM月DD日 HH:mm:ss");
        item.tag = item.tags.join(";");
        item.isLocalTime = true;
      }
      this.list = result.list;
      //this.pageIndex = result.currentPage;
      this.total = result["totalCount"];
      this.loading = false;
    },
    editItem(item) {
      this.router.push({name: `edit-article`, params: {id: item.id}});
    },
    async deleteItem(item) {
      //await Dialog.confirm({title: "提示", message: `删除后不可恢复，确定要删除《${item.title}》吗？`});
      let result = await this.notifier.confirm(`删除后不可恢复，确定要删除《${item.title}》吗？`);
      if (result !== true) return;
      this.showDelete = true;
      let formData = new FormData();
      formData.append("id", item.id);
      let response = await fetch(`${host}/Article/Delete`, {
        method: "post",
        body: formData,
        headers:{
          "Authorization": `Bearer ${getToken()}`,
        }
      });
      let that = this;
      await handleResponse(response, () => that.showDelete = false);
      this.showDelete = false;
      await this.loadArticles({page: 1, itemsPerPage: this.pageSize});
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
      @update:options="loadArticles">
    <template v-slot:item.title="{item}">
      <a :href="host + '/article/read/' + item.id + '.html'" target="_blank">{{ item.title }}</a>
    </template>
    <template v-slot:item.preview="{item}">
      <v-btn prepend-icon="mdi-eye" color="secondary" size="small" class="me-2">
        预览
      </v-btn>
    </template>
    <template v-slot:item.actions="{ item }">
      <v-btn prepend-icon="mdi-pencil" color="primary" size="small" class="me-2" @click="editItem(item)">
        编辑
      </v-btn>
      <v-btn prepend-icon="mdi-delete" color="error" size="small" @click="deleteItem(item)">
        删除
      </v-btn>
    </template>
  </v-data-table-server>
</template>

<style scoped>
a {
  color: #25ccbb;
  text-decoration: none;
}

a:hover {
  color: #44f2ff;
  text-decoration: underline;
}
</style>