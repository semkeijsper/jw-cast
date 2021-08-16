import Vue from 'vue';
import VueRouter, { RouteConfig } from 'vue-router';

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: '/:language',
    name: 'Home',
  },
  {
    path: '/',
    redirect: () => `/${navigator.language.split('-')[0]}` ?? 'nl',
  },
];

const router = new VueRouter({
  routes,
});

export default router;
