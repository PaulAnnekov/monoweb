import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Loader from '@/components/Loader.vue';
import './registerServiceWorker';

Vue.config.productionTip = false;

Vue.component('loader', Loader);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
