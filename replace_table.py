import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

pattern = r'<v-table class="flex-grow-1 h-100 bg-white text-caption" fixed-header density="compact">.*?</v-table>'

replacement = """
    <!-- Statistik Singkat -->
    <v-row class="mb-4" dense>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-blue-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-blue-darken-2 font-weight-bold mb-1">Total Pemindaian</div>
            <div class="text-h5 font-weight-black text-blue-darken-3">{{ scanHistoryList.length }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-green-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-green-darken-2 font-weight-bold mb-1">Jml Unik NPSN</div>
            <div class="text-h5 font-weight-black text-green-darken-3">{{ uniqueNPSN }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-orange-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-orange-darken-2 font-weight-bold mb-1">Jml Unik Mapel</div>
            <div class="text-h5 font-weight-black text-orange-darken-3">{{ uniqueMapel }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="rounded-lg border bg-purple-lighten-5" elevation="0">
          <v-card-text class="pa-3 text-center">
            <div class="text-caption text-purple-darken-2 font-weight-bold mb-1">Kombinasi Tes</div>
            <div class="text-h5 font-weight-black text-purple-darken-3">{{ uniqueCombos }}</div>
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
          <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="deleteRecord(item as any)"></v-btn>
        </template>

        <template v-slot:no-data>
          <div class="text-center pa-8 text-grey">
            <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
            <br>
            Belum ada data hasil pemindaian atau tidak ada yang cocok dengan pencarian.
          </div>
        </template>
      </v-data-table>
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

