export default [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      {
        name: 'Login',
        path: '/login',
        component: () => import('@/pages/Login.vue'),
        meta: {
          hideBackButton: true,
          centered: true,
        },
      },
    ],
  },
]
