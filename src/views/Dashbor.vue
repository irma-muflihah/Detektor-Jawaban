<template>
  <v-container fluid class="pa-4 pa-md-6">
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="6">
        <h2 class="text-h4 font-weight-bold" style="color: #1e293b;">
          <v-icon start size="large" color="primary">mdi-folder-multiple</v-icon> Koleksi Templat
        </h2>
        <p class="text-subtitle-1 text-grey-darken-1">Kelola desain Lembar Jawab Komputer Anda.</p>
      </v-col>
      <v-col cols="12" md="6" class="text-md-right">
        <v-btn color="primary" prepend-icon="mdi-plus" size="large" class="rounded-lg font-weight-bold" @click="createNewTemplate">
          Buat Baru
        </v-btn>
      </v-col>
    </v-row>
    
    <v-row>
      <v-col v-if="omrStore.savedTemplates.length === 0" cols="12" class="text-center py-10">
        <v-icon size="64" color="grey-lighten-1">mdi-folder-open-outline</v-icon>
        <h3 class="text-h6 text-grey mt-4">Belum ada templat.</h3>
      </v-col>

      <v-col v-for="tpl in omrStore.savedTemplates" :key="tpl.id" cols="12" sm="6" md="4" lg="3">
        <v-card elevation="0" class="h-100 d-flex flex-column rounded-xl border">
          <v-card-item>
            <v-card-title class="text-subtitle-1 font-weight-bold text-truncate" style="color: #1e293b;">{{ tpl.name }}</v-card-title>
            <v-card-subtitle class="text-caption">
              <v-icon start size="small">mdi-clock-outline</v-icon> 
              {{ new Date(tpl.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) }}
            </v-card-subtitle>
          </v-card-item>
          <v-card-text>
            <div class="d-flex align-center text-body-2 mb-1">
              <v-icon start size="small" color="primary">mdi-view-grid-plus</v-icon> {{ tpl.blocks.length }} Blok
            </div>
          </v-card-text>
          <v-spacer></v-spacer>
          <v-divider></v-divider>
          <v-card-actions class="px-3 py-2 bg-grey-lighten-4">
            <v-btn color="primary" variant="text" size="small" icon="mdi-pencil" title="Buka" @click="openTemplate(tpl)"></v-btn>
            <v-spacer></v-spacer>
            <v-btn color="error" variant="text" size="small" icon="mdi-file-pdf-box" title="Unduh PDF" @click="downloadTemplateFromDashboard(tpl)"></v-btn>
            <v-btn color="grey-darken-1" variant="text" size="small" icon="mdi-trash-can" title="Hapus" @click="omrStore.deleteTemplate(tpl.id)"></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useOmrStore } from '../store/omrStore';
import type { OmrTemplate } from '../db/database';
import { exportSvgToPdf } from '../utils/pdfExport';

const router = useRouter();
const omrStore = useOmrStore();

const createNewTemplate = () => {
  omrStore.createNewTemplate();
  router.push('/designer');
};

const openTemplate = (tpl: OmrTemplate) => {
  omrStore.openTemplate(tpl);
  router.push('/designer');
};

const downloadTemplateFromDashboard = (tpl: OmrTemplate) => {
  omrStore.openTemplate(tpl);
  router.push('/designer').then(() => {
    setTimeout(async () => {
      const svgEl = document.querySelector('.canvas-container svg') as SVGSVGElement | null;
      if (svgEl) {
        await exportSvgToPdf(svgEl, `LJK_${tpl.name.replace(/\s+/g, '_')}.pdf`);
      } else {
        omrStore.showToast("Gagal memuat pratinjau LJK untuk diekspor", "error");
      }
    }, 500);
  });
};

onMounted(() => {
  omrStore.loadTemplatesFromDB();
});
</script>
