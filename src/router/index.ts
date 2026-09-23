import { createRouter, createWebHistory } from 'vue-router';
import Dashbor from '../views/Dashbor.vue';
import Desain from '../views/Desain.vue';
import Pindai from '../views/Pindai.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashbor',
      component: Dashbor
    },
    {
      path: '/designer',
      name: 'Desain',
      component: Desain
    },
    {
      path: '/simulator',
      name: 'Simulator',
      component: () => import('../views/Simulator.vue')
    },
    {
      path: '/scanner',
      name: 'Pindai',
      component: Pindai
    },
    {
      path: '/kalibrasi',
      name: 'Kalibrasi',
      component: () => import('../views/Kalibrasi.vue')
    },
    {
      path: '/results',
      name: 'Hasil',
      component: () => import('../views/Hasil.vue')
    },
    {
      path: '/nilai',
      name: 'Nilai',
      component: () => import('../views/Nilai.vue')
    },
    {
      path: '/analisis',
      name: 'Analisis',
      component: () => import('../views/Analisis.vue')
    }
  ]
});

export default router;
