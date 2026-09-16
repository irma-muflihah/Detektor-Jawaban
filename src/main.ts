import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './style.css';

const resizeObserverLoopErrRE = /^[a-zA-Z0-9 ]*ResizeObserver loop [a-zA-Z0-9 ]*/;
window.addEventListener('error', (e) => {
  if (resizeObserverLoopErrRE.test(e.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount('#app');
