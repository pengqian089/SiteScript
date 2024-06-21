<script>
import Prism from "prismjs"
import {getToken, handleResponse, host} from "../../common";
export default {
  props: {
    code: String,
    language: String
  },
  mounted() {



    Prism.highlightAll();
  },
  data: () => ({}),
  methods:{
    /**
     * 加载文章详情
     * */
    async loadArticle() {
      let response = await fetch(`${host}/Article/Detail/${this.id}`, {
        headers: {"Authorization": `Bearer ${getToken()}`}
      });
      this.article = await handleResponse(response);
    },
  }
}
</script>

<template>
  <pre><code :class="'language-'+ language +' line-numbers match-braces'">{{ code }}</code></pre>
</template>

<style scoped>

</style>