import Vue from 'vue';
import { sync } from 'vuex-router-sync';

import App from './App.vue';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
import './plugins/swiper';
import './plugins/video-player';

sync(store, router);
Vue.config.productionTip = false;

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App),
}).$mount('#app');
