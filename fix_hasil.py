import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

# Replace v-table with v-data-table
old_table = """    <v-card class="rounded-xl border border-opacity-25 elevation-0 flex-grow-1 overflow-hidden d-flex flex-column">
      <v-table density="compact" class="bg-transparent flex-grow-1" fixed-header height="100%">
        <thead>
          <tr>
            <th class="font-weight-bold bg-grey-lighten-4">Waktu Pindai</th>
            <th class="font-weight-bold bg-grey-lighten-4">NPSN</th>
            <th class="font-weight-bold bg-grey-lighten-4">ID Mapel</th>
            <th class="font-weight-bold bg-grey-lighten-4">Kode Tes</th>
            <th class="font-weight-bold bg-grey-lighten-4">NISN</th>
            <th v-for="n in maxQuestions" :key="'h'+n" class="font-weight-bold bg-grey-lighten-4 text-center">
              Soal {{n}}
            </th>
            <th class="font-weight-bold bg-grey-lighten-4 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="res in filteredList" :key="res.npsn + res.id_mapel + res.kode_tes + res.nisn" class="hover-bg-grey">
            <td class="text-caption text-grey-darken-1">{{ new Date(res.scannedAt).toLocaleString('id-ID') }}</td>
            <td class="font-weight-medium">{{ res.npsn }}</td>
            <td class="font-weight-bold text-primary">{{ res.id_mapel }}</td>
            <td class="font-weight-bold text-info">{{ res.kode_tes }}</td>
            <td class="font-weight-bold">{{ res.nisn }}</td>
            <td v-for="n in maxQuestions" :key="'d'+n" class="text-center font-weight-medium">
              <span :class="{'text-error': getAnswerFor(res, n) === '-'}">
                {{ getAnswerFor(res, n) }}
              </span>
            </td>
            <td class="text-center">
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteRecord(res)"></v-btn>
            </td>
          </tr>
          <tr v-if="filteredList.length === 0">
            <td :colspan="7 + maxQuestions" class="text-center pa-8 text-grey">
              <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
              <br>
              Belum ada data hasil pemindaian atau tidak ada yang cocok dengan pencarian.
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>"""

new_table = """    <!-- Statistik Singkat -->
    <v-row class="mb-2" dense>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-blue-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-blue-darken-2 font-weight-bold mb-1">Total Data Pemindaian</div>
            <div class="text-h5 font-weight-black text-blue-darken-3">{{ scanHistoryList.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-green-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-green-darken-2 font-weight-bold mb-1">Jumlah Unik NPSN</div>
            <div class="text-h5 font-weight-black text-green-darken-3">{{ uniqueNPSN }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-orange-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-orange-darken-2 font-weight-bold mb-1">Jumlah Unik Mapel</div>
            <div class="text-h5 font-weight-black text-orange-darken-3">{{ uniqueMapel }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-purple-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-purple-darken-2 font-weight-bold mb-1">Kombinasi Mapel & Tes</div>
            <div class="text-h5 font-weight-black text-purple-darken-3">{{ uniqueCombos }}</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="rounded-xl border border-opacity-25 elevation-0 flex-grow-1 overflow-hidden d-flex flex-column">
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
        <template v-slot:item.id_mapel="{ item }">
          <span class="font-weight-bold text-primary">{{ item.id_mapel }}</span>
        </template>
        <template v-slot:item.kode_tes="{ item }">
          <span class="font-weight-bold text-info">{{ item.kode_tes }}</span>
        </template>
        <template v-slot:item.nisn="{ item }">
          <span class="font-weight-bold">{{ item.nisn }}</span>
        </template>
        
        <!-- Dinamis kolom jawaban -->
        <template v-for="n in maxQuestions" :key="'soal'+n" v-slot:[`item.soal_${n}`]="{ item }">
          <span class="font-weight-medium" :class="{'text-error': getAnswerFor(item, n) === '-'}">
            {{ getAnswerFor(item, n) }}
          </span>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteRecord(item)"></v-btn>
        </template>

        <template v-slot:no-data>
          <div class="text-center pa-8 text-grey">
            <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
            <br>
            Belum ada data hasil pemindaian atau tidak ada yang cocok dengan pencarian.
          </div>
        </template>
      </v-data-table>
    </v-card>"""

content = content.replace(old_table, new_table)

# Add computed properties
js_addition = """
const uniqueNPSN = computed(() => new Set(scanHistoryList.value.map(s => s.npsn)).size);
const uniqueMapel = computed(() => new Set(scanHistoryList.value.map(s => s.id_mapel)).size);
const uniqueCombos = computed(() => new Set(scanHistoryList.value.map(s => `${s.id_mapel}-${s.kode_tes}`)).size);

const tableHeaders = computed(() => {
  const headers = [
    { title: 'Waktu Pindai', key: 'scannedAt', sortable: true },
    { title: 'NPSN', key: 'npsn', sortable: true },
    { title: 'ID Mapel', key: 'id_mapel', sortable: true },
    { title: 'Kode Tes', key: 'kode_tes', sortable: true },
    { title: 'NISN', key: 'nisn', sortable: true }
  ];
  for (let i = 1; i <= maxQuestions.value; i++) {
    headers.push({ title: `Soal ${i}`, key: `soal_${i}`, sortable: false, align: 'center' as any });
  }
  headers.push({ title: 'Aksi', key: 'actions', sortable: false, align: 'center' as any });
  return headers;
});
"""

content = content.replace("const maxQuestions = computed(() => {", js_addition + "\nconst maxQuestions = computed(() => {")

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

