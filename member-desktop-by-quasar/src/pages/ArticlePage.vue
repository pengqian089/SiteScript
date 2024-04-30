<script>
import {host, handleResponse, getToken, fetchGetAsync,success} from "../common";
import {useQuasar} from 'quasar';
import {useRoute, useRouter} from 'vue-router';
import dayjs from "dayjs";

export default {
  data: () => ({
    $q: useQuasar(),
    rows: [],
    columns: [
      {label: "标题", align: "center", name: "title", field: "title"},
      {label: "查看量", align: "center", name: "viewCount", field: "viewCount"},
      {label: "标签", align: "center", name: "tags", field: "tags", format: (x) => x.join(";")},
      {
        label: "回复量",
        align: "center",
        name: "commentCount",
        field: "commentCount",
        format: (x) => dayjs(x).format("YYYY年MM月DD日 HH:mm:ss")
      },
      {
        label: "最后修改时间",
        align: "center",
        name: "lastUpdateTime",
        field: "lastUpdateTime",
        format: (x) => dayjs(x).format("YYYY年MM月DD日 HH:mm:ss")
      },
      {label: "操作", align: "center", name: "actions", field: "actions"},
    ],
    router: useRouter(),
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
    loading: true
  }),
  async mounted() {
    await this.loadTags();
    this.$refs.tableRef?.requestServerInteraction()
  },
  methods: {
    /**
     * 加载文章列表
     * */
    async loadArticles(props) {
      console.log(props);
      // this.pageIndex = page;
      // this.pageSize = itemsPerPage;
      const {page, rowsPerPage} = props.pagination;
      this.loading = true;
      let result = await fetchGetAsync({
        url: "/Article/MyArticle",
        parameters: [
          {name: "pageIndex", value: page},
          {name: "pageSize", value: rowsPerPage},
          {name: "title", value: this.title},
          {name: "tag", value: this.tag},
        ]
      });
      // console.log("data", result);
      // console.log("before", this.rows);
      this.rows.splice(0, this.rows.length, ...result.list);
      //console.log("after", this.rows);
      this.initialPagination = {
        sortBy: 'desc',
        descending: false,
        page: result["currentPage"],
        rowsPerPage: 15,
        rowsNumber: result["totalCount"]
      };
      this.loading = false;
    },
    editItem(item) {
      success(`to edit ${item.id}`);
      this.router.push({name: `edit-article`, params: {id: item.id}});
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
    async reset() {
      this.tag = "";
      this.title = "";
      await this.loadArticles({page: 1, rowsPerPage: this.pageSize});
    },
    publish() {
      this.router.push({name: `edit-article`});
    },
  },
}
</script>

<template>
  <div class="q-pa-md">
    <q-table
      ref="tableRef"
      row-key="id"
      :rows="rows"
      :columns="columns"
      :loading="loading"
      :grid="$q.screen.lt.md"
      @request="loadArticles"
      v-model:pagination="initialPagination"
    >
      <template v-slot:top>
        <q-input dense style="width: 300px" v-model="title" placeholder="标题">
        </q-input>
        <q-select dense style="width: 300px" v-model="tag" label="标签" :options="tags"></q-select>
        <q-btn color="primary" icon-right="search" label="查询"/>
      </template>
      <template v-slot:body-cell-actions="props">
        <q-td key="id">
          <q-btn color="primary" icon="edit" size="sm" label="编辑" @click="editItem(props.row)"/>
          <span v-if="$q.screen.lt.md" style="display: block;"></span>
          <span v-else  style="margin-left: 1em"></span>
          <q-btn color="red" icon="delete" size="sm" label="删除" @click="deleteItem(props.row)"/>
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<style scoped>

</style>
