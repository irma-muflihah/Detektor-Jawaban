<template>
  <v-app :theme="isDark ? 'dark' : 'light'">
    <v-navigation-drawer permanent color="secondary" theme="dark" class="border-0" rail expand-on-hover>
      <v-list>
        <v-list-item class="py-4" nav>
          <template v-slot:prepend>
            <div class="bg-primary rounded d-flex align-center justify-center text-white" style="width: 36px; height: 36px; margin-right: 16px;">
              <v-icon size="24">mdi-camera-iris</v-icon>
            </div>
          </template>
          <v-list-item-title class="font-weight-black text-white text-h6" style="letter-spacing: 2px;">DEJAMU</v-list-item-title>
        </v-list-item>
      </v-list>
      <v-divider class="mb-2"></v-divider>

      <v-list nav class="px-2" bg-color="transparent" active-class="custom-active-item">
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dasbor" to="/" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-draw-pen" title="Desain" to="/designer" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-printer-3d" title="Simulasi" to="/simulator" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-text-recognition" title="Pindai" to="/scanner" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-database-eye" title="Hasil" to="/results" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-file-percent" title="Nilai" to="/nilai" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-chart-box-outline" title="Analisis" to="/analisis" rounded="lg" class="mb-1"></v-list-item>
      </v-list>
      

    </v-navigation-drawer>

    <v-app-bar color="surface" elevation="0" class="border-b">


      <v-spacer></v-spacer>
      
      <!-- Tombol Unduh PDF (Tampil di Desainer) & Status AI (Tampil di Pemindai) -->
      <v-btn 
        v-if="currentRouteName === 'Desain'" 
        color="secondary" 
        variant="tonal" 
        prepend-icon="mdi-printer" 
        class="mr-2 text-none font-weight-bold rounded-lg" 
        @click="printPage"
      >
        Cetak
      </v-btn>
      <v-btn 
        v-if="currentRouteName === 'Desain'" 
        color="primary" 
        variant="flat" 
        prepend-icon="mdi-file-pdf-box" 
        class="mr-4 text-none font-weight-bold rounded-lg" 
        @click="showPdfDialog = true"
      >
        Unduh
      </v-btn>

      <v-btn icon @click="toggleTheme" class="mr-2"><v-icon>{{ isDark ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny' }}</v-icon></v-btn>
    </v-app-bar>

    <v-main class="bg-background">
      <router-view></router-view>
    </v-main>

    <v-dialog v-model="showPdfDialog" max-width="400" persistent>
      <v-card class="rounded-xl pa-2">
        <v-card-title class="font-weight-bold">Opsi Ekspor PDF</v-card-title>
        <v-card-text>
          <p class="text-body-2 mb-4 text-grey-darken-1">Tentukan berapa banyak salinan halaman LJK yang ingin Anda hasilkan di dalam file PDF ini.</p>
          <v-text-field 
            v-model.number="pdfCopies" 
            label="Jumlah Salinan Halaman" 
            type="number" 
            min="1" 
            max="1000"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" class="text-none font-weight-bold rounded-lg mr-2" @click="showPdfDialog = false">Batal</v-btn>
          <v-btn color="primary" variant="flat" class="text-none font-weight-bold rounded-lg px-4" @click="downloadPDF" :loading="isDownloading">Mulai Ekspor</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="omrStore.snackbar.show" :color="omrStore.snackbar.color" :timeout="3500" location="bottom right">
      <span class="font-weight-medium">{{ omrStore.snackbar.text }}</span>
      <template v-slot:actions><v-btn variant="text" icon="mdi-close" @click="omrStore.snackbar.show = false"></v-btn></template>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useOmrStore } from './store/omrStore';
import { exportSvgToPdf } from './utils/pdfExport';

const isDark = ref(false);
const showPdfDialog = ref(false);
const pdfCopies = ref(2);
const isDownloading = ref(false);

const cvReady = ref(false);
const omrStore = useOmrStore();
const route = useRoute();

const currentRouteName = computed(() => route.name);

const toggleTheme = () => {
  isDark.value = !isDark.value;
};

const downloadPDF = async () => {
  const svgEl = document.querySelector('.canvas-container svg') as SVGSVGElement;
  if (!svgEl) {
    omrStore.showToast("Tidak ada LJK yang sedang didesain", "warning");
    showPdfDialog.value = false;
    return;
  }
  
  if (pdfCopies.value < 1) pdfCopies.value = 1;
  
  isDownloading.value = true;
  const fileName = omrStore.activeTemplate.name 
    ? `LJK_${omrStore.activeTemplate.name.replace(/\s+/g, '_')}.pdf`
    : 'LJK_Template.pdf';
    
  await exportSvgToPdf(svgEl, fileName, pdfCopies.value);
  isDownloading.value = false;
  showPdfDialog.value = false;
};

const printPage = () => {
  window.print();
};

onMounted(() => {
  if ((window as any).cvLoaded) {
    cvReady.value = true;
  } else {
    // Basic polling to check if OpenCV loaded
    const interval = setInterval(() => {
      if ((window as any).cvLoaded) {
        cvReady.value = true;
        clearInterval(interval);
      }
    }, 500);
  }
});
</script>

<style>
.custom-active-item {
  background: transparent !important;
  color: #3b82f6 !important;
}
.custom-active-item .v-icon {
  color: #3b82f6 !important;
}
.custom-active-item .v-list-item__overlay {
  opacity: 0 !important;
}
.v-list-item:hover .v-list-item__overlay {
  opacity: 0.04 !important;
}
</style>
