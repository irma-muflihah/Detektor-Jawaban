<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Hasil Pemindaian</h2>
        <p class="text-body-2 text-grey-darken-1">Data yang berhasil dipindai dan disimpan secara lokal.</p>
      </div>
      <div class="d-flex gap-2 align-center">
        
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="text" color="primary" v-bind="props"></v-btn>
          </template>
          <v-list density="compact" class="rounded-lg elevation-3">
            <v-list-item prepend-icon="mdi-export" @click="exportCSV" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Ekspor CSV</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-code-json" @click="exportJSON" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Ekspor JSON</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-delete-sweep" class="text-error" @click="openDialogDeleteSpecific" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Hapus Data Spesifik</v-list-item-title>
            </v-list-item>

            <v-list-item prepend-icon="mdi-delete" class="text-error" @click="confirmDeleteAll" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Hapus Semua Data</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <v-card class="rounded-xl border border-opacity-25 elevation-0 flex-grow-1 overflow-hidden d-flex flex-column">
      <div class="pa-4 border-b bg-white d-flex align-center gap-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Cari NPSN, ID Mapel, atau NISN..."
          variant="outlined"
          density="compact"
          hide-details
          class="max-w-300"
        ></v-text-field>
      </div>
      
      
    <!-- Statistik Singkat -->
    <v-row class="px-4 py-2" dense>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-blue-lighten-5" elevation="0">
          <v-card-text class="pa-2 text-center">
            <div class="text-caption text-blue-darken-2 font-weight-bold mb-1">Total Pemindaian</div>
            <div class="text-subtitle-1 font-weight-black text-blue-darken-3">{{ scanHistoryList.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-green-lighten-5" elevation="0">
          <v-card-text class="pa-2 text-center">
            <div class="text-caption text-green-darken-2 font-weight-bold mb-1">Jml Unik NPSN</div>
            <div class="text-subtitle-1 font-weight-black text-green-darken-3">{{ uniqueNPSN }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-orange-lighten-5" elevation="0">
          <v-card-text class="pa-2 text-center">
            <div class="text-caption text-orange-darken-2 font-weight-bold mb-1">Jml Unik Mapel</div>
            <div class="text-subtitle-1 font-weight-black text-orange-darken-3">{{ uniqueMapel }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-purple-lighten-5" elevation="0">
          <v-card-text class="pa-2 text-center">
            <div class="text-caption text-purple-darken-2 font-weight-bold mb-1">Kombinasi Tes</div>
            <div class="text-subtitle-1 font-weight-black text-purple-darken-3">{{ uniqueCombos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-data-table
        :headers="tableHeaders"
        :items="filteredList"
        :items-per-page="10"
        :items-per-page-options="[10, 25, 50, 100, -1]"
        show-current-page
        multi-sort
        density="compact"
        class="bg-transparent flex-grow-1"
      >
        <template v-slot:item.scannedAt="{ item }">
          <span class="text-caption text-grey-darken-1">{{ new Date(item.scannedAt).toLocaleString('id-ID') }}</span>
        </template>
        <template v-slot:item.engine="{ item }">
          <div class="d-flex align-center gap-1">
            <v-chip
              size="x-small"
              :color="item.engine === 'gemini' ? 'primary' : 'grey-darken-1'"
              class="font-weight-bold"
              variant="tonal"
            >
              <v-icon start size="12" v-if="item.engine === 'gemini'">mdi-creation</v-icon>
              {{ item.engine === 'gemini' ? 'Gemini AI' : 'OpenCV' }}
            </v-chip>
          </div>
        </template>
        <template v-slot:item.id_mapel="{ item }">
          <span class="font-weight-bold text-primary">{{ item.id_mapel }}</span>
        </template>
        <template v-slot:item.kode_tes="{ item }">
          <span class="font-weight-bold text-info">{{ item.kode_tes }}</span>
        </template>
        <template v-slot:item.nisn="{ item }">
          <span class="font-weight-bold">{{ item.nisn }}</span>
        </template>
        <template v-slot:item.nama_siswa="{ item }">
          <div class="d-flex align-center gap-1">
            <span class="text-caption font-weight-medium text-grey-darken-3">{{ item.nama_siswa || '-' }}</span>
            <v-icon v-if="item.is_calibrated" size="14" color="amber-darken-3" title="Tersimpan di Koleksi Kalibrasi Sempurna">mdi-star</v-icon>
          </div>
        </template>
        
        <!-- Dinamis kolom jawaban -->
        <template v-for="n in maxQuestions" :key="'soal'+n" v-slot:[`item.soal_${n}`]="{ item }">
          <span class="font-weight-medium" :class="{'text-error': getAnswerFor(item, n) === '-'}">
            {{ getAnswerFor(item, n) }}
          </span>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center">
            <v-btn
              icon="mdi-crosshairs-gps"
              size="small"
              variant="text"
              color="primary"
              title="Buka di Laman Kalibrasi & Bounding"
              @click.stop="openInKalibrasi(item)"
            ></v-btn>
            <v-btn
              icon="mdi-eye-outline"
              size="small"
              variant="text"
              color="grey-darken-2"
              title="Lihat detail ringkas"
              @click.stop="openDetailDialog(item)"
            ></v-btn>
            <v-btn
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              color="error"
              title="Hapus baris data"
              @click.stop="openDialogDeleteSingle(item)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="text-center pa-8 text-grey">
            <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
            <br>
            Belum ada data hasil pemindaian atau tidak ada yang cocok dengan pencarian.
          </div>
        </template>
      </v-data-table>

    </v-card>

    <!-- Dialog Delete All -->
    <v-dialog v-model="dialogDeleteAll" max-width="400">
      <v-card class="rounded-xl">
        <v-card-title class="text-h6 font-weight-bold pt-4 px-4 text-error">Hapus Semua Data?</v-card-title>
        <v-card-text class="px-4 pb-2">
          <p>Semua data hasil pemindaian dan penilaian akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.</p>
          <div class="mt-4">Ketik <b>HAPUS</b> untuk mengonfirmasi.</div>
          <v-text-field v-model="confirmDeleteText" variant="outlined" density="compact" class="mt-2" hide-details></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="dialogDeleteAll = false">Batal</v-btn>
          <v-btn color="error" variant="flat" :disabled="confirmDeleteText !== 'HAPUS'" @click="deleteAllRecords">Hapus Semua</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    
  
    <!-- Dialog Hapus Spesifik -->
    <v-dialog v-model="dialogDeleteSpecific" max-width="400">
      <v-card class="rounded-xl border" elevation="0">
        <v-card-title class="font-weight-bold pt-4 px-4 bg-grey-lighten-4 border-b">
          Hapus Data Spesifik
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-2 mb-4">Hapus hasil pemindaian berdasarkan ID Mapel dan Kode Tes.</div>
          <v-text-field v-model="deleteIdMapel" label="ID Mapel" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
          <v-text-field v-model="deleteKodeTes" label="Kode Tes" variant="outlined" density="comfortable"></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDeleteSpecific = false">Batal</v-btn>
          <v-btn color="error" variant="flat" rounded="pill" class="px-6" @click="deleteSpecificRecords">Hapus</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Konfirmasi Hapus Baris Tunggal (Aman untuk iFrame, menggantikan window.confirm) -->
    <v-dialog v-model="dialogDeleteSingle" max-width="450">
      <v-card class="rounded-xl border" elevation="4">
        <v-card-title class="pa-4 bg-red-lighten-5 text-error d-flex align-center font-weight-bold">
          <v-icon start icon="mdi-delete-alert" class="mr-2"></v-icon>
          Hapus Data Pemindaian?
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 text-grey-darken-3 mb-3">
            Apakah Anda yakin ingin menghapus data hasil pemindaian dan penilaian untuk peserta berikut?
          </p>
          <div class="bg-grey-lighten-4 pa-3 rounded-lg border text-caption">
            <div v-if="itemToDelete?.nama_siswa" class="font-weight-bold text-subtitle-2 text-grey-darken-3 mb-1">
              {{ itemToDelete.nama_siswa }}
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-grey-darken-1">NISN:</span>
              <strong class="font-weight-bold text-grey-darken-3">{{ itemToDelete?.nisn || '-' }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-grey-darken-1">NPSN:</span>
              <strong class="font-weight-bold text-grey-darken-3">{{ itemToDelete?.npsn || '-' }}</strong>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-grey-darken-1">Mapel / Kode Tes:</span>
              <strong class="font-weight-bold text-grey-darken-3">ID {{ itemToDelete?.id_mapel || '-' }} / {{ itemToDelete?.kode_tes || '-' }}</strong>
            </div>
            <div v-if="itemToDelete?.scannedAt" class="d-flex justify-space-between text-grey-darken-1 mt-1 pt-1 border-t">
              <span>Waktu Pindai:</span>
              <span>{{ new Date(itemToDelete.scannedAt).toLocaleString('id-ID') }}</span>
            </div>
          </div>
          <p class="text-caption text-error font-weight-medium mt-3 mb-0">
            * Tindakan ini permanen. Hasil koreksi dan skor untuk lembar ujian ini juga akan ikut dihapus.
          </p>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-5 d-flex justify-end gap-2">
          <v-btn variant="text" color="grey-darken-1" rounded="pill" @click="dialogDeleteSingle = false">
            Batal
          </v-btn>
          <v-btn
            color="error"
            variant="flat"
            rounded="pill"
            class="px-5 font-weight-bold"
            prepend-icon="mdi-delete"
            :loading="isDeletingSingle"
            @click="executeDeleteSingle"
          >
            Hapus Data
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Detail Hasil & Kalibrasi Sempurna -->
    <v-dialog v-model="dialogDetail" max-width="650" scrollable>
      <v-card class="rounded-xl overflow-hidden" v-if="selectedDetailItem">
        <v-card-title class="pa-4 bg-grey-lighten-4 border-b d-flex align-center justify-space-between">
          <div class="d-flex align-center gap-2">
            <v-icon color="primary" size="24">mdi-file-document-outline</v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-bold text-grey-darken-3">Detail Lembar Jawaban</div>
              <div class="text-caption text-grey-darken-1">
                {{ selectedDetailItem.nama_siswa ? selectedDetailItem.nama_siswa + ' • ' : '' }}NISN: {{ selectedDetailItem.nisn }}
              </div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" size="small" @click="dialogDetail = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Status Kalibrasi Badge -->
          <div v-if="selectedDetailItem.is_calibrated" class="mb-3 pa-2 rounded-lg bg-amber-lighten-5 border border-amber d-flex align-center gap-2">
            <v-icon color="amber-darken-3">mdi-star-check</v-icon>
            <div class="text-caption font-weight-bold text-amber-darken-4">
              Lembar ini telah terverifikasi sebagai Sampel Kalibrasi ROI Sempurna.
            </div>
          </div>

          <!-- Pratinjau Citra Fisik LJK -->
          <div v-if="selectedDetailItem.image_url" class="mb-4 bg-white rounded-lg border pa-2 text-center">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-1 text-left">Citra Fisik Lembar Jawaban</div>
            <img
              :src="selectedDetailItem.image_url"
              alt="Citra Lembar Jawaban"
              style="max-height: 220px; max-width: 100%; object-fit: contain;"
              class="rounded border bg-grey-lighten-4"
            />
          </div>

          <!-- Profil Peserta -->
          <div class="bg-grey-lighten-4 rounded-lg pa-3 border mb-4">
            <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase">Identitas Peserta</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <div><span class="text-grey-darken-1 text-caption">Nama:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.nama_siswa || '-' }}</strong></div>
              <div><span class="text-grey-darken-1 text-caption">Kelas:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.kelas || '-' }}</strong></div>
              <div><span class="text-grey-darken-1 text-caption">No. Peserta:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.no_peserta || '-' }}</strong></div>
              <div><span class="text-grey-darken-1 text-caption">NISN:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.nisn || '-' }}</strong></div>
              <div><span class="text-grey-darken-1 text-caption">NPSN:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.npsn || '-' }}</strong></div>
              <div><span class="text-grey-darken-1 text-caption">Mapel / Tes:</span> <strong class="text-caption font-weight-bold ml-1">{{ selectedDetailItem.id_mapel }} / {{ selectedDetailItem.kode_tes }}</strong></div>
            </div>
          </div>

          <!-- Rincian Jawaban -->
          <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase">
            Jawaban Terdeteksi ({{ selectedDetailItem.answers?.length || 0 }} Butir)
          </div>
          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 6px; max-height: 180px; overflow-y: auto;" class="pa-1">
            <div
              v-for="ans in selectedDetailItem.answers"
              :key="ans.nomor_soal"
              class="pa-2 rounded border bg-white text-center"
            >
              <div class="text-caption text-grey-darken-1" style="font-size: 10px;">No. {{ ans.nomor_soal }}</div>
              <div class="font-weight-black text-primary">{{ formatAnswer(ans.jawaban) }}</div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 bg-grey-lighten-4 border-t d-flex justify-space-between align-center flex-wrap gap-2">
          <div class="d-flex align-center gap-2 flex-wrap">
            <v-btn
              color="primary"
              variant="tonal"
              rounded="pill"
              class="font-weight-bold px-4"
              prepend-icon="mdi-crosshairs-gps"
              @click="openInKalibrasi(selectedDetailItem)"
            >
              Analisis di Laman Kalibrasi
            </v-btn>
            <v-btn
              v-if="selectedDetailItem.image_url && !selectedDetailItem.is_calibrated"
              color="amber-darken-3"
              variant="flat"
              rounded="pill"
              class="font-weight-bold text-white px-4"
              prepend-icon="mdi-star-check"
              :loading="isPromotingCalibration"
              @click="promoteToCalibration(selectedDetailItem)"
            >
              Jadikan Koleksi Kalibrasi Sempurna
            </v-btn>
          </div>

          <v-btn color="grey-darken-1" variant="text" rounded="pill" class="px-6 font-weight-bold" @click="dialogDetail = false">
            Tutup
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { db, type ScanResult } from '../db/database';
import { useOmrStore } from '../store/omrStore';
import { calibrateVectorRoisFromScan, recordCalibrationSample } from '../utils/roiVectorService';

const router = useRouter();
const omrStore = useOmrStore();
const scanHistoryList = ref<ScanResult[]>([]);
const search = ref('');
const dialogDeleteAll = ref(false);
const confirmDeleteText = ref('');

const dialogDeleteSpecific = ref(false);
const deleteIdMapel = ref('');
const deleteKodeTes = ref('');

const dialogDeleteSingle = ref(false);
const itemToDelete = ref<ScanResult | null>(null);
const isDeletingSingle = ref(false);

const dialogDetail = ref(false);
const selectedDetailItem = ref<ScanResult | null>(null);
const isPromotingCalibration = ref(false);

const openInKalibrasi = (item: ScanResult | null) => {
  if (!item) return;
  dialogDetail.value = false;
  router.push({
    path: '/kalibrasi',
    query: {
      npsn: item.npsn,
      id_mapel: item.id_mapel,
      kode_tes: item.kode_tes,
      nisn: item.nisn
    }
  });
};

const openDetailDialog = (item: ScanResult) => {
  selectedDetailItem.value = item;
  dialogDetail.value = true;
};

const promoteToCalibration = async (item: ScanResult) => {
  if (!item.image_url) {
    omrStore.showToast('Citra fisik tidak tersedia untuk lembar ini.', 'warning');
    return;
  }
  isPromotingCalibration.value = true;
  try {
    const templates = await db.templates.toArray();
    const targetTemplate = templates.find(t => t.id === item.template_id) || templates[0];
    if (!targetTemplate) {
      throw new Error('Templat LJK tidak ditemukan.');
    }

    const baseline = await db.templateRois.get(`${targetTemplate.id}_baseline`);
    if (!baseline || !baseline.vectorRois.length) {
      throw new Error('Baseline ROI templat belum dibuat.');
    }

    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = item.image_url!;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1000;
    canvas.height = img.naturalHeight || 1414;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Gagal menginisiasi kanvas.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const calibratedRois = calibrateVectorRoisFromScan(baseline.vectorRois, canvas, item);
    await recordCalibrationSample(targetTemplate.id, calibratedRois, {
      studentName: item.nama_siswa,
      nisn: item.nisn,
      modelName: item.engine === 'gemini' ? 'Gemini AI Vision' : 'OpenCV Audit',
      imageWidth: canvas.width,
      imageHeight: canvas.height,
      isUserVerified: true,
      notes: `Diverifikasi dari riwayat data (${item.nama_siswa ? item.nama_siswa + ' - ' : ''}NISN: ${item.nisn})`
    });

    item.is_calibrated = true;
    await db.scanResults.put(item);
    omrStore.showToast('Lembar LJK berhasil ditambahkan ke koleksi kalibrasi ROI sempurna!', 'success');
  } catch (err: any) {
    omrStore.showToast(`Gagal menambahkan kalibrasi: ${err.message}`, 'error');
  } finally {
    isPromotingCalibration.value = false;
  }
};

const openDialogDeleteSpecific = () => {
  deleteIdMapel.value = '';
  deleteKodeTes.value = '';
  dialogDeleteSpecific.value = true;
};

const deleteSpecificRecords = async () => {
  if (!deleteIdMapel.value || !deleteKodeTes.value) {
    omrStore.showToast('ID Mapel dan Kode Tes harus diisi', 'warning');
    return;
  }
  
  
  try {
    const scanRecords = await db.scanResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
      String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
    ).toArray();
    const scoreRecords = await db.scoreResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
      String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
    ).toArray();
    
    const scanKeys = scanRecords.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
    const scoreKeys = scoreRecords.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
    
    await db.scanResults.bulkDelete(scanKeys as any);
    await db.scoreResults.bulkDelete(scoreKeys as any);
    
    const count = scanRecords.length;
    
    omrStore.showToast(`${count} data berhasil dihapus`, 'success');
    dialogDeleteSpecific.value = false;
    loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
  }
};


const loadHistory = async () => {
  scanHistoryList.value = await db.scanResults.orderBy('scannedAt').reverse().toArray();
};


const uniqueNPSN = computed(() => new Set(scanHistoryList.value.map(s => s.npsn)).size);
const uniqueMapel = computed(() => new Set(scanHistoryList.value.map(s => s.id_mapel)).size);
const uniqueCombos = computed(() => new Set(scanHistoryList.value.map(s => `${s.id_mapel}-${s.kode_tes}`)).size);

const tableHeaders = computed(() => {
  const headers = [
    { title: 'Waktu Pindai', key: 'scannedAt', sortable: true },
    { title: 'Metode', key: 'engine', sortable: true },
    { title: 'Nama Siswa', key: 'nama_siswa', sortable: true },
    { title: 'NPSN', key: 'npsn', sortable: true },
    { title: 'ID Mapel', key: 'id_mapel', sortable: true },
    { title: 'Kode Tes', key: 'kode_tes', sortable: true },
    { title: 'NISN', key: 'nisn', sortable: true }
  ];
  for (let i = 1; i <= maxQuestions.value; i++) {
    headers.push({ title: `S${i}`, key: `soal_${i}`, sortable: false });
  }
  headers.push({ title: 'Aksi', key: 'actions', sortable: false });
  return headers;
});

const maxQuestions = computed(() => {
  let max = 0;
  for (const item of scanHistoryList.value) {
    if (item.answers) {
      for (const ans of item.answers) {
        if (ans.nomor_soal > max) max = ans.nomor_soal;
      }
    }
  }
  return max;
});

const getAnswerFor = (res: any, n: number) => {
  if (!res.answers) return '-';
  const ans = res.answers.find((a: any) => a.nomor_soal === n);
  if (!ans) return '-';
  return formatAnswer(ans.jawaban);
};

onMounted(async () => {
  await loadHistory();
});

const formatAnswer = (val: any) => {
  if (Array.isArray(val)) return val.length > 0 ? val.join(',') : '-';
  return val || '-';
};

const filteredList = computed(() => {
  if (!search.value) return scanHistoryList.value;
  const s = search.value.toLowerCase();
  return scanHistoryList.value.filter(item => 
    item.npsn.toLowerCase().includes(s) ||
    item.id_mapel.toLowerCase().includes(s) ||
    item.nisn.toLowerCase().includes(s) ||
    (item.nama_siswa && item.nama_siswa.toLowerCase().includes(s)) ||
    (item.engine && item.engine.toLowerCase().includes(s))
  );
});

const openDialogDeleteSingle = (item: any) => {
  const target: ScanResult = (item && item.raw) ? item.raw : item;
  if (!target) return;
  itemToDelete.value = target;
  dialogDeleteSingle.value = true;
};

const executeDeleteSingle = async () => {
  if (!itemToDelete.value) return;
  isDeletingSingle.value = true;
  const target = itemToDelete.value;
  try {
    const npsn = String(target.npsn ?? '').trim();
    const idMapel = String(target.id_mapel ?? '').trim();
    const kodeTes = String(target.kode_tes ?? '').trim();
    const nisn = String(target.nisn ?? '').trim();

    // 1. Hapus menggunakan Compound Primary Key Dexie: [npsn+id_mapel+kode_tes+nisn]
    await db.scanResults.delete([npsn, idMapel, kodeTes, nisn]);
    await db.scoreResults.delete([npsn, idMapel, kodeTes, nisn]);

    // 2. Filter fallback jika ada ketidaksesuaian spasi atau tipe data asli
    await db.scanResults
      .filter(r => 
        String(r.npsn).trim() === npsn &&
        String(r.id_mapel).trim() === idMapel &&
        String(r.kode_tes).trim() === kodeTes &&
        String(r.nisn).trim() === nisn
      )
      .delete();

    await db.scoreResults
      .filter(r => 
        String(r.npsn).trim() === npsn &&
        String(r.id_mapel).trim() === idMapel &&
        String(r.kode_tes).trim() === kodeTes &&
        String(r.nisn).trim() === nisn
      )
      .delete();

    omrStore.showToast(`Data peserta NISN ${nisn} berhasil dihapus`, 'success');
    dialogDeleteSingle.value = false;
    itemToDelete.value = null;
    await loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
  } finally {
    isDeletingSingle.value = false;
  }
};

const confirmDeleteAll = () => {
  confirmDeleteText.value = '';
  dialogDeleteAll.value = true;
};

const deleteAllRecords = async () => {
  try {
    await db.scanResults.clear();
    await db.scoreResults.clear();
    omrStore.showToast('Semua data berhasil dihapus', 'success');
    dialogDeleteAll.value = false;
    loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus semua data: ' + e.message, 'error');
  }
};

const exportCSV = () => {
  if (scanHistoryList.value.length === 0) return;
  
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Waktu,NPSN,ID Mapel,Kode Tes,NISN,Jawaban\n";
  
  scanHistoryList.value.forEach(row => {
    const waktu = new Date(row.scannedAt).toISOString();
    const jawaban = JSON.stringify(row.answers).replace(/"/g, '""'); // escape quotes
    
    csvContent += `"${waktu}","${row.npsn}","${row.id_mapel}","${row.kode_tes}","${row.nisn}","${jawaban}"\n`;
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `hasil_scan_${Date.now()}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
};

const exportJSON = () => {
  if (scanHistoryList.value.length === 0) return;
  
  const data = scanHistoryList.value.map(row => ({
    waktu: new Date(row.scannedAt).toISOString(),
    npsn: row.npsn,
    id_mapel: row.id_mapel,
    kode_tes: row.kode_tes,
    nisn: row.nisn,
    
    jawaban: row.answers
  }));
  
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `hasil_scan_${Date.now()}.json`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
</style>

