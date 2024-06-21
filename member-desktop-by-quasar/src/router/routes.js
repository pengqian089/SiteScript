const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      {
        path:"article",
        component:() => import("pages/ArticlePage.vue"),
      },
      {
        path: 'article/edit/:id?',
        name: "edit-article",
        component:() => import("pages/EditArticlePage.vue"),
        meta: {
          title: "编辑文章"
        }
      },
      {
        path: 'dynamic-pages',
        name: "dynamic-pages",
        component:() => import("pages/DynamicPage.vue"),
        meta: {
          title: "动态页"
        }
      },
      {
        path: 'save-dynamic-page/:id?',
        name: "save-dynamic-page",
        component:() => import("pages/SaveDynamicPage.vue"),
        meta: {
          title: "保存动态页"
        }
      }
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
