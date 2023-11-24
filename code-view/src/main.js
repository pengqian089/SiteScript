
import { Quasar } from 'quasar'
import App from './App.vue'
import zh from 'quasar/lang/zh-CN'
import {createApp} from "vue";

const app = createApp(App);
app.use(Quasar, {
  lang: zh
})
