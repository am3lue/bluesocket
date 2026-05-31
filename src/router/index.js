import { createRouter, createWebHistory } from 'vue-router';
import { authState } from '../services/auth';

import Login from '../views/Login.vue';
import Chat from '../views/Chat.vue';
import Admin from '../views/Admin.vue';

const routes = [
  {
    path: '/',
    redirect: '/chat'
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: Chat
  },
  {
    path: '/admin',
    name: 'Admin',
    component: Admin
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (!to.meta.public && !authState.isAuthenticated) {
    next('/login');
  } else if (to.name === 'Login' && authState.isAuthenticated) {
    next('/chat');
  } else {
    next();
  }
});

export default router;
