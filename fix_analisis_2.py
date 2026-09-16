import re

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

# Replace KKM with Batas Ketuntasan
content = content.replace('KKM (Batas Tuntas)', 'Batas Ketuntasan')
content = content.replace('kkm.value', 'batasKetuntasan.value')
content = content.replace('const kkm = ref<number>(75);', 'const batasKetuntasan = ref<number>(75);')
content = content.replace('Tuntas (>= {{kkm}})', 'Tuntas (>= {{batasKetuntasan}})')
content = content.replace('Tidak Tuntas (< {{kkm}})', 'Tidak Tuntas (< {{batasKetuntasan}})')

# Add pre-calculation for Batas Ketuntasan on combo change
addition_watch = """
import { watch } from 'vue';

watch(selectedCombination, async (val) => {
  if (!val) return;
  const [id_mapel, kode_tes] = val.split('|');
  const scoreRecords = await db.scoreResults.filter(item => 
    String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
    String(item.kode_tes).replace(/^0+/, '') === kode_tes &&
    !item.isKey
  ).toArray();
  
  if (scoreRecords.length >= 5) {
    scoreRecords.sort((a, b) => a.nilai - b.nilai);
    // Find bottom 20% highest score to suggest remedial threshold
    const idx = Math.floor(scoreRecords.length * 0.2);
    let suggested = scoreRecords[idx]?.nilai || 75;
    if (suggested < 50) suggested = 60;
    batasKetuntasan.value = suggested;
  }
});
"""
content = content.replace("import { ref, onMounted } from 'vue';", "import { ref, onMounted, watch } from 'vue';")
content = content.replace("const batasKetuntasan = ref<number>(75);", "const batasKetuntasan = ref<number>(75);\n" + addition_watch)

# Add predicates
predicates_template = """        <!-- Statistik Predikat -->
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
        </v-col>"""

content = content.replace("        <!-- Daftar Pengayaan dan Remedial -->", predicates_template + "\n\n        <!-- Daftar Pengayaan dan Remedial -->")

# Filter out isKey
filter_old = """    const scoreRecords = await db.scoreResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
      String(item.kode_tes).replace(/^0+/, '') === kode_tes
    ).toArray();"""

filter_new = """    const scoreRecords = await db.scoreResults.filter(item => 
      String(item.id_mapel).replace(/^0+/, '') === id_mapel && 
      String(item.kode_tes).replace(/^0+/, '') === kode_tes &&
      !item.isKey
    ).toArray();"""
content = content.replace(filter_old, filter_new)

# Add predicates ref
content = content.replace("const stats = ref({ mean: 0, max: 0, min: 0, count: 0, passed: 0, failed: 0 });", "const stats = ref({ mean: 0, max: 0, min: 0, count: 0, passed: 0, failed: 0 });\nconst predicates = ref({ sangatBaik: 0, baik: 0, cukup: 0, kurang: 0 });")

# Calculate predicates & fix pengayaan/remedial logic
calc_old = """      if (r.nilai >= batasKetuntasan.value) {
        passed++;
        enrichmentStudents.value.push(r);
      } else {
        failed++;
        remedialStudents.value.push(r);
      }"""

calc_new = """      if (r.nilai >= batasKetuntasan.value) {
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
      }"""
content = content.replace(calc_old, calc_new)

# Reset predicates when processing
reset_old = """    enrichmentStudents.value = [];
    remedialStudents.value = [];"""
reset_new = """    enrichmentStudents.value = [];
    remedialStudents.value = [];
    predicates.value = { sangatBaik: 0, baik: 0, cukup: 0, kurang: 0 };"""
content = content.replace(reset_old, reset_new)

# Update Pengayaan title
content = content.replace("Program Pengayaan ({{ stats.passed }})", "Program Pengayaan (Nilai >= 90) ({{ enrichmentStudents.length }})")
content = content.replace("Program Remidial ({{ stats.failed }})", "Program Remidial (Nilai < {{batasKetuntasan}}) ({{ remedialStudents.length }})")

with open('src/views/Analisis.vue', 'w') as f:
    f.write(content)

