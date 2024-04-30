const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: 'settings', component: () => import('pages/IndexPage.vue') },
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
