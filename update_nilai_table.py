import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

pattern = r'<v-table class="flex-grow-1 h-100 bg-white text-caption" fixed-header density="compact">.*?</v-table>'

replacement = """
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

      <template v-slot:no-data>
        <div class="text-center pa-8 text-grey">
          <v-icon size="48" class="mb-2 opacity-50">mdi-database-remove</v-icon>
          <br>
          Belum ada data nilai atau tidak ada yang cocok dengan pencarian.
        </div>
      </template>
    </v-data-table>
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

