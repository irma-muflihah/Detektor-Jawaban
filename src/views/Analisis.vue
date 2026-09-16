<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <div class="d-flex justify-space-between align-center mb-4">
      <div>
        <h1 class="text-h5 font-weight-bold text-primary mb-1">Analisis Data</h1>
        <p class="text-body-2 text-grey-darken-1">Analisis butir soal dan hasil asesmen.</p>
      </div>
      <div class="d-flex gap-3" v-if="analysisResults.length > 0">
        <v-menu location="bottom end">
          <template v-slot:activator="{ props }">
            <v-btn color="primary" variant="flat" prepend-icon="mdi-export" v-bind="props" rounded="pill" class="text-none">Ekspor</v-btn>
          </template>
          <v-list density="compact" class="rounded-lg elevation-3">
            <v-list-item prepend-icon="mdi-file-pdf-box" @click="exportToPDF">
              <v-list-item-title>Ekspor Laporan PDF</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-file-excel" @click="exportCSV">
              <v-list-item-title>Ekspor CSV Butir Soal</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-code-json" @click="exportJSON">
              <v-list-item-title>Ekspor JSON Butir Soal</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </div>

    <!-- Pilihan Mapel dan Tes -->
    <v-card class="rounded-xl border mb-4 flex-shrink-0" elevation="0">
      <v-card-text class="pa-4">
        <v-row align="center">
          <v-col cols="12" md="5">
            <v-select
              v-model="selectedCombination"
              :items="availableCombinations"
              item-title="label"
              item-value="value"
              label="Pilih ID Mapel & Kode Tes"
              variant="outlined"
              density="compact"
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field v-model.number="batasKetuntasan" label="Batas Ketuntasan" variant="outlined" density="compact" hide-details type="number"></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="d-flex align-center">
            <v-btn
              color="primary"
              variant="flat"
              class="px-6 rounded-pill text-none"
              @click="processAnalysis"
              :disabled="!selectedCombination"
              :loading="isProcessing"
            >
              Proses Analisis
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <div v-if="analysisResults.length > 0" id="analysis-report" class="flex-grow-1 overflow-y-auto pa-2 bg-white rounded-xl border">
      <v-row class="ma-0">
        <!-- Analisis Hasil Asesmen -->
        <v-col cols="12" class="pb-0">
          <h2 class="text-h6 font-weight-bold mb-3 text-primary">Analisis Hasil Asesmen</h2>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card class="rounded-lg border h-100 bg-grey-lighten-4" elevation="0">
            <v-card-text class="pa-3">
              <h3 class="text-subtitle-2 font-weight-bold mb-2">Statistik Nilai</h3>
              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Rata-rata</v-list-item-title><template v-slot:append><strong class="text-body-2">{{ stats.mean.toFixed(2) }}</strong></template></v-list-item>
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Nilai Tertinggi</v-list-item-title><template v-slot:append><strong class="text-body-2">{{ stats.max.toFixed(2) }}</strong></template></v-list-item>
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Nilai Terendah</v-list-item-title><template v-slot:append><strong class="text-body-2">{{ stats.min.toFixed(2) }}</strong></template></v-list-item>
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Total Peserta</v-list-item-title><template v-slot:append><strong class="text-body-2">{{ stats.count }}</strong></template></v-list-item>
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Tuntas (>= {{batasKetuntasan}})</v-list-item-title><template v-slot:append><strong class="text-success text-body-2">{{ stats.passed }} ({{ ((stats.passed/stats.count)*100).toFixed(1) }}%)</strong></template></v-list-item>
                <v-list-item class="px-0 min-h-0"><v-list-item-title class="text-body-2">Tidak Tuntas (< {{batasKetuntasan}})</v-list-item-title><template v-slot:append><strong class="text-error text-body-2">{{ stats.failed }} ({{ ((stats.failed/stats.count)*100).toFixed(1) }}%)</strong></template></v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="8">
          <v-card class="rounded-lg border h-100" elevation="0">
            <v-card-text class="pa-3">
              <h3 class="text-subtitle-2 font-weight-bold mb-2">Distribusi Nilai (Histogram)</h3>
              <div style="height: 180px; position: relative;">
                <Bar :data="chartData" :options="chartOptions" v-if="chartReady" />
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Statistik Predikat -->
        <v-col cols="12" md="12" class="pt-4">
          <v-card class="rounded-lg border" elevation="0">
            <v-card-title class="bg-primary text-white text-subtitle-2 font-weight-bold pa-2">
              Distribusi Predikat
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="compact" class="bg-transparent text-caption">
                <thead><tr><th class="font-weight-bold">Predikat</th><th class="font-weight-bold">Rentang Nilai</th><th class="font-weight-bold text-center">Jumlah Siswa</th></tr></thead>
                <tbody>
                  <tr><td>Sangat Baik</td><td>90 - 100</td><td class="text-center font-weight-bold text-success">{{ predicates.sangatBaik }}</td></tr>
                  <tr><td>Baik</td><td>80 - 89</td><td class="text-center font-weight-bold text-primary">{{ predicates.baik }}</td></tr>
                  <tr><td>Cukup</td><td>70 - 79</td><td class="text-center font-weight-bold text-warning">{{ predicates.cukup }}</td></tr>
                  <tr><td>Kurang</td><td>< 70</td><td class="text-center font-weight-bold text-error">{{ predicates.kurang }}</td></tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Daftar Pengayaan dan Remedial -->
        <v-col cols="12" md="6" class="pt-4">
          <v-card class="rounded-lg border" elevation="0">
            <v-card-title class="bg-success text-white text-subtitle-2 font-weight-bold pa-2">
              Program Pengayaan (Nilai >= 90) ({{ enrichmentStudents.length }})
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="compact" class="bg-transparent text-caption">
                <thead><tr><th class="font-weight-bold">NISN</th><th class="font-weight-bold text-right">Nilai</th></tr></thead>
                <tbody>
                  <tr v-for="s in enrichmentStudents" :key="s.nisn">
                    <td>{{ s.nisn }}</td><td class="text-right">{{ s.nilai }}</td>
                  </tr>
                  <tr v-if="enrichmentStudents.length === 0">
                    <td colspan="2" class="text-center text-grey">Tidak ada data</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6" class="pt-4">
          <v-card class="rounded-lg border" elevation="0">
            <v-card-title class="bg-error text-white text-subtitle-2 font-weight-bold pa-2">
              Program Remidial (Nilai < {{batasKetuntasan}}) ({{ remedialStudents.length }})
            </v-card-title>
            <v-card-text class="pa-0">
              <v-table density="compact" class="bg-transparent text-caption">
                <thead><tr><th class="font-weight-bold">NISN</th><th class="font-weight-bold text-right">Nilai</th></tr></thead>
                <tbody>
                  <tr v-for="s in remedialStudents" :key="s.nisn">
                    <td>{{ s.nisn }}</td><td class="text-right">{{ s.nilai }}</td>
                  </tr>
                  <tr v-if="remedialStudents.length === 0">
                    <td colspan="2" class="text-center text-grey">Tidak ada data</td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Analisis Butir Soal -->
        <v-col cols="12" class="mt-6">
          <h2 class="text-h6 font-weight-bold mb-3 text-primary">Analisis Butir Soal</h2>
          <v-card class="rounded-lg border" elevation="0">
            <v-card-text class="pa-0">
              
              <v-data-table
                :headers="analysisHeaders"
                :items="analysisResults"
                :items-per-page="printMode ? -1 : itemsPerPage"
                @update:itemsPerPage="itemsPerPage = $event"
                :items-per-page-options="[10, 25, 50, 100, -1]"
                show-current-page
                density="compact"
                class="bg-transparent text-caption"
              >
                <template v-slot:item.nomor_soal="{ item }">
                  <span class="font-weight-medium">S-{{ item.nomor_soal }}</span>
                </template>
                <template v-slot:item.p_value="{ item }">
                  <span :class="getPColor(item.p_value)">{{ item.p_value.toFixed(2) }} ({{ item.p_category }})</span>
                </template>
                <template v-slot:item.d_value="{ item }">
                  <span :class="getDColor(item.d_value)">{{ item.d_value.toFixed(2) }} ({{ item.d_category }})</span>
                </template>
                <template v-slot:item.distractors="{ item }">
                  <div class="d-flex flex-wrap gap-1 py-1">
                    <span v-for="(count, opt) in item.distractor_counts" :key="opt" 
                          class="px-1 rounded border"
                          :class="opt === item.key_answer ? 'bg-success-lighten-4 border-success font-weight-bold' : 'bg-grey-lighten-4 border-grey-lighten-2'">
                      {{ opt }}: {{ count }}
                    </span>
                  </div>
                  <div class="text-error mt-1" style="font-size: 10px;" v-if="item.bad_distractors && item.bad_distractors.length > 0">
                    Pengecoh tidak berfungsi: {{ item.bad_distractors.join(', ') }}
                  </div>
                </template>
                <template v-slot:item.decision="{ item }">
                  <v-chip :color="getDecisionColor(item.decision)" size="x-small" class="font-weight-bold">
                    {{ item.decision }}
                  </v-chip>
                </template>
              </v-data-table>

            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Dialog Print PDF -->
    <v-dialog v-model="dialogPrintPDF" max-width="400">
      <v-card class="rounded-xl border" elevation="0">
        <v-card-title class="font-weight-bold pt-4 px-4 bg-grey-lighten-4 border-b">
          Cetak Laporan
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-2 mb-4">Pilih ukuran kertas untuk mencetak laporan analisis. (Gunakan fitur "Save as PDF" di browser Anda).</div>
          <v-select
            v-model="selectedPaperSize"
            :items="[{ title: 'A4 (210 x 297 mm)', value: 'A4' }, { title: 'F4 / Folio (215.9 x 330.2 mm)', value: 'F4' }]"
            label="Ukuran Kertas"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogPrintPDF = false">Batal</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="px-6" @click="executePrint">Cetak / PDF</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ref, onMounted, watch } from 'vue';
import { db } from '../db/database';
import { useOmrStore } from '../store/omrStore';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const omrStore = useOmrStore();

const availableCombinations = ref<{label: string, value: string}[]>([]);
const selectedCombination = ref<string>('');
const batasKetuntasan = ref<number>(75);


watch(selectedCombination, async (val) => {
  if (!val) return;
  const [id_mapel, kode_tes] = val.split('|');
  const scoreRecords = await db.scoreResults.filter(item => 
    String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
    String(item.kode_tes).replace(/^0+/, '') === kode_tes &&
    !item.isKey
  ).toArray();
  
  if (scoreRecords.length >= 2) {
    const scores = scoreRecords.map(s => s.nilai);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    // Algoritma Penentuan Rekomendasi Batas Ketuntasan (PAN: Mean - 1 StdDev)
    let suggested = Math.round(mean - stdDev);
    if (suggested < 50) suggested = 60;
    if (suggested > 85) suggested = 75;
    if (isNaN(suggested) || suggested <= 0) suggested = 75;
    
    batasKetuntasan.value = suggested;
  } else {
    batasKetuntasan.value = 75;
  }
});

const isProcessing = ref(false);

const analysisResults = ref<any[]>([]);

const analysisHeaders = [
  { title: 'No', key: 'nomor_soal', sortable: true },
  { title: 'Tingkat Kesukaran (P)', key: 'p_value', sortable: true },
  { title: 'Daya Pembeda (D)', key: 'd_value', sortable: true },
  { title: 'Pola Jawaban', key: 'distractors', sortable: false },
  { title: 'Keputusan', key: 'decision', sortable: true }
];

const stats = ref({ mean: 0, max: 0, min: 0, count: 0, passed: 0, failed: 0 });
const predicates = ref({ sangatBaik: 0, baik: 0, cukup: 0, kurang: 0 });
const enrichmentStudents = ref<any[]>([]);
const remedialStudents = ref<any[]>([]);

const chartReady = ref(false);
const chartData = ref<any>({ labels: [], datasets: [] });
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, ticks: { stepSize: 1 } }
  }
};

onMounted(async () => {
  await loadCombinations();
});

const loadCombinations = async () => {
  try {
    const scores = await db.scoreResults.toArray();
    const combos = new Set<string>();
    scores.forEach(s => {
      // Clean leading zeros to match uniformly
      const id = String(s.id_mapel).replace(/^0+/, '');
      const kt = String(s.kode_tes).replace(/^0+/, '');
      combos.add(`${id}|${kt}`);
    });
    
    availableCombinations.value = Array.from(combos).map(c => {
      const [id_mapel, kode_tes] = c.split('|');
      return {
        label: `ID Mapel: ${id_mapel} - Kode Tes: ${kode_tes}`,
        value: c
      };
    });
  } catch (error) {
    console.error(error);
  }
};

const processAnalysis = async () => {
  if (!selectedCombination.value) return;
  isProcessing.value = true;
  chartReady.value = false;
  
  const [id_mapel, kode_tes] = selectedCombination.value.split('|');
  
  try {
    const scoreRecords = await db.scoreResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
      String(item.kode_tes).replace(/^0+/, '') === kode_tes &&
      !item.isKey
    ).toArray();
    
    const scanRecords = await db.scanResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
      String(item.kode_tes).replace(/^0+/, '') === kode_tes
    ).toArray();
    
    if (scoreRecords.length < 2) {
      omrStore.showToast('Minimal diperlukan 2 data nilai untuk melakukan analisis.', 'warning');
      isProcessing.value = false;
      return;
    }
    
    // Process Assessment Analysis
    scoreRecords.sort((a, b) => b.nilai - a.nilai);
    
    let sum = 0;
    let max = -1;
    let min = 101;
    let passed = 0;
    let failed = 0;
    
    enrichmentStudents.value = [];
    remedialStudents.value = [];
    predicates.value = { sangatBaik: 0, baik: 0, cukup: 0, kurang: 0 };
    
    // Histogram bins: 0-10, 11-20, ... 91-100
    const bins = new Array(10).fill(0);
    const binLabels = ['0-10','11-20','21-30','31-40','41-50','51-60','61-70','71-80','81-90','91-100'];

    scoreRecords.forEach(r => {
      sum += r.nilai;
      if (r.nilai > max) max = r.nilai;
      if (r.nilai < min) min = r.nilai;
      
      if (r.nilai >= batasKetuntasan.value) {
        passed++;
      } else {
        failed++;
        remedialStudents.value.push(r);
      }
      
      if (r.nilai >= 90) {
        enrichmentStudents.value.push(r);
        predicates.value.sangatBaik++;
      } else if (r.nilai >= 80) {
        predicates.value.baik++;
      } else if (r.nilai >= 70) {
        predicates.value.cukup++;
      } else {
        predicates.value.kurang++;
      }
      
      let binIdx = Math.floor((r.nilai - 1) / 10);
      if (r.nilai === 0) binIdx = 0;
      if (binIdx < 0) binIdx = 0;
      if (binIdx > 9) binIdx = 9;
      bins[binIdx]++;
    });
    
    stats.value = {
      mean: sum / scoreRecords.length,
      max: max,
      min: min,
      count: scoreRecords.length,
      passed,
      failed
    };
    
    chartData.value = {
      labels: binLabels,
      datasets: [{
        label: 'Jumlah Siswa',
        data: bins,
        backgroundColor: '#3b82f6',
        borderRadius: 4
      }]
    };

    // Item Analysis (P, D, Distractors)
    const N = scoreRecords.length;
    let groupSize = Math.round(N * 0.27);
    if (N < 30) groupSize = Math.floor(N / 2);
    if (groupSize < 1) groupSize = 1;
    
    const upperGroup = scoreRecords.slice(0, groupSize);
    const lowerGroup = scoreRecords.slice(N - groupSize, N);
    
    const allQuestions = new Set<number>();
    scoreRecords.forEach(r => {
      if (r.itemScores) Object.keys(r.itemScores).forEach(q => allQuestions.add(Number(q)));
    });
    const questions = Array.from(allQuestions).sort((a, b) => a - b);
    
    const results = [];
    
    for (const q of questions) {
      let totalCorrect = 0;
      let upperCorrect = 0;
      let lowerCorrect = 0;
      
      scoreRecords.forEach(r => { if (r.itemScores && r.itemScores[q] > 0) totalCorrect++; });
      upperGroup.forEach(r => { if (r.itemScores && r.itemScores[q] > 0) upperCorrect++; });
      lowerGroup.forEach(r => { if (r.itemScores && r.itemScores[q] > 0) lowerCorrect++; });
      
      const p = totalCorrect / N;
      let pCategory = '';
      if (p <= 0.30) pCategory = 'Sukar';
      else if (p <= 0.70) pCategory = 'Sedang';
      else pCategory = 'Mudah';
      
      const d = (upperCorrect - lowerCorrect) / groupSize;
      let dCategory = '';
      if (d >= 0.40) dCategory = 'Sangat Baik';
      else if (d >= 0.30) dCategory = 'Baik';
      else if (d >= 0.20) dCategory = 'Cukup';
      else dCategory = 'Jelek';
      
      // Distractor Analysis
      const distractorCounts: Record<string, number> = {};
      let keyAnswer = '';
      
      scanRecords.forEach(scan => {
        const userAns = scan.answers?.find((a: any) => a.nomor_soal === q);
        if (userAns && userAns.jawaban !== undefined) {
          let ansStr = String(userAns.jawaban).trim();
          if (ansStr === '') ansStr = '-';
          if (!distractorCounts[ansStr]) distractorCounts[ansStr] = 0;
          distractorCounts[ansStr]++;
          
          // Try to deduce key answer by finding a corresponding perfect score
          const score = scoreRecords.find(s => s.nisn === scan.nisn);
          if (score && score.itemScores && score.itemScores[q] === 1) {
            keyAnswer = ansStr;
          }
        }
      });
      
      // Find bad distractors (chosen by < 5% of respondents)
      const badDistractors: string[] = [];
      const threshold = N * 0.05;
      Object.keys(distractorCounts).forEach(opt => {
        if (opt !== keyAnswer && distractorCounts[opt] < threshold && opt !== '-') {
          badDistractors.push(opt);
        }
      });
      
      let decision = 'Gunakan';
      if (dCategory === 'Jelek') {
        decision = 'Buang/Revisi Total';
      } else if (dCategory === 'Cukup') {
        decision = 'Revisi';
      } else if (pCategory === 'Sukar' || pCategory === 'Mudah') {
        if (dCategory === 'Baik' || dCategory === 'Sangat Baik') decision = 'Gunakan (Pengecoh Baik)';
        else decision = 'Revisi';
      }
      
      if (badDistractors.length > 0 && decision === 'Gunakan') {
        decision = 'Revisi Pengecoh';
      }
      
      results.push({
        nomor_soal: q,
        total_correct: totalCorrect,
        p_value: p,
        p_category: pCategory,
        d_value: d,
        d_category: dCategory,
        distractor_counts: distractorCounts,
        bad_distractors: badDistractors,
        key_answer: keyAnswer,
        decision: decision
      });
    }
    
    analysisResults.value = results;
    
    setTimeout(() => { chartReady.value = true; }, 100);
    omrStore.showToast('Analisis berhasil diproses.', 'success');
    
  } catch (error: any) {
    omrStore.showToast('Gagal memproses analisis: ' + error.message, 'error');
  } finally {
    isProcessing.value = false;
  }
};

const getPColor = (p: number) => {
  if (p <= 0.30 || p > 0.70) return 'text-warning font-weight-bold';
  return 'text-success font-weight-bold';
};

const getDColor = (d: number) => {
  if (d < 0.20) return 'text-error font-weight-bold';
  if (d < 0.30) return 'text-warning font-weight-bold';
  return 'text-success font-weight-bold';
};

const getDecisionColor = (decision: string) => {
  if (decision.includes('Buang')) return 'error';
  if (decision.includes('Revisi')) return 'warning';
  return 'success';
};

const exportCSV = () => {
  if (analysisResults.value.length === 0) return;
  const rows = [
    ['Nomor Soal', 'Tingkat Kesukaran (P)', 'Kategori P', 'Daya Pembeda (D)', 'Kategori D', 'Pengecoh Buruk', 'Keputusan']
  ];
  
  analysisResults.value.forEach(item => {
    rows.push([
      item.nomor_soal.toString(),
      item.p_value.toFixed(3),
      item.p_category,
      item.d_value.toFixed(3),
      item.d_category,
      item.bad_distractors.join('; '),
      item.decision
    ]);
  });
  
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', 'analisis_butir_soal.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportJSON = () => {
  if (analysisResults.value.length === 0) return;
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(analysisResults.value, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', 'analisis_butir_soal.json');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const itemsPerPage = ref(10);
const printMode = ref(false);
const dialogPrintPDF = ref(false);
const selectedPaperSize = ref('A4');

const exportToPDF = () => {
  dialogPrintPDF.value = true;
};

const executePrint = () => {
  dialogPrintPDF.value = false;
  omrStore.showToast('Membuat PDF, mohon tunggu...', 'info');

  const isA4 = selectedPaperSize.value === 'A4';
  const format = isA4 ? 'a4' : [215.9, 330.2]; // F4 dimensions in mm
  const doc = new jsPDF('p', 'mm', format);
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  const [id_mapel, kode_tes] = selectedCombination.value ? selectedCombination.value.split('|') : ['-', '-'];
  const tplName = omrStore.activeTemplate.name || 'LJK Standard';

  // Title & Header Info
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('LAPORAN ANALISIS DATA ASESMEN & BUTIR SOAL', 15, currentY);
  currentY += 7;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`ID Mapel: ${id_mapel} | Kode Tes: ${kode_tes} | LJK: ${tplName} | Batas Ketuntasan: ${batasKetuntasan.value}`, 15, currentY);
  currentY += 10;

  // 1. Ringkasan Statistik Nilai & Grafik Histogram
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. Ringkasan Statistik Nilai & Distribusi', 15, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const statsTexts = [
    `Rata-rata Nilai: ${stats.value.mean.toFixed(2)}`,
    `Nilai Tertinggi: ${stats.value.max.toFixed(2)}`,
    `Nilai Terendah: ${stats.value.min.toFixed(2)}`,
    `Total Peserta: ${stats.value.count} siswa`,
    `Tuntas (>= ${batasKetuntasan.value}): ${stats.value.passed} (${((stats.value.passed/stats.value.count)*100).toFixed(1)}%)`,
    `Tidak Tuntas (< ${batasKetuntasan.value}): ${stats.value.failed} (${((stats.value.failed/stats.value.count)*100).toFixed(1)}%)`
  ];

  let statsStartY = currentY;
  statsTexts.forEach(line => {
    doc.text(line, 15, statsStartY);
    statsStartY += 5;
  });

  // Capture Histogram Chart Canvas Image
  const canvasEl = document.querySelector('#analysis-report canvas') as HTMLCanvasElement;
  if (canvasEl) {
    try {
      const chartImgData = canvasEl.toDataURL('image/png');
      doc.addImage(chartImgData, 'PNG', 110, currentY - 2, 85, 38);
    } catch (err) {
      console.error('Gagal memasukkan grafik histogram ke PDF:', err);
    }
  }

  currentY = Math.max(statsStartY, currentY + 40) + 6;

  // 2. Distribusi Predikat Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. Distribusi Predikat', 15, currentY);
  currentY += 4;

  const totalCount = stats.value.count || 1;
  autoTable(doc, {
    startY: currentY,
    head: [['Predikat', 'Rentang Nilai', 'Jumlah Siswa', 'Persentase']],
    body: [
      ['Sangat Baik', '90 - 100', `${predicates.value.sangatBaik}`, `${((predicates.value.sangatBaik / totalCount) * 100).toFixed(1)}%`],
      ['Baik', '80 - 89', `${predicates.value.baik}`, `${((predicates.value.baik / totalCount) * 100).toFixed(1)}%`],
      ['Cukup', '70 - 79', `${predicates.value.cukup}`, `${((predicates.value.cukup / totalCount) * 100).toFixed(1)}%`],
      ['Kurang', `< 70`, `${predicates.value.kurang}`, `${((predicates.value.kurang / totalCount) * 100).toFixed(1)}%`]
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [59, 130, 246] },
    margin: { left: 15, right: 15 }
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Program Pengayaan & Remedial Tables
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. Program Pengayaan & Remedial', 15, currentY);
  currentY += 4;

  const pengayaanBody = enrichmentStudents.value.map(s => [s.nisn, s.nilai.toString()]);
  if (pengayaanBody.length === 0) pengayaanBody.push(['Tidak ada siswa', '-']);

  const remedialBody = remedialStudents.value.map(s => [s.nisn, s.nilai.toString()]);
  if (remedialBody.length === 0) remedialBody.push(['Tidak ada siswa', '-']);

  autoTable(doc, {
    startY: currentY,
    head: [[`Program Pengayaan (Nilai >= 90) - ${enrichmentStudents.value.length} Siswa`, 'Nilai']],
    body: pengayaanBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [34, 197, 94] },
    margin: { left: 15, right: pageWidth / 2 + 2 }
  });

  const firstTableY = (doc as any).lastAutoTable.finalY;

  autoTable(doc, {
    startY: currentY,
    head: [[`Program Remedial (Nilai < ${batasKetuntasan.value}) - ${remedialStudents.value.length} Siswa`, 'Nilai']],
    body: remedialBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5 },
    headStyles: { fillColor: [239, 68, 68] },
    margin: { left: pageWidth / 2 + 2, right: 15 }
  });

  const secondTableY = (doc as any).lastAutoTable.finalY;
  currentY = Math.max(firstTableY, secondTableY) + 8;

  // 4. Analisis Butir Soal Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('4. Analisis Butir Soal', 15, currentY);
  currentY += 4;

  const itemHead = [['No', 'Tingkat Kesukaran (P)', 'Daya Pembeda (D)', 'Pola Jawaban & Distraktor', 'Keputusan']];
  const itemBody = analysisResults.value.map(item => {
    let distractorsStr = '';
    if (item.distractor_counts) {
      distractorsStr = Object.entries(item.distractor_counts).map(([k, v]) => `${k}:${v}`).join(', ');
    }
    let badDist = '';
    if (item.bad_distractors && item.bad_distractors.length > 0) {
      badDist = `\n(Pengecoh Buruk: ${item.bad_distractors.join(', ')})`;
    }
    return [
      `S-${item.nomor_soal}`,
      `${item.p_value.toFixed(2)} (${item.p_category})`,
      `${item.d_value.toFixed(2)} (${item.d_category})`,
      `Kunci: ${item.key_answer || '-'}\nDistribusi: ${distractorsStr}${badDist}`,
      item.decision
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: itemHead,
    body: itemBody,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 35 },
      2: { cellWidth: 35 },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 30 }
    },
    margin: { left: 15, right: 15 },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  doc.save(`Laporan_Analisis_${id_mapel}_${kode_tes}.pdf`);
  omrStore.showToast('Laporan PDF berhasil diunduh', 'success');
};
</script>
