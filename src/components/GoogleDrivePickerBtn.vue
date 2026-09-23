<template>
  <div class="d-inline-flex align-center gap-2">
    <!-- Tombol Utama Google Drive Picker -->
    <v-btn
      :color="color"
      :variant="variant"
      :size="size"
      rounded="pill"
      :loading="isLoading"
      :disabled="disabled"
      class="text-none font-weight-bold"
      @click="handleOpenPicker"
    >
      <template v-slot:prepend>
        <svg class="mr-1" style="width: 20px; height: 20px;" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
      </template>
      <span>{{ label }}</span>
    </v-btn>

    <!-- Dialog Status Pengunduhan Berkas dari Drive -->
    <v-dialog v-model="showProgressDialog" persistent max-width="420">
      <v-card class="rounded-xl pa-4 text-center">
        <v-card-text class="d-flex flex-column align-center justify-center py-6">
          <v-progress-circular indeterminate color="primary" size="56" width="5" class="mb-4"></v-progress-circular>
          <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-1">Google Drive</div>
          <div class="text-body-2 text-grey-darken-1">{{ progressText }}</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  openGoogleDrivePicker,
  type PickedDriveFile
} from '../services/googleDrivePickerService';

withDefaults(defineProps<{
  label?: string;
  color?: string;
  variant?: 'flat' | 'tonal' | 'outlined' | 'text' | 'elevated';
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large';
  disabled?: boolean;
}>(), {
  label: 'Buka Google Drive',
  color: 'primary',
  variant: 'tonal',
  size: 'default',
  disabled: false
});

const emit = defineEmits<{
  (e: 'files-selected', files: PickedDriveFile[]): void;
  (e: 'error', message: string): void;
}>();

const isLoading = ref(false);
const showProgressDialog = ref(false);
const progressText = ref('Menghubungkan ke Google Drive...');

const handleOpenPicker = async () => {
  isLoading.value = true;
  progressText.value = 'Mempersiapkan Google Picker...';

  try {
    await openGoogleDrivePicker(
      (files) => {
        showProgressDialog.value = false;
        isLoading.value = false;
        emit('files-selected', files);
      },
      (errMsg) => {
        showProgressDialog.value = false;
        isLoading.value = false;
        emit('error', errMsg);
      },
      (status) => {
        showProgressDialog.value = true;
        progressText.value = status;
      }
    );
  } catch (err: any) {
    showProgressDialog.value = false;
    isLoading.value = false;
    emit('error', err.message || 'Gagal membuka Google Drive Picker');
  } finally {
    // Sembunyikan progress jika picker dibuka (picker adalah window overlay)
    setTimeout(() => {
      if (progressText.value.includes('Menyiapkan') || progressText.value.includes('Mempersiapkan')) {
        showProgressDialog.value = false;
        isLoading.value = false;
      }
    }, 1500);
  }
};
</script>
