import {createApp} from 'vue'
import {createPinia} from 'pinia'
// Vuetify
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import VuetifyNotifier from 'vuetify-notifier'

import App from './App.vue'
import router from './router'

const vuetify = createVuetify({
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    components,
    directives,
    theme: {
        defaultTheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
});
const app = createApp(App)

app.use(vuetify);
app.use(VuetifyNotifier, {
    default: {
        defaultColor: 'primary',
        closeIcon: 'mdi-close',
    },
    dialogOptions:{
        primaryButtonText: '确定',
        secondaryButtonText: '取消',
    }
});
app.use(createPinia());
app.use(router);

app.mount('#app');
