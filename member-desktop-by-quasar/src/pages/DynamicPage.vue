<script>

import {useQuasar} from "quasar";
import dayjs from "dayjs";
import {useRouter} from "vue-router";
import {fetchGetAsync, getToken, handleResponse, host, success} from "src/common";
import Prism from "prismjs";

export default {
  data: () => ({
    title: "Dynamic Page",
    $q: useQuasar(),
    site: document.querySelector("meta[name='site']")?.getAttribute("content"),
    rows: [],
    columns: [
      {label: "页面名称", align: "center", name: "id", field: "id"},
      {label: "预览", align: "center", name: "preview", field: "preview"},
      {label: "类型", align: "center", name: "contentTypeStr", field: "contentTypeStr"},
      {
        label: "创建时间",
        align: "center",
        name: "createTime",
        field: "createTime",
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
    name: "",
    tag: "",
    tags: [],
    loading: true
  }),
  mounted() {
    this.$refs.tableRef?.requestServerInteraction()
  },
  methods: {
    /**
     * 加载文章列表
     * */
    async loadDynamicPages(props) {
      const {page, rowsPerPage} = props.pagination || {page: 1, rowsPerPage: 15};
      this.loading = true;
      let result = await fetchGetAsync({
        url: "/Dynamic/MyDynamicPages",
        parameters: [
          {name: "pageIndex", value: page},
          {name: "pageSize", value: rowsPerPage},
          {name: "name", value: this.name},
        ]
      });
      this.rows.splice(0, this.rows.length, ...result.list);
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
      this.router.push({name: 'save-dynamic-page', params: {id: item.id}});
    },
    async deleteItem(item) {
      let that = this;
      this.$q.dialog({
        message: `删除后不可恢复，确定要删除[${item.id}]吗？`,
        cancel: true,
        persistent: true
      }).onOk(async () => {
        // todo
        // that.showDelete = true;
        // let formData = new FormData();
        // formData.append("id", item.id);
        // let response = await fetch(`${host}/Article/Delete`, {
        //   method: "post",
        //   body: formData,
        //   headers: {
        //     "Authorization": `Bearer ${getToken()}`,
        //   }
        // });
        // await handleResponse(response, () => that.showDelete = false);
        // that.showDelete = false;
        // await this.loadDynamicPages({query: true});
      });
    },
    publish() {
      this.router.push({name: 'save-dynamic-page', params: {id: ''}});
    },
    async reset() {
      this.name = "";
      await this.loadDynamicPages({query: true});
    },
  },
  updated() {
    Prism.highlightAll();
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
      @request="loadDynamicPages"
      v-model:pagination="initialPagination"
    >
      <template v-slot:top>
        <q-btn color="primary" flat round dense icon="publish" title="发布新页面" @click="publish"/>
        <q-space/>
        <q-input dense style="width: 300px" v-model="name" placeholder="页面名称" label="页面名称">
        </q-input>
        <q-btn color="primary" class="q-ml-md" icon-right="search" label="查询"
               @click="loadDynamicPages({query:true})"/>
        <q-btn color="purple" class="q-ml-md" icon-right="restart_alt" label="重置" @click="reset"/>
      </template>
      <template v-slot:header="props">
        <q-tr :props="props">
          <q-th auto-width/>
          <q-th
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            {{ col.label }}
          </q-th>
        </q-tr>
      </template>
      <template v-slot:body="props">
        <q-tr :props="props">
          <q-td auto-width>
            <q-btn size="sm" color="accent" round dense @click="props.expand = !props.expand"
                   :icon="props.expand ? 'remove' : 'add'"/>
          </q-td>
          <q-td
            v-for="col in props.cols"
            :key="col.name"
            :props="props"
          >
            <a v-if="col.name === 'preview'" class="preview" :href="site + '/act/' + props.row.id" target="_blank">预览</a>
            <div v-else-if="col.name === 'actions'" style="margin: 0 auto;text-align:center">
              <q-btn color="primary" icon="edit" size="sm" label="编辑" @click="editItem(props.row)"/>
              <span v-if="$q.screen.lt.md" style="display: block;"></span>
              <span v-else style="margin-left: 1em"></span>
              <q-btn color="red" icon="delete" size="sm" label="删除" @click="deleteItem(props.row)"/>
            </div>
            <span v-else>{{ col.value }}</span>
          </q-td>
        </q-tr>
        <q-tr v-show="props.expand" :props="props">
          <q-td colspan="100%">
            <pre><code class="language-html">{{ props.row.content }}</code></pre>
          </q-td>
        </q-tr>
      </template>
    </q-table>
  </div>
</template>

<style scoped>
pre {
  max-height: 500px;
  overflow: auto;
}

.preview {
  color: var(--q-primary);
}

.preview:hover{
  color:var(--q-secondary);
}
</style>
