import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';
import Home from '../views/Home.vue';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/:language',
    name: 'Home',
    component: Home,
  },
  { path: '/', redirect: '/nl' },
];

const router = new VueRouter({
  routes,
});

export default router;
