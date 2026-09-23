<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold text-grey-darken-3">Hasil Penilaian</h2>
        <p class="text-body-2 text-grey-darken-1">Data nilai dan skor per butir soal berdasarkan hasil koreksi.</p>
      </div>
      <div class="d-flex gap-2 align-center">
        <v-btn color="info" variant="flat" prepend-icon="mdi-check-decagram" :disabled="scanHistoryList.length < 2" @click="openDialogKoreksi" rounded="pill">
          Koreksi
        </v-btn>
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-dots-vertical" variant="text" color="primary" v-bind="props"></v-btn>
          </template>
          <v-list density="compact" class="rounded-lg elevation-3">
            <v-list-item prepend-icon="mdi-export" @click="exportCSV" :disabled="scoreHistoryList.length === 0">
              <v-list-item-title>Ekspor CSV</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-code-json" @click="exportJSON" :disabled="scoreHistoryList.length === 0">
              <v-list-item-title>Ekspor JSON</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-delete-sweep" class="text-error" @click="openDialogDeleteSpecific" :disabled="scoreHistoryList.length === 0">
              <v-list-item-title>Hapus Data Spesifik</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-delete" class="text-error" @click="confirmDeleteAll" :disabled="scoreHistoryList.length === 0">
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
    <v-row class="mb-4" dense>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-blue-lighten-5" elevation="0">
          <v-card-text class="pa-2 text-center">
            <div class="text-caption text-blue-darken-2 font-weight-bold mb-1">Total Data Penilaian</div>
            <div class="text-subtitle-1 font-weight-black text-blue-darken-3">{{ scoreHistoryList.length }}</div>
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
      class="bg-transparent flex-grow-1 text-caption"
    >
      <template v-slot:item.scoredAt="{ item }">
        <span class="text-caption text-grey-darken-1">{{ new Date(item.scoredAt).toLocaleString('id-ID') }}</span>
      </template>
      <template v-slot:item.id_mapel="{ item }">
        <span class="font-weight-medium">{{ item.id_mapel }}</span>
      </template>
      <template v-slot:item.kode_tes="{ item }">
        <span class="font-weight-medium">{{ item.kode_tes }}</span>
      </template>
      <template v-slot:item.nisn="{ item }">
        <span class="font-weight-bold text-primary">{{ item.nisn }}</span>
      </template>
      <template v-slot:item.nilai="{ item }">
        <span class="font-weight-bold" :class="item.nilai !== undefined ? 'text-success' : 'text-grey'">
          {{ item.nilai !== undefined ? item.nilai : '-' }}
        </span>
      </template>

      <!-- Dinamis kolom jawaban -->
      <template v-for="n in scoredQuestions" :key="'soal'+n" v-slot:[`item.soal_${n}`]="{ item }">
        <span :class="getScoreClass(item, n)" class="font-weight-medium">
          {{ getScoreFor(item, n) }}
        </span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          icon="mdi-delete-outline"
          size="small"
          variant="text"
          color="error"
          title="Hapus data penilaian ini"
          @click.stop="openDialogDeleteSingle(item)"
        ></v-btn>
      </template>

      <template v-slot:no-data>
        <div class="text-center pa-8 text-grey">
          <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
          <br>
          Belum ada data nilai atau tidak ada yang cocok dengan pencarian.
        </div>
      </template>
    </v-data-table>

    </v-card>

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
    
    <!-- Dialog Hapus Semua -->
    <v-dialog v-model="dialogDeleteAll" max-width="400">
      <v-card class="rounded-xl border" elevation="0">
        <v-card-title class="font-weight-bold pt-4 px-4 bg-error text-white">
          Hapus Semua Data
        </v-card-title>
        <v-card-text class="pa-4">
          <p>Anda yakin ingin menghapus <strong>semua data hasil penilaian</strong>? Data hasil pemindaian (mentah) akan tetap dipertahankan.</p>
          <div class="mt-4">Ketik <b>HAPUS</b> untuk mengonfirmasi.</div>
          <v-text-field v-model="confirmDeleteText" variant="outlined" density="compact" class="mt-2" hide-details></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDeleteAll = false">Batal</v-btn>
          <v-btn color="error" variant="flat" :disabled="confirmDeleteText !== 'HAPUS'" @click="deleteAllRecords">Hapus Semua</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Dialog Koreksi -->
    <v-dialog v-model="dialogKoreksi" max-width="500">
      <v-card class="rounded-xl border" elevation="0">
        <v-card-title class="font-weight-bold pt-4 px-4 bg-grey-lighten-4 border-b">
          Koreksi Data
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-2 mb-4">Pilih data pemindaian yang akan dijadikan sebagai <b>Kunci Jawaban</b>.</div>
          <v-select
            v-model="kunciId"
            :items="scanHistoryList"
            :item-title="(item: any) => `${item.nisn}${item.nama_siswa ? ' - ' + item.nama_siswa : ''}${item.is_ground_truth ? ' ⭐ [Ground Truth]' : ''}`"
            :item-value="(item: any) => getUniqueId(item)"
            label="Pilih Kunci Jawaban (NISN)"
            variant="outlined"
            density="comfortable"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :title="`${item.raw.nisn}${item.raw.nama_siswa ? ' - ' + item.raw.nama_siswa : ''}`"
                :subtitle="`Mapel: ${item.raw.id_mapel} | Tes: ${item.raw.kode_tes}${item.raw.is_ground_truth ? ' • Acuan Ground Truth' : ''}`"
              >
                <template v-slot:append v-if="item.raw.is_ground_truth">
                  <v-chip color="amber-darken-3" size="x-small" variant="flat">Ground Truth</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <div class="text-subtitle-2 font-weight-bold mt-4 mb-2">Penskoran Pilihan Ganda Kompleks</div>
          <v-radio-group v-model="mcqComplexMode" density="comfortable" hide-details class="mt-2">
            <v-radio label="Ketat (Harus sama persis)" value="strict"></v-radio>
            <v-radio label="Longgar (Parsial tanpa nilai negatif)" value="loose"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogKoreksi = false">Batal</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="px-6" @click="processKoreksi" :loading="isKoreksi">Proses Koreksi</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Konfirmasi Hapus Penilaian Tunggal -->
    <v-dialog v-model="dialogDeleteSingle" max-width="440">
      <v-card class="rounded-xl border" elevation="4">
        <v-card-title class="pa-4 bg-red-lighten-5 text-error d-flex align-center font-weight-bold">
          <v-icon start icon="mdi-delete-alert" class="mr-2"></v-icon>
          Hapus Data Penilaian?
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 text-grey-darken-3 mb-3">
            Apakah Anda yakin ingin menghapus data nilai siswa berikut?
          </p>
          <div class="bg-grey-lighten-4 pa-3 rounded-lg border text-caption">
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
            <div class="d-flex justify-space-between mb-1">
              <span class="text-grey-darken-1">Nilai Akhir:</span>
              <strong class="font-weight-bold text-success">{{ itemToDelete?.nilai !== undefined ? itemToDelete?.nilai : '-' }}</strong>
            </div>
          </div>
          <p class="text-caption text-error font-weight-medium mt-3 mb-0">
            * Data penilaian siswa ini akan dihapus dari riwayat koreksi.
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
            Hapus Nilai
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { db, type ScanResult, type ScoreResult, seedGroundTruthIfMissing } from '../db/database';

import { useOmrStore } from '../store/omrStore';
const omrStore = useOmrStore();

const dialogDeleteAll = ref(false);
const confirmDeleteText = ref('');
const dialogDeleteSpecific = ref(false);
const deleteIdMapel = ref('');
const deleteKodeTes = ref('');

const dialogDeleteSingle = ref(false);
const itemToDelete = ref<ScoreResult | null>(null);
const isDeletingSingle = ref(false);

const openDialogDeleteSingle = (item: any) => {
  const target: ScoreResult = (item && item.raw) ? item.raw : item;
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

    // Hapus via compound primary key
    await db.scoreResults.delete([npsn, idMapel, kodeTes, nisn]);

    // Fallback filter
    await db.scoreResults
      .filter(r => 
        String(r.npsn).trim() === npsn &&
        String(r.id_mapel).trim() === idMapel &&
        String(r.kode_tes).trim() === kodeTes &&
        String(r.nisn).trim() === nisn
      )
      .delete();

    omrStore.showToast(`Data nilai siswa NISN ${nisn} berhasil dihapus`, 'success');
    dialogDeleteSingle.value = false;
    itemToDelete.value = null;
    await loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus data nilai: ' + e.message, 'error');
  } finally {
    isDeletingSingle.value = false;
  }
};

const dialogKoreksi = ref(false);
const kunciId = ref<string>('');
const mcqComplexMode = ref('strict');
const isKoreksi = ref(false);

const getUniqueId = (res: ScanResult) => `${res.npsn}_${res.id_mapel}_${res.kode_tes}_${res.nisn}`;

const openDialogKoreksi = () => {
  if (scanHistoryList.value.length > 0) {
    kunciId.value = getUniqueId(scanHistoryList.value[0]);
  }
  dialogKoreksi.value = true;
};

const processKoreksi = async () => {
  isKoreksi.value = true;
  try {
    const keyRecord = scanHistoryList.value.find(res => getUniqueId(res) === kunciId.value);
    if (!keyRecord) throw new Error("Kunci jawaban tidak ditemukan.");

    const keyAnswers = keyRecord.answers;
    
    // Process only scans with matching npsn, id_mapel, and kode_tes
    const targets = scanHistoryList.value.filter(res => 
      res.npsn === keyRecord.npsn && 
      res.id_mapel === keyRecord.id_mapel && 
      res.kode_tes === keyRecord.kode_tes
    );

    if (targets.length === 0) {
      omrStore.showToast("Tidak ada data yang cocok dengan kunci ini.", "warning");
      isKoreksi.value = false;
      return;
    }

    for (const res of targets) {
      let totalScore = 0;
      let totalQuestions = 0;
      let itemScores: { [key: number]: number } = {};
      
      for (const keyAns of keyAnswers) {
        if (keyAns.bentuk_soal === 'skala' || keyAns.bentuk_soal === 'likert') continue;
        
        totalQuestions++;
        let itemScore = 0;
        
        const userAns = res.answers.find((a: any) => a.nomor_soal === keyAns.nomor_soal);
        if (!userAns) {
          itemScores[keyAns.nomor_soal] = 0;
          continue;
        }
        
        if (keyAns.bentuk_soal === 'bs3' || keyAns.bentuk_soal === 'yt3') {
          const userArr = Array.isArray(userAns.jawaban) ? userAns.jawaban : [];
          const keyArr = Array.isArray(keyAns.jawaban) ? keyAns.jawaban : [];
          
          if (mcqComplexMode.value === 'strict') {
            if (userArr.length === keyArr.length && userArr.every((v: string, i: number) => v === keyArr[i])) {
              itemScore = 1;
            }
          } else if (mcqComplexMode.value === 'loose') {
            if (keyArr.length > 0) {
              const correct = userArr.filter((v: string, i: number) => v === keyArr[i] && v !== '-').length;
              itemScore = correct / keyArr.length;
            }
          }
        } else if (keyAns.bentuk_soal === 'kompleks' || keyAns.bentuk_soal === 'mcq_complex') {
          const userArr = Array.isArray(userAns.jawaban) ? userAns.jawaban : [];
          const keyArr = Array.isArray(keyAns.jawaban) ? keyAns.jawaban : [];
          
          if (mcqComplexMode.value === 'strict') {
            if (userArr.length === keyArr.length && userArr.every((v: string) => keyArr.includes(v))) {
              itemScore = 1;
            }
          } else if (mcqComplexMode.value === 'loose') {
            if (keyArr.length > 0) {
              const correctChosen = userArr.filter((v: string) => keyArr.includes(v)).length;
              const wrongChosen = userArr.filter((v: string) => !keyArr.includes(v)).length;
              itemScore = Math.max(0, (correctChosen - wrongChosen) / keyArr.length);
            }
          }
        } else {
          // Compare strings directly, ignoring whitespace. If answer is '-', it's wrong.
          const userVal = String(userAns.jawaban || '').trim();
          const keyVal = String(keyAns.jawaban || '').trim();
          
          if (userVal === keyVal && keyVal !== '-' && keyVal !== '') {
            itemScore = 1;
          }
        }
        
        itemScores[keyAns.nomor_soal] = itemScore;
        totalScore += itemScore;
      }
      
      let nilai = 0;
      if (totalQuestions > 0) {
        nilai = Number(((totalScore / totalQuestions) * 100).toFixed(2));
      }
      
      await db.scoreResults.put({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn,
        nilai: nilai,
        itemScores: itemScores,
        scoredAt: Date.now(),
        isKey: res.nisn === keyRecord.nisn
      });
    }
    
    omrStore.showToast('Koreksi data berhasil', 'success');
    dialogKoreksi.value = false;
    await loadHistory();
  } catch (e: any) {
    omrStore.showToast('Koreksi gagal: ' + e.message, 'error');
  } finally {
    isKoreksi.value = false;
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
    const records = await db.scoreResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
      String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
    ).toArray();
    const keys = records.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
    
    await db.scoreResults.bulkDelete(keys as any);
    const count = records.length;
    
    omrStore.showToast(`${count} data penilaian berhasil dihapus`, 'success');
    dialogDeleteSpecific.value = false;
    loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus data penilaian: ' + e.message, 'error');
  }
};

const confirmDeleteAll = () => {
  confirmDeleteText.value = '';
  dialogDeleteAll.value = true;
};

const deleteAllRecords = async () => {
  try {
    await db.scoreResults.clear();
    omrStore.showToast('Semua data penilaian berhasil dihapus', 'success');
    dialogDeleteAll.value = false;
    loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus semua data penilaian: ' + e.message, 'error');
  }
};


const scanHistoryList = ref<ScanResult[]>([]);
const scoreHistoryList = ref<ScoreResult[]>([]);
const search = ref('');

const loadHistory = async () => {
  scanHistoryList.value = await db.scanResults.orderBy('scannedAt').reverse().toArray();
  scoreHistoryList.value = await db.scoreResults.orderBy('scoredAt').reverse().toArray();
};


const tableHeaders = computed(() => {
  const headers = [
    { title: 'Waktu', key: 'scoredAt', sortable: true },
    { title: 'NPSN', key: 'npsn', sortable: true },
    { title: 'Mapel', key: 'id_mapel', sortable: true },
    { title: 'Tes', key: 'kode_tes', sortable: true },
    { title: 'NISN', key: 'nisn', sortable: true },
    { title: 'Nilai', key: 'nilai', sortable: true }
  ];
  for (const n of scoredQuestions.value) {
    headers.push({ title: `S${n}`, key: `soal_${n}`, sortable: false });
  }
  headers.push({ title: 'Aksi', key: 'actions', sortable: false });
  return headers;
});

const scoredQuestions = computed(() => {
  const set = new Set<number>();
  for (const item of scoreHistoryList.value) {
    if (item.itemScores) {
      for (const num of Object.keys(item.itemScores)) {
        set.add(Number(num));
      }
    }
  }
  return Array.from(set).sort((a, b) => a - b);
});

const getScoreFor = (res: any, n: number) => {
  if (!res.itemScores || res.itemScores[n] === undefined) return '-';
  const score = res.itemScores[n];
  return score % 1 === 0 ? score : score.toFixed(2);
};

const getScoreClass = (res: any, n: number) => {
  if (!res.itemScores || res.itemScores[n] === undefined) return 'text-grey-lighten-1';
  const score = res.itemScores[n];
  if (score === 1) return 'text-success';
  if (score === 0) return 'text-error';
  return 'text-warning';
};

onMounted(async () => {
  await seedGroundTruthIfMissing();
  await loadHistory();
});

const filteredList = computed(() => {
  if (!search.value) return scoreHistoryList.value;
  const s = search.value.toLowerCase();
  return scoreHistoryList.value.filter(item => 
    item.npsn.toLowerCase().includes(s) ||
    item.id_mapel.toLowerCase().includes(s) ||
    item.nisn.toLowerCase().includes(s)
  );
});

const exportCSV = () => {
  if (scoreHistoryList.value.length === 0) return;
  
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Headers
  const questions = scoredQuestions.value;
  let headers = ["Waktu", "NPSN", "ID Mapel", "Kode Tes", "NISN", "Nilai"];
  questions.forEach(q => headers.push(`Soal ${q}`));
  csvContent += headers.join(",") + "\n";
  
  scoreHistoryList.value.forEach(row => {
    const waktu = new Date(row.scoredAt).toISOString();
    const nilai = row.nilai !== undefined ? row.nilai : '';
    
    let rowData = [
      `"${waktu}"`, `"${row.npsn}"`, `"${row.id_mapel}"`, 
      `"${row.kode_tes}"`, `"${row.nisn}"`, `"${nilai}"`
    ];
    
    questions.forEach(q => {
      let scoreStr = '';
      if (row.itemScores && row.itemScores[q] !== undefined) {
        const score = row.itemScores[q];
        scoreStr = (score % 1 === 0 ? score : score.toFixed(2)).toString();
      }
      rowData.push(`"${scoreStr}"`);
    });
    
    csvContent += rowData.join(",") + "\n";
  });
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `hasil_nilai_${Date.now()}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
};

const exportJSON = () => {
  if (scoreHistoryList.value.length === 0) return;
  
  const data = scoreHistoryList.value.map(row => ({
    waktu: new Date(row.scoredAt).toISOString(),
    npsn: row.npsn,
    id_mapel: row.id_mapel,
    kode_tes: row.kode_tes,
    nisn: row.nisn,
    nilai: row.nilai,
    itemScores: row.itemScores || {}
  }));
  
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `hasil_nilai_${Date.now()}.json`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
</script>

<style scoped>
.hover-bg-grey:hover {
  background-color: #f8fafc;
}
</style>
