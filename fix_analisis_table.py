import re

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

pattern = r'<v-table density="compact" class="bg-transparent text-caption">\s*<thead>\s*<tr>\s*<th class="font-weight-bold">No</th>\s*<th class="font-weight-bold">Tingkat Kesukaran \(P\)</th>\s*<th class="font-weight-bold">Daya Pembeda \(D\)</th>\s*<th class="font-weight-bold">Pola Jawaban \(Distraktor\)</th>\s*<th class="font-weight-bold">Keputusan</th>\s*</tr>\s*</thead>\s*<tbody>.*?</tbody>\s*</v-table>'

replacement = """
              <v-data-table
                :headers="analysisHeaders"
                :items="analysisResults"
                :items-per-page="10"
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
"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

js_addition = """
const analysisHeaders = [
  { title: 'No', key: 'nomor_soal', sortable: true },
  { title: 'Tingkat Kesukaran (P)', key: 'p_value', sortable: true },
  { title: 'Daya Pembeda (D)', key: 'd_value', sortable: true },
  { title: 'Pola Jawaban', key: 'distractors', sortable: false },
  { title: 'Keputusan', key: 'decision', sortable: true }
];
"""

content = content.replace("const stats = ref({ mean: 0, max: 0, min: 0, count: 0, passed: 0, failed: 0 });", js_addition + "\nconst stats = ref({ mean: 0, max: 0, min: 0, count: 0, passed: 0, failed: 0 });")

with open('src/views/Analisis.vue', 'w') as f:
    f.write(content)

