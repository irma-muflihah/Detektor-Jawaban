<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold text-grey-darken-3">Pemindai LJK</h2>
      </div>
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-history" to="/results" rounded="pill">
        Riwayat Data
      </v-btn>
    </div>

    <!-- Main Content via Stepper -->
    <v-stepper v-model="step" class="elevation-0 bg-transparent flex-grow-1 d-flex flex-column overflow-hidden" hide-actions>
      <v-stepper-header class="elevation-0 bg-white rounded-xl mb-4 border flex-shrink-0">
        <v-stepper-item :complete="step > 1" title="Template" :value="1" editable></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item :complete="step > 2" title="Pindai" :value="2" :editable="step > 1"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item title="Status" :value="3" :editable="step > 2"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window class="flex-grow-1 pa-0 overflow-hidden d-flex flex-column" style="margin: 0;">
        <!-- STEP 1: Pilih Template -->
        <v-stepper-window-item :value="1" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 pa-4 d-flex flex-column overflow-hidden" elevation="0">
            <div class="d-flex align-center mb-4 flex-shrink-0">
              <v-text-field
                v-model="searchTemplate"
                prepend-inner-icon="mdi-magnify"
                placeholder="Cari template..."
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 320px;"
              ></v-text-field>
            </div>

            <div class="flex-grow-1 overflow-y-auto pr-2">
              <v-list class="bg-transparent pa-0" lines="two">
                <v-list-item
                  v-for="t in filteredTemplates"
                  :key="t.id"
                  @click="selectTemplate(t.id)"
                  :class="{'bg-blue-lighten-5': selectedTemplateId === t.id}"
                  class="mb-2 border rounded-lg transition-all"
                >
                  <template v-slot:prepend>
                    <v-icon :color="selectedTemplateId === t.id ? 'primary' : 'grey'">
                      {{ selectedTemplateId === t.id ? 'mdi-check-circle' : 'mdi-file-document-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ t.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ new Date(t.updatedAt).toLocaleDateString('id-ID') }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="filteredTemplates.length === 0" class="text-center pa-8">
                  <v-icon size="48" class="mb-2 opacity-50 text-grey">mdi-file-hidden</v-icon>
                  <div class="text-grey">Belum ada template.</div>
                </v-list-item>
              </v-list>
            </div>
            <div class="mt-4 pt-4 border-t d-flex justify-end flex-shrink-0">
              <v-btn color="primary" variant="flat" rounded="pill" :disabled="!selectedTemplateId" @click="step = 2" prepend-icon="mdi-arrow-right">
                Lanjut
              </v-btn>
            </div>
          </v-card>
          </div>
        </v-stepper-window-item>

        <!-- STEP 2: Mode Pemindaian -->
        <v-stepper-window-item :value="2" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 pa-4 d-flex flex-column overflow-hidden" elevation="0">
            <!-- Horizontal Mode Selection -->
            <div class="d-flex align-center justify-space-between mb-4 flex-shrink-0">
              <v-btn-toggle v-model="scanMode" color="primary" mandatory class="rounded-lg border bg-grey-lighten-4" density="default">
                <v-btn value="camera" class="px-6 text-none font-weight-bold" prepend-icon="mdi-camera" height="48">
                  Kamera
                </v-btn>
                <v-btn value="batch" class="px-6 text-none font-weight-bold" prepend-icon="mdi-folder-multiple-image" height="48">
                  File (Batch)
                </v-btn>
              </v-btn-toggle>
              <v-btn variant="tonal" rounded="pill" @click="step = 1" prepend-icon="mdi-arrow-left">Kembali</v-btn>
            </div>

            <!-- Main Scan Area -->
            <div class="flex-grow-1 rounded-xl overflow-hidden d-flex flex-column border">
              <!-- CAMERA VIEW -->
              <div v-if="scanMode === 'camera'" class="flex-grow-1 position-relative bg-black d-flex align-center justify-center" :class="{ 'fullscreen-camera': cameraActive }">
                <video ref="videoElement" class="w-100 h-100 object-fit-cover" playsinline autoplay muted></video>
                
                <div v-if="!cameraActive" class="position-absolute d-flex flex-column align-center">
                  <v-icon size="64" color="white" class="mb-4 opacity-50">mdi-camera-off</v-icon>
                  <v-btn color="primary" variant="flat" rounded="pill" @click="startCamera">
                    Aktifkan Kamera
                  </v-btn>
                </div>

                <div v-if="cameraActive" class="position-absolute top-0 left-0 w-100 h-100 pointer-events-none d-flex align-center justify-center">
                  <div class="scanner-guide border-success border-opacity-50"></div>
                </div>

                <div v-if="cameraActive" class="position-absolute bottom-0 left-0 w-100 pa-4 bg-black bg-opacity-50 d-flex justify-space-between align-center">
                  <v-btn color="white" variant="text" rounded="pill" prepend-icon="mdi-close" @click="stopCamera">
                    Tutup
                  </v-btn>
                  
                  <v-btn color="success" size="x-large" variant="flat" rounded="pill" prepend-icon="mdi-line-scan" class="px-8 font-weight-bold" :loading="isScanning" @click="captureAndScan">
                    Pindai
                  </v-btn>

                  <v-badge :content="sessionLogs.length" color="primary" :model-value="sessionLogs.length > 0">
                    <v-btn color="white" variant="tonal" rounded="pill" prepend-icon="mdi-format-list-bulleted" @click="goToStep3">
                      Status
                    </v-btn>
                  </v-badge>
                </div>
              </div>

              <!-- BATCH VIEW -->
              <div v-else class="flex-grow-1 pa-6 d-flex flex-column bg-grey-lighten-4">
                <div
                  class="border-dashed border-2 rounded-xl d-flex flex-column align-center justify-center bg-white transition-all flex-grow-1 mb-4"
                  :class="{ 'border-primary bg-blue-lighten-5': isDragging }"
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop.prevent="handleDrop"
                >
                  <input type="file" ref="fileInput" class="d-none" multiple accept="image/*" @change="handleFileSelect">
                  <v-icon size="48" :color="isDragging ? 'primary' : 'grey'" class="mb-2">mdi-cloud-upload</v-icon>
                  <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-2 mb-1">Tarik & Lepas File</h3>
                  <p class="text-caption text-grey-darken-1 mb-4">JPG, PNG didukung</p>
                  <v-btn color="primary" variant="tonal" rounded="pill" @click="triggerFileInput" prepend-icon="mdi-image-plus">
                    Pilih File
                  </v-btn>
                </div>

                <div class="bg-white rounded-xl border pa-4 d-flex align-center justify-space-between flex-shrink-0">
                  <div>
                    <span class="font-weight-bold text-subtitle-1">{{ batchFiles.length }}</span>
                    <span class="text-caption text-grey-darken-1 ml-1">File siap</span>
                  </div>
                  <div class="d-flex gap-2">
                    <v-btn color="error" variant="text" size="small" :disabled="batchFiles.length === 0" @click="batchFiles = []">Kosongkan</v-btn>
                    <v-btn color="success" variant="flat" rounded="pill" prepend-icon="mdi-play" :loading="isScanning" :disabled="batchFiles.length === 0" @click="processBatchQueue">
                      Proses
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
          </v-card>
          </div>
        </v-stepper-window-item>

        <!-- STEP 3: Status & Hasil -->
        <v-stepper-window-item :value="3" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
            <div class="pa-4 border-b d-flex align-center justify-space-between bg-grey-lighten-4 flex-shrink-0">
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Log Sesi</h3>
              <div class="d-flex gap-2">
                <v-chip color="success" variant="flat" size="small" class="font-weight-bold">Berhasil: {{ successfulScans }}</v-chip>
                <v-chip color="error" variant="flat" size="small" class="font-weight-bold">Gagal: {{ failedScans }}</v-chip>
              </div>
            </div>
            
            <div class="flex-grow-1 overflow-auto">
              <v-table density="compact" fixed-header class="h-100">
                <thead>
                  <tr>
                    <th class="font-weight-bold" style="width: 60px;">Status</th>
                    <th class="font-weight-bold" style="width: 120px;">Waktu</th>
                    <th class="font-weight-bold" style="width: 250px;">Informasi</th>
                    <th class="font-weight-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, i) in sessionLogs" :key="i">
                    <td class="text-center">
                      <v-icon size="small" :color="log.status === 'success' ? 'success' : 'error'">
                        {{ log.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                      </v-icon>
                    </td>
                    <td class="text-caption text-grey-darken-1">{{ new Date(log.timestamp).toLocaleTimeString('id-ID') }}</td>
                    <td class="font-weight-medium text-truncate" style="max-width: 250px;" :title="log.info">{{ log.info }}</td>
                    <td :class="log.status === 'success' ? 'text-success' : 'text-error'">{{ log.message }}</td>
                  </tr>
                  <tr v-if="sessionLogs.length === 0">
                    <td colspan="4" class="text-center pa-8 text-grey">
                      <v-icon size="48" class="mb-2 opacity-50">mdi-clipboard-text-outline</v-icon>
                      <br>Belum ada proses pemindaian.
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            
            <div class="pa-4 border-t d-flex justify-end gap-2 bg-white flex-shrink-0">
              <v-btn variant="tonal" color="primary" rounded="pill" @click="step = 2" prepend-icon="mdi-backup-restore">Pindai Lagi</v-btn>
              <v-btn color="primary" variant="flat" rounded="pill" to="/results" prepend-icon="mdi-database-eye">Lihat Data</v-btn>
            </div>
          </v-card>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <!-- Scanning Overlay -->
    <v-overlay :model-value="isScanning" class="align-center justify-center" persistent>
      <v-card class="pa-6 rounded-xl text-center" min-width="250" elevation="0">
        <v-progress-circular indeterminate color="primary" size="48" width="4" class="mb-4"></v-progress-circular>
        <h3 class="text-subtitle-1 font-weight-bold">Memproses...</h3>
      </v-card>
    </v-overlay>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useOmrStore } from '../store/omrStore';
import { db, type ScanResult } from '../db/database';

const omrStore = useOmrStore();

const step = ref(1);
const searchTemplate = ref('');
const selectedTemplateId = ref<string | null>(null);
const scanMode = ref<'camera' | 'batch'>('camera');
const cvReady = ref(false);

const isScanning = ref(false);

// Session State
interface SessionLog {
  status: 'success' | 'error';
  info: string;
  message: string;
  timestamp: number;
}
const sessionLogs = ref<SessionLog[]>([]);

const successfulScans = computed(() => sessionLogs.value.filter(l => l.status === 'success').length);
const failedScans = computed(() => sessionLogs.value.filter(l => l.status === 'error').length);

// Camera Refs
const videoElement = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
let mediaStream: MediaStream | null = null;

// Batch Refs
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

interface BatchFile {
  file: File;
}
const batchFiles = ref<BatchFile[]>([]);

const filteredTemplates = computed(() => {
  if (!searchTemplate.value) return omrStore.savedTemplates;
  const s = searchTemplate.value.toLowerCase();
  return omrStore.savedTemplates.filter(t => t.name.toLowerCase().includes(s));
});

const selectedTemplate = computed(() => {
  return omrStore.savedTemplates.find(t => t.id === selectedTemplateId.value);
});

const selectTemplate = (id: string) => {
  selectedTemplateId.value = id;
  step.value = 2;
};

const goToStep3 = () => {
  stopCamera();
  step.value = 3;
};

onMounted(async () => {
  await omrStore.loadTemplatesFromDB();
  
  // Check OpenCV ready
  const checkCv = setInterval(() => {
    if ((window as any).cvLoaded && (window as any).cv) {
      cvReady.value = true;
      clearInterval(checkCv);
    }
  }, 500);
});

onUnmounted(() => {
  stopCamera();
});

watch(scanMode, (newVal) => {
  if (newVal !== 'camera') {
    stopCamera();
  }
});

watch(step, (newVal) => {
  if (newVal !== 2 || scanMode.value !== 'camera') {
    stopCamera();
  }
});

const startCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    omrStore.showToast('Browser tidak mendukung akses kamera', 'error');
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
    });
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;
      cameraActive.value = true;
    }
  } catch (err: any) {
    omrStore.showToast('Gagal mengakses kamera: ' + err.message, 'error');
  }
};

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
  cameraActive.value = false;
};

// Simulated AI Image Processing
const processOMRImage = async (imageSource: HTMLImageElement | HTMLVideoElement): Promise<any> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!cvReady.value) {
        reject(new Error("OpenCV belum siap."));
        return;
      }
      
      const cv = (window as any).cv;
      let src = new cv.Mat();
      let gray = new cv.Mat();
      let thresh = new cv.Mat();

      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1414;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");
        
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
        
        src = cv.imread(canvas);
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(gray, thresh, 150, 255, cv.THRESH_BINARY_INV);

        let npsn = '';
        let id_mapel = '';
        let kode_tes = '';
        let nisn = '';
        let answers: any[] = [];

        const template = selectedTemplate.value;
        if (!template) {
          throw new Error("Template tidak ditemukan.");
        }

        template.blocks.forEach(block => {
          if (!block.bubbles || block.bubbles.length === 0) return;
          
          if (block.direction === 'vertical') {
            const cols = block.cols || 0;
            const rows = block.rows || 10;
            let resultString = '';
            
            for (let c = 1; c <= cols; c++) {
              let maxIntensity = 0;
              let selectedValue = '';
              for (let r = 1; r <= rows; r++) {
                const bubble = block.bubbles.find(b => b.id === `col${c}_row${r}`);
                if (bubble) {
                  const bSize = bubble.r * 2;
                  const x = Math.max(0, Math.min(1000 - bSize, Math.round(bubble.cx - bubble.r)));
                  const y = Math.max(0, Math.min(1414 - bSize, Math.round(bubble.cy - bubble.r)));
                  
                  // Ignore outer border by shrinking ROI by 6 pixels on all sides
                  const innerSize = Math.max(4, bSize - 12);
                  const innerX = x + 6;
                  const innerY = y + 6;
                  
                  const rect = new cv.Rect(innerX, innerY, innerSize, innerSize);
                  const roi = thresh.roi(rect);
                  const mean = cv.mean(roi);
                  roi.delete();
                  
                  if (mean[0] > maxIntensity) {
                    maxIntensity = mean[0];
                    selectedValue = bubble.value;
                  }
                }
              }
              // Threshold 100 for clear distinction between filled and empty
              if (maxIntensity > 100) {
                resultString += selectedValue;
              } else {
                resultString += '0';
              }
            }
            
            if (block.type === 'identity_npsn') npsn = resultString;
            else if (block.type === 'identity_subject') id_mapel = resultString;
            else if (block.type === 'identity_test') kode_tes = resultString;
            else if (block.type === 'identity_nisn') nisn = resultString;
            
          } else if (block.direction === 'horizontal') {
            const rows = block.rows || 1;
            const opts = block.options || [];
            const totalRows = block.type === 'bs3' ? rows * 3 : rows;
            let bs3Answers: { [key: number]: string[] } = {};
            
            for (let r = 1; r <= totalRows; r++) {
              const qNum = (block.startNum || 0) + (block.type === 'bs3' ? Math.floor((r-1)/3) : (r - 1));
              let selectedValues: string[] = [];
              let maxIntensity = 0;
              let selectedValue = '';
              
              opts.forEach((_opt, oIdx) => {
                const subId = block.type === 'bs3' ? `_sub${(r-1)%3}` : '';
                const bubble = block.bubbles!.find(b => b.id === `q${qNum}${subId}_opt${oIdx}`);
                if (bubble) {
                  const bSize = block.type === 'kompleks' ? 20 : bubble.r * 2;
                  const half = Math.round(bSize / 2);
                  const x = Math.max(0, Math.min(1000 - bSize, Math.round(bubble.cx - half)));
                  const y = Math.max(0, Math.min(1414 - bSize, Math.round(bubble.cy - half)));
                  
                  // Ignore outer border by shrinking ROI by 6 pixels on all sides
                  const innerSize = Math.max(4, bSize - 12);
                  const innerX = x + 6;
                  const innerY = y + 6;
                  
                  const rect = new cv.Rect(innerX, innerY, innerSize, innerSize);
                  const roi = thresh.roi(rect);
                  const mean = cv.mean(roi);
                  roi.delete();
                  
                  if (block.type === 'kompleks') {
                    // Threshold 100 for clear distinction
                    if (mean[0] > 100) {
                      selectedValues.push(bubble.value);
                    }
                  } else {
                    if (mean[0] > maxIntensity) {
                      maxIntensity = mean[0];
                      selectedValue = bubble.value;
                    }
                  }
                }
              });
              
              if (block.type === 'kompleks') {
                answers.push({
                  nomor_soal: qNum,
                  bentuk_soal: block.type,
                  jawaban: selectedValues.length > 0 ? selectedValues : []
                });
              } else if (block.type === 'bs3') {
                if (!bs3Answers[qNum]) bs3Answers[qNum] = [];
                bs3Answers[qNum].push(maxIntensity > 100 ? selectedValue : '-');
              } else {
                if (maxIntensity > 100) {
                  answers.push({
                    nomor_soal: qNum,
                    bentuk_soal: block.type,
                    jawaban: selectedValue
                  });
                } else {
                  answers.push({
                    nomor_soal: qNum,
                    bentuk_soal: block.type,
                    jawaban: '-' 
                  });
                }
              }
            }
            
            if (block.type === 'bs3') {
              for (const [qn, ansArr] of Object.entries(bs3Answers)) {
                answers.push({
                  nomor_soal: Number(qn),
                  bentuk_soal: block.type,
                  jawaban: ansArr
                });
              }
            }
          }
        });

        src.delete();
        gray.delete();
        thresh.delete();

        if (!npsn || npsn.replace(/0/g, '').length === 0) {
          throw new Error("NPSN tidak terdeteksi pada LJK.");
        }
        
        resolve({ npsn, id_mapel, kode_tes, nisn, answers });

      } catch (e: any) {
        if (src && !src.isDeleted()) src.delete();
        if (gray && !gray.isDeleted()) gray.delete();
        if (thresh && !thresh.isDeleted()) thresh.delete();
        reject(new Error("Error saat memproses gambar: " + e.message));
      }
    }, 50);
  });
};

const saveScanResult = async (result: any) => {
  const scanData: ScanResult = {
    ...result,
    scannedAt: Date.now()
  };
  
  await db.scanResults.put(scanData);
};

const addSessionLog = (status: 'success'|'error', info: string, message: string) => {
  sessionLogs.value.unshift({ status, info, message, timestamp: Date.now() });
};

const captureAndScan = async () => {
  if (!videoElement.value) return;
  
  isScanning.value = true;
  try {
    const result = await processOMRImage(videoElement.value);
    await saveScanResult(result);
    addSessionLog('success', `NISN: ${result.nisn}`, 'Berhasil disimpan');
    omrStore.showToast(`Berhasil dipindai! (NISN: ${result.nisn})`, 'success');
  } catch (e: any) {
    addSessionLog('error', 'Tangkapan Kamera', e.message);
    omrStore.showToast(e.message, 'error');
  } finally {
    isScanning.value = false;
  }
};

// Batch Processing Logic
const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (!selectedTemplate.value) {
    omrStore.showToast('Pilih template terlebih dahulu', 'error');
    return;
  }
  if (e.dataTransfer && e.dataTransfer.files) {
    addFilesToQueue(Array.from(e.dataTransfer.files));
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    addFilesToQueue(Array.from(target.files));
  }
  if (fileInput.value) fileInput.value.value = '';
};

const addFilesToQueue = (files: File[]) => {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(file => {
    batchFiles.value.push({ file });
  });
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Format gambar tidak didukung."));
      if (e.target?.result) img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
};

const processBatchQueue = async () => {
  if (batchFiles.value.length === 0) return;
  isScanning.value = true;
  
  for (let i = 0; i < batchFiles.value.length; i++) {
    const batchFile = batchFiles.value[i];
    try {
      const img = await loadImageFromFile(batchFile.file);
      const result = await processOMRImage(img);
      await saveScanResult(result);
      addSessionLog('success', batchFile.file.name, `Berhasil (NISN: ${result.nisn})`);
    } catch (e: any) {
      addSessionLog('error', batchFile.file.name, e.message);
    }
  }
  
  batchFiles.value = [];
  isScanning.value = false;
  step.value = 3; // Auto navigate to step 3 when batch finishes
  omrStore.showToast('Proses batch selesai.', 'info');
};

</script>


<style scoped>
.fullscreen-camera {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
}

.scanner-guide {
  width: 70%;
  height: 80%;
  border: 3px solid;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  position: relative;
}

.scanner-guide::before,
.scanner-guide::after {
  content: '';
  position: absolute;
  background-color: rgba(76, 175, 80, 0.5);
}

.scanner-guide::before {
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateY(-50%);
}

.scanner-guide::after {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
}

.object-fit-cover {
  object-fit: cover;
}
</style>

