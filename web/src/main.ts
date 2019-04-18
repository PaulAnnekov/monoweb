import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import Loader from '@/components/Loader.vue';
import './registerServiceWorker';
import VueTheMask from 'vue-the-mask';
import SecurityCode from 'vue-security-code';

Vue.config.productionTip = false;

Vue.use(VueTheMask);
Vue.component('loader', Loader);
Vue.component('security-code', SecurityCode);

new Vue({
  router,
  store,
  render: (h) => h(App),
}).$mount('#app');
