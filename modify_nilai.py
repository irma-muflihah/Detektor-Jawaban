import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

# Update import
content = content.replace("import { db, type ScanResult } from '../db/database';", "import { db, type ScanResult, type ScoreResult } from '../db/database';")

# Update scanHistoryList -> scoreHistoryList
content = content.replace("const scanHistoryList = ref<ScanResult[]>([]);", "const scanHistoryList = ref<ScanResult[]>([]);\nconst scoreHistoryList = ref<ScoreResult[]>([]);")

content = content.replace("const loadHistory = async () => {\n  scanHistoryList.value = await db.scanResults.orderBy('scannedAt').reverse().toArray();\n};", "const loadHistory = async () => {\n  scanHistoryList.value = await db.scanResults.orderBy('scannedAt').reverse().toArray();\n  scoreHistoryList.value = await db.scoreResults.orderBy('scoredAt').reverse().toArray();\n};")

# Replace uses of scanHistoryList with scoreHistoryList for table rendering, but keep it for keys
content = content.replace("const scoredQuestions = computed(() => {\n  const set = new Set<number>();\n  for (const item of scanHistoryList.value) {", "const scoredQuestions = computed(() => {\n  const set = new Set<number>();\n  for (const item of scoreHistoryList.value) {")

content = content.replace("const filteredList = computed(() => {\n  if (!search.value) return scanHistoryList.value;\n  const s = search.value.toLowerCase();\n  return scanHistoryList.value.filter(item => ", "const filteredList = computed(() => {\n  if (!search.value) return scoreHistoryList.value;\n  const s = search.value.toLowerCase();\n  return scoreHistoryList.value.filter(item => ")

content = content.replace("const exportCSV = () => {\n  if (scanHistoryList.value.length === 0) return;", "const exportCSV = () => {\n  if (scoreHistoryList.value.length === 0) return;")
content = content.replace("  scanHistoryList.value.forEach(row => {", "  scoreHistoryList.value.forEach(row => {")
content = content.replace("const waktu = new Date(row.scannedAt).toISOString();", "const waktu = new Date(row.scoredAt).toISOString();")

content = content.replace("const exportJSON = () => {\n  if (scanHistoryList.value.length === 0) return;", "const exportJSON = () => {\n  if (scoreHistoryList.value.length === 0) return;")
content = content.replace("const data = scanHistoryList.value.map(row => ({", "const data = scoreHistoryList.value.map(row => ({")
content = content.replace("waktu: new Date(row.scannedAt).toISOString(),", "waktu: new Date(row.scoredAt).toISOString(),")


# In template
content = content.replace('res.scannedAt', 'res.scoredAt')
content = content.replace(':disabled="scanHistoryList.length === 0"', ':disabled="scoreHistoryList.length === 0"')


# Modify dialogDeleteAll to include text field for confirmation
dialog_delete_all_replacement = """
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
"""
content = re.sub(r'<!-- Dialog Hapus Semua -->.*?<\/v-dialog>', dialog_delete_all_replacement.strip(), content, flags=re.DOTALL)

content = content.replace("const dialogDeleteAll = ref(false);", "const dialogDeleteAll = ref(false);\nconst confirmDeleteText = ref('');")
content = content.replace("dialogDeleteAll.value = true;", "confirmDeleteText.value = '';\n  dialogDeleteAll.value = true;")


delete_specific_records = """
const deleteSpecificRecords = async () => {
  if (!deleteIdMapel.value || !deleteKodeTes.value) {
    omrStore.showToast('ID Mapel dan Kode Tes harus diisi', 'warning');
    return;
  }
  
  if (confirm(`Yakin ingin menghapus semua data penilaian dengan ID Mapel ${deleteIdMapel.value} dan Kode Tes ${deleteKodeTes.value}?`)) {
    try {
      const scoreCollection = db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      
      const count = await scoreCollection.count();
      await scoreCollection.delete();
      
      omrStore.showToast(`${count} data penilaian berhasil dihapus`, 'success');
      dialogDeleteSpecific.value = false;
      loadHistory();
    } catch (e: any) {
      omrStore.showToast('Gagal menghapus data penilaian: ' + e.message, 'error');
    }
  }
};
"""
content = re.sub(r'const deleteSpecificRecords = async \(\) => \{.*?\};\n', delete_specific_records.strip() + '\n', content, flags=re.DOTALL)

delete_all_records = """
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
"""
content = re.sub(r'const deleteAllRecords = async \(\) => \{.*?\};\n', delete_all_records.strip() + '\n', content, flags=re.DOTALL)


# processKoreksi modifications
koreksi_start_idx = content.find("const processKoreksi = async () => {")
koreksi_end_idx = content.find("};", koreksi_start_idx) + 2

process_koreksi = """
const processKoreksi = async () => {
  isKoreksi.value = true;
  try {
    const keyRecord = scanHistoryList.value.find(res => getUniqueId(res) === kunciId.value);
    if (!keyRecord) throw new Error("Kunci jawaban tidak ditemukan.");

    const keyAnswers = keyRecord.answers;
    
    // Process all scans
    for (const res of scanHistoryList.value) {
      let totalScore = 0;
      let totalQuestions = 0;
      let itemScores: { [key: number]: number } = {};
      
      for (const keyAns of keyAnswers) {
        if (keyAns.bentuk_soal === 'skala') continue;
        
        totalQuestions++;
        let itemScore = 0;
        
        const userAns = res.answers.find((a: any) => a.nomor_soal === keyAns.nomor_soal);
        if (!userAns) {
          itemScores[keyAns.nomor_soal] = 0;
          continue;
        }
        
        if (['biasa', 'bs', 'sts', 'jodoh'].includes(keyAns.bentuk_soal)) {
          if (userAns.jawaban === keyAns.jawaban) {
            itemScore = 1;
          }
        } else if (keyAns.bentuk_soal === 'kompleks') {
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
        scoredAt: Date.now()
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
"""

content = content[:koreksi_start_idx] + process_koreksi.strip() + "\n" + content[koreksi_end_idx:]

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

