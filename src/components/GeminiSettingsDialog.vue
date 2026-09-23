<template>
  <v-dialog v-model="dialogModel" max-width="580" persistent scrollable>
    <v-card class="rounded-xl border" elevation="4">
      <!-- Header -->
      <v-card-title class="pa-4 bg-primary text-white d-flex align-center justify-space-between">
        <div class="d-flex align-center gap-2">
          <v-icon icon="mdi-creation" class="mr-2"></v-icon>
          <div>
            <div class="text-subtitle-1 font-weight-bold" style="line-height: 1.2;">Konfigurasi Gemini AI</div>
            <div class="text-caption text-blue-lighten-4" style="line-height: 1.2;">API Key & Pilihan Model (Bebas / Tidak Dikunci)</div>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" color="white" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 75vh;">
        <!-- Status Card -->
        <div class="pa-3 mb-4 rounded-lg border d-flex align-center justify-space-between" :class="statusBgClass">
          <div class="d-flex align-center gap-3">
            <v-avatar size="32" :color="statusAvatarColor" class="text-white">
              <v-icon size="18">{{ statusIcon }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption font-weight-bold">{{ statusTitle }}</div>
              <div class="text-caption text-grey-darken-1">{{ statusSubtitle }}</div>
            </div>
          </div>
          <v-chip size="x-small" :color="statusChipColor" class="font-weight-bold" variant="flat">
            {{ statusChipText }}
          </v-chip>
        </div>

        <!-- Section 1: Pilihan Model Gemini -->
        <div class="mb-4">
          <div class="d-flex align-center justify-space-between mb-1">
            <label class="text-caption font-weight-bold text-grey-darken-3 d-flex align-center">
              <v-icon size="16" color="primary" class="mr-1">mdi-tune</v-icon>
              Pilihan Model Gemini AI:
            </label>
            <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
              {{ currentActiveModelLabel }}
            </v-chip>
          </div>
          <div class="text-caption text-grey-darken-1 mb-2">
            Aplikasi tidak mengunci model ke versi tertentu. Anda bebas memilih model Flash untuk kecepatan atau Pro/Advanced untuk akurasi tulisan tangan ekstrem.
          </div>

          <!-- Pilihan Preset Model -->
          <v-select
            v-model="selectedModelPreset"
            :items="modelOptions"
            item-title="title"
            item-value="value"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-brain"
            class="mb-2"
            hide-details
            @update:model-value="onModelPresetChange"
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps" :subtitle="item.raw.description" class="py-2">
                <template #append>
                  <v-chip
                    v-if="item.raw.badge"
                    size="x-small"
                    :color="item.raw.badgeColor || 'primary'"
                    variant="flat"
                    class="font-weight-bold ml-2"
                  >
                    {{ item.raw.badge }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Input Kustom Model jika memilih 'custom' -->
          <div v-if="selectedModelPreset === 'custom'" class="mt-2 pa-3 bg-blue-grey-lighten-5 rounded-lg border">
            <label class="text-caption font-weight-bold text-grey-darken-3 mb-1 d-block">
              Nama Model Kustom:
            </label>
            <v-text-field
              v-model="customModelInput"
              variant="outlined"
              density="compact"
              placeholder="Contoh: gemini-3.1-pro-preview, gemini-3.8-flash, dll."
              prepend-inner-icon="mdi-code-braces"
              hide-details
              class="mb-1 bg-white"
            ></v-text-field>
            <div class="text-caption text-grey-darken-1" style="font-size: 0.72rem;">
              Masukkan kode pengenal model resmi dari Google AI Studio.
            </div>
          </div>

          <!-- Keterangan Model Aktif -->
          <div class="pa-2 px-3 mt-2 rounded bg-grey-lighten-4 border text-caption text-grey-darken-2 d-flex align-start gap-2">
            <v-icon size="16" color="blue-darken-2" class="mt-0-5">mdi-information</v-icon>
            <div>
              <span class="font-weight-bold">{{ selectedModelDescription.title }}:</span>
              {{ selectedModelDescription.desc }}
            </div>
          </div>
        </div>

        <v-divider class="my-3"></v-divider>

        <!-- Section 2: Input API Key -->
        <div class="mb-3">
          <label class="text-caption font-weight-bold text-grey-darken-3 mb-1 d-block">
            Gemini API Key:
          </label>
          <v-text-field
            v-model="apiKeyInput"
            :type="showKey ? 'text' : 'password'"
            variant="outlined"
            density="comfortable"
            placeholder="AIzaSy..."
            prepend-inner-icon="mdi-key"
            :append-inner-icon="showKey ? 'mdi-eye-off' : 'mdi-eye'"
            @click:append-inner="showKey = !showKey"
            hide-details="auto"
            class="mb-2"
          ></v-text-field>
          <div class="text-caption text-grey-darken-1">
            Kunci ini disimpan secara lokal di peramban Anda (LocalStorage) untuk menjalankan pemindaian langsung di Vercel.
          </div>
        </div>

        <!-- Test Connection Result Banner -->
        <v-alert
          v-if="testResult"
          :type="testResult.success ? 'success' : 'error'"
          variant="tonal"
          density="compact"
          class="mb-3 rounded-lg text-caption"
        >
          <div class="font-weight-medium">{{ testResult.message }}</div>
          <div v-if="testResult.model" class="text-caption mt-1 opacity-80">
            Model Aktif: <b>{{ testResult.model }}</b>
          </div>
        </v-alert>

        <!-- Informasi Khusus Vercel & Tautan AI Studio -->
        <div class="bg-grey-lighten-4 pa-3 rounded-lg border text-caption text-grey-darken-2 mb-2">
          <div class="font-weight-bold text-grey-darken-3 d-flex align-center mb-1">
            <v-icon size="16" color="primary" class="mr-1">mdi-lightbulb-on-outline</v-icon>
            Tips Penggunaan Model:
          </div>
          <p class="mb-2">
            • Gunakan <b>Gemini 3.8 Flash</b> untuk pemindaian LJK harian dengan kecepatan tinggi.<br />
            • Gunakan <b>Gemini 3.1 Pro</b> jika lembar LJK memiliki tulisan tangan kurang jelas atau bekas arsir pensil tipis.<br />
            • Di Vercel (<b>detektor-jawaban.vercel.app</b>), pemrosesan dijalankan langsung melalui SDK peramban dengan model yang Anda tentukan.
          </p>
          <div class="d-flex align-center justify-space-between flex-wrap gap-1 pt-1 border-t">
            <span>Dapatkan API Key:</span>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary font-weight-bold text-decoration-none d-inline-flex align-center"
            >
              Google AI Studio
              <v-icon size="14" class="ml-1">mdi-open-in-new</v-icon>
            </a>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4 border-t bg-grey-lighten-5 d-flex justify-space-between flex-wrap gap-2">
        <v-btn
          v-if="hasCustomKey"
          color="error"
          variant="text"
          size="small"
          prepend-icon="mdi-trash-can-outline"
          @click="handleRemoveKey"
        >
          Hapus Kunci
        </v-btn>
        <div v-else></div>

        <div class="d-flex gap-2">
          <v-btn
            color="primary"
            variant="tonal"
            rounded="pill"
            class="text-none font-weight-bold px-4"
            prepend-icon="mdi-connection"
            :loading="isTesting"
            @click="handleTestConnection"
          >
            Uji Koneksi
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            class="text-none font-weight-bold px-5"
            prepend-icon="mdi-content-save"
            @click="handleSave"
          >
            Simpan Konfigurasi
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import {
  getStoredApiKey,
  setStoredApiKey,
  removeStoredApiKey,
  getStoredModel,
  setStoredModel,
  testGeminiApiKey,
  GEMINI_MODEL_PRESETS,
  DEFAULT_GEMINI_MODEL,
} from '../services/geminiKeyService';
import { checkGeminiHealth } from '../services/geminiScanner';
import { useOmrStore } from '../store/omrStore';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'saved'): void;
}>();

const omrStore = useOmrStore();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val),
});

const apiKeyInput = ref('');
const selectedModelPreset = ref<string>(DEFAULT_GEMINI_MODEL);
const customModelInput = ref<string>('');
const showKey = ref(false);
const isTesting = ref(false);
const serverHasKey = ref(false);
const testResult = ref<{ success: boolean; message: string; model?: string } | null>(null);

const modelOptions = computed(() => {
  const options = GEMINI_MODEL_PRESETS.map((p) => ({
    title: p.name,
    value: p.id,
    badge: p.badge,
    badgeColor: p.isAdvanced ? 'deep-purple' : 'primary',
    description: p.description,
  }));

  options.push({
    title: 'Model Kustom (Ketik Sendiri)',
    value: 'custom',
    badge: 'Kustom',
    badgeColor: 'blue-grey',
    description: 'Masukkan nama model Gemini lain secara bebas.',
  });

  return options;
});

const effectiveSelectedModel = computed(() => {
  if (selectedModelPreset.value === 'custom') {
    return customModelInput.value.trim() || DEFAULT_GEMINI_MODEL;
  }
  return selectedModelPreset.value;
});

const currentActiveModelLabel = computed(() => {
  const preset = GEMINI_MODEL_PRESETS.find((p) => p.id === effectiveSelectedModel.value);
  return preset ? preset.name : effectiveSelectedModel.value;
});

const selectedModelDescription = computed(() => {
  const modelId = effectiveSelectedModel.value;
  const preset = GEMINI_MODEL_PRESETS.find((p) => p.id === modelId);
  if (preset) {
    return {
      title: preset.name,
      desc: preset.description,
    };
  }
  return {
    title: `Model Kustom: ${modelId}`,
    desc: 'Menggunakan nama model kustom yang dimasukkan secara manual.',
  };
});

const onModelPresetChange = (val: string) => {
  if (val !== 'custom') {
    customModelInput.value = '';
  }
};

const hasCustomKey = computed(() => Boolean(getStoredApiKey()));

const statusBgClass = computed(() => {
  if (hasCustomKey.value) return 'bg-blue-lighten-5 border-blue-lighten-3';
  if (serverHasKey.value) return 'bg-green-lighten-5 border-green-lighten-3';
  return 'bg-amber-lighten-5 border-amber-lighten-3';
});

const statusAvatarColor = computed(() => {
  if (hasCustomKey.value) return 'primary';
  if (serverHasKey.value) return 'success';
  return 'amber-darken-2';
});

const statusIcon = computed(() => {
  if (hasCustomKey.value) return 'mdi-key';
  if (serverHasKey.value) return 'mdi-server-network';
  return 'mdi-alert-circle-outline';
});

const statusTitle = computed(() => {
  if (hasCustomKey.value) return 'Kunci Pribadi Aktif';
  if (serverHasKey.value) return 'Kunci Server Aktif';
  return 'Kunci Belum Dikonfigurasi';
});

const statusSubtitle = computed(() => {
  if (hasCustomKey.value) return `Tersimpan di browser peramban Anda (Model: ${effectiveSelectedModel.value}).`;
  if (serverHasKey.value) return `Menggunakan GEMINI_API_KEY dari server proxy (Model: ${effectiveSelectedModel.value}).`;
  return 'Masukkan kunci di bawah untuk menggunakan pemindai Gemini.';
});

const statusChipColor = computed(() => {
  if (hasCustomKey.value) return 'primary';
  if (serverHasKey.value) return 'success';
  return 'amber-darken-2';
});

const statusChipText = computed(() => {
  if (hasCustomKey.value) return 'Pribadi';
  if (serverHasKey.value) return 'Proxy Server';
  return 'Belum Ada';
});

const syncFromStorage = async () => {
  apiKeyInput.value = getStoredApiKey();
  const storedModel = getStoredModel();

  const isPreset = GEMINI_MODEL_PRESETS.some((p) => p.id === storedModel);
  if (isPreset) {
    selectedModelPreset.value = storedModel;
    customModelInput.value = '';
  } else if (storedModel) {
    selectedModelPreset.value = 'custom';
    customModelInput.value = storedModel;
  } else {
    selectedModelPreset.value = DEFAULT_GEMINI_MODEL;
    customModelInput.value = '';
  }

  testResult.value = null;
  try {
    const health = await checkGeminiHealth();
    serverHasKey.value = health.hasGeminiKey;
  } catch {
    serverHasKey.value = false;
  }
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    syncFromStorage();
  }
});

onMounted(() => {
  syncFromStorage();
});

const closeDialog = () => {
  dialogModel.value = false;
};

const handleTestConnection = async () => {
  isTesting.value = true;
  testResult.value = null;
  const targetModel = effectiveSelectedModel.value;

  try {
    const result = await testGeminiApiKey(apiKeyInput.value.trim(), targetModel);
    testResult.value = result;
  } catch (e: any) {
    testResult.value = {
      success: false,
      message: e.message || 'Gagal menguji koneksi.',
      model: targetModel,
    };
  } finally {
    isTesting.value = false;
  }
};

const handleSave = () => {
  const trimmedKey = apiKeyInput.value.trim();
  const targetModel = effectiveSelectedModel.value;

  // Simpan API Key
  if (trimmedKey) {
    setStoredApiKey(trimmedKey);
  } else {
    removeStoredApiKey();
  }

  // Simpan Model Terpilih
  setStoredModel(targetModel);

  omrStore.showToast(`Konfigurasi tersimpan: Model ${targetModel} siap digunakan!`, 'success');
  emit('saved');
  closeDialog();
};

const handleRemoveKey = () => {
  removeStoredApiKey();
  apiKeyInput.value = '';
  testResult.value = null;
  omrStore.showToast('Kunci pribadi dihapus.', 'info');
  emit('saved');
};
</script>
