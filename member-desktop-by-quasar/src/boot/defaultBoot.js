import {boot} from "quasar/wrappers";
import {
  Quasar, Dialog, Notify
} from 'quasar';

import langZh from "quasar/lang/zh-CN"

export default boot(async ({app, router, store}) => {
  app.use(Quasar, {
    //dark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    plugins: {Dialog, Notify},
    lang: langZh
  });
});
