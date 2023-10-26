import {createRouter, createWebHashHistory} from 'vue-router';
import SettingsView from '../views/SettingsView.vue';
import ArticleView from "../views/ArticleView.vue";
import MumbleView from "../views/MumbleView.vue";
import TimelineView from "../views/TimelineView.vue";


const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: SettingsView,
            meta: {
                title: "基本设置"
            }
        },
        {
            path: '/article',
            name: 'article',
            component: ArticleView,
            meta: {
                title: "我的文章列表"
            }
        },
        {
            path: '/mumble',
            name: 'mumble',
            component: MumbleView,
            meta: {
                title: "我的碎碎念列表"
            }
        },
        {
            path: '/timeline',
            name: 'timeline',
            component: TimelineView,
            meta: {
                title: "我的时间轴列表"
            }
        },
    ]
})

export default router
