import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import vuetify from './plugins/vuetify';
import '@mdi/font/css/materialdesignicons.css';
import 'vuetify/styles';
import './style.css';

// Redam peringatan jinak ResizeObserver loop dari peramban
const isResizeObserverError = (msg: unknown) => {
  if (!msg) return false;
  const str = String(msg);
  return (
    str.includes('ResizeObserver loop') ||
    str.includes('undelivered notifications')
  );
};

window.addEventListener('error', (e) => {
  if (isResizeObserverError(e.message) || isResizeObserverError(e.error?.message)) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (isResizeObserverError(e.reason?.message) || isResizeObserverError(e.reason)) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount('#app');
