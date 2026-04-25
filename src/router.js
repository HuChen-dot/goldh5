import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('./views/LoginView.vue')
  },
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomeView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/buy',
    name: 'Buy',
    component: () => import('./views/BuyView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/sell',
    name: 'Sell',
    component: () => import('./views/SellView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/records',
    name: 'Records',
    component: () => import('./views/RecordsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('./views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && localStorage.getItem('isLoggedIn') !== 'true') {
    next('/login')
  } else {
    next()
  }
})

export default router
