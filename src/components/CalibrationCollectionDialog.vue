<template>
  <v-dialog v-model="modelValue" max-width="680" scrollable>
    <v-card class="rounded-xl overflow-hidden">
      <!-- Header -->
      <v-card-title class="pa-4 bg-grey-lighten-4 border-b d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon color="secondary" size="24">mdi-target-account</v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold text-grey-darken-3">Koleksi Sampel Kalibrasi ROI</div>
            <div class="text-caption text-grey-darken-1">{{ templateName || 'Templat LJK Aktif' }}</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" @click="modelValue = false"></v-btn>
      </v-card-title>

      <!-- Content -->
      <v-card-text class="pa-4">
        <!-- Banner Info Kebijakan Kalibrasi Sempurna -->
        <v-alert
          type="info"
          variant="tonal"
          density="comfortable"
          class="mb-4 rounded-lg"
          icon="mdi-shield-check-outline"
        >
          <div class="text-caption font-weight-bold text-secondary mb-1">Standar Kalibrasi Presisi Tinggi</div>
          <div class="text-caption text-grey-darken-2">
            Hanya lembar LJK yang telah Anda verifikasi <strong>100% Sempurna</strong> yang disimpan ke dalam koleksi ini.
            Sistem menghitung nilai median centroid (Resultan ROI) dari seluruh sampel sempurna ini untuk menyelaraskan koordinat pemindaian fisik OpenCV.
          </div>
        </v-alert>

        <!-- Status Resultan -->
        <div class="d-flex align-center justify-space-between bg-secondary-lighten-5 pa-3 rounded-lg border mb-4">
          <div>
            <div class="text-caption font-weight-bold text-grey-darken-2">Status Akurasi Koordinat ROI:</div>
            <div class="text-subtitle-2 font-weight-black text-secondary">
              {{ samples.length > 0 ? `Terkalibrasi dari ${samples.length} Sampel Sempurna` : 'Baseline Murni Perancang (Belum Dikalibrasi)' }}
            </div>
          </div>
          <v-chip
            :color="samples.length > 0 ? 'success' : 'grey'"
            size="small"
            variant="flat"
            class="font-weight-bold"
          >
            {{ samples.length > 0 ? `Kepercayaan ${Math.min(100, Math.round((0.90 + samples.length * 0.02) * 100))}%` : 'Baseline 100%' }}
          </v-chip>
        </div>

        <!-- Daftar Sampel -->
        <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase d-flex align-center justify-space-between">
          <span>Daftar Sampel Terverifikasi ({{ samples.length }})</span>
          <span v-if="samples.length > 0" class="text-caption text-grey">Terbaru di atas</span>
        </div>

        <div v-if="samples.length === 0" class="text-center py-8 text-grey bg-grey-lighten-5 rounded-lg border border-dashed">
          <v-icon size="40" class="mb-2 opacity-50">mdi-target</v-icon>
          <div class="text-body-2 font-weight-medium">Belum ada sampel kalibrasi tersimpan.</div>
          <div class="text-caption text-grey-darken-1 px-4 mt-1">
            Saat memindai lembar LJK fisik dan memeriksa hasilnya di pratinjau, klik <strong>"Simpan & Jadikan Kalibrasi Sempurna"</strong> untuk menambahkan lembar tersebut ke koleksi ini.
          </div>
        </div>

        <v-list v-else lines="two" class="pa-0 rounded-lg border">
          <template v-for="(s, idx) in samples" :key="s.id">
            <v-list-item class="py-2">
              <template v-slot:prepend>
                <div class="bg-secondary text-white rounded-circle d-flex align-center justify-center font-weight-bold mr-3" style="width: 32px; height: 32px; font-size: 13px;">
                  #{{ samples.length - idx }}
                </div>
              </template>

              <v-list-item-title class="font-weight-bold text-body-2 text-grey-darken-3 d-flex align-center gap-2">
                <span>{{ s.metadata?.studentName ? `Siswa: ${s.metadata.studentName}` : (s.metadata?.nisn ? `NISN: ${s.metadata.nisn}` : 'Sampel Terverifikasi') }}</span>
                <v-chip size="x-small" color="secondary" variant="tonal" class="font-weight-bold">
                  {{ s.metadata?.modelName || 'Gemini AI' }}
                </v-chip>
              </v-list-item-title>

              <v-list-item-subtitle class="text-caption text-grey-darken-1 mt-1">
                {{ formatTimestamp(s.createdAt) }} &bull; {{ s.metadata?.notes || 'Verifikasi manual pengguna' }}
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-btn
                  icon="mdi-trash-can-outline"
                  size="small"
                  variant="text"
                  color="error"
                  title="Hapus sampel ini dari koleksi kalibrasi"
                  :loading="deletingId === s.id"
                  @click="handleDeleteSingle(s.id)"
                ></v-btn>
              </template>
            </v-list-item>
            <v-divider v-if="idx < samples.length - 1"></v-divider>
          </template>
        </v-list>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="pa-4 bg-grey-lighten-4 border-t d-flex justify-space-between align-center">
        <v-btn
          v-if="samples.length > 0"
          color="error"
          variant="tonal"
          size="small"
          rounded="pill"
          prepend-icon="mdi-restore"
          :loading="isResetting"
          @click="handleResetAll"
        >
          Reset Semua ke Baseline
        </v-btn>
        <div v-else></div>

        <v-btn
          color="primary"
          variant="flat"
          rounded="pill"
          class="px-6 font-weight-bold"
          @click="modelValue = false"
        >
          Tutup
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { TemplateRoiRecord } from '../db/database';
import {
  getTemplateRoisForScanning,
  deleteCalibrationSample,
  resetTemplateCalibration
} from '../utils/roiVectorService';
import { useOmrStore } from '../store/omrStore';

const props = defineProps<{
  templateId?: string | null;
  templateName?: string;
}>();

const modelValue = defineModel<boolean>({ default: false });
const emit = defineEmits<{
  (e: 'updated'): void;
}>();

const omrStore = useOmrStore();
const samples = ref<TemplateRoiRecord[]>([]);
const deletingId = ref<string | null>(null);
const isResetting = ref(false);

const loadSamples = async () => {
  if (!props.templateId) {
    samples.value = [];
    return;
  }
  try {
    const pkg = await getTemplateRoisForScanning(props.templateId);
    samples.value = pkg.samples || [];
  } catch (err) {
    console.warn('Gagal memuat sampel kalibrasi:', err);
  }
};

watch([modelValue, () => props.templateId], ([val]) => {
  if (val) {
    loadSamples();
  }
});

const formatTimestamp = (ts?: number) => {
  if (!ts) return '-';
  return new Date(ts).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleDeleteSingle = async (sampleId: string) => {
  if (!props.templateId) return;
  deletingId.value = sampleId;
  try {
    await deleteCalibrationSample(props.templateId, sampleId);
    await loadSamples();
    emit('updated');
    omrStore.showToast('Sampel kalibrasi berhasil dihapus.', 'info');
  } catch (err: any) {
    omrStore.showToast(`Gagal menghapus sampel: ${err.message}`, 'error');
  } finally {
    deletingId.value = null;
  }
};

const handleResetAll = async () => {
  if (!props.templateId) return;
  isResetting.value = true;
  try {
    await resetTemplateCalibration(props.templateId);
    await loadSamples();
    emit('updated');
    omrStore.showToast('Semua sampel kalibrasi berhasil direset ke baseline awal.', 'info');
  } catch (err: any) {
    omrStore.showToast(`Gagal mereset: ${err.message}`, 'error');
  } finally {
    isResetting.value = false;
  }
};
</script>
