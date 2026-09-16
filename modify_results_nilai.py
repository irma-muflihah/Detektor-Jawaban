import re

def update_results():
    with open('src/views/Results.vue', 'r') as f:
        content = f.read()

    delete_specific_template = """
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
  </v-container>
"""
    content = content.replace('</v-container>', delete_specific_template)

    menu_insert = """            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-delete-sweep" class="text-error" @click="openDialogDeleteSpecific" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Hapus Data Spesifik</v-list-item-title>
            </v-list-item>
"""
    content = content.replace('<v-divider class="my-1"></v-divider>', menu_insert)

    script_insert = """
const dialogDeleteSpecific = ref(false);
const deleteIdMapel = ref('');
const deleteKodeTes = ref('');

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
  
  if (confirm(`Yakin ingin menghapus semua data dengan ID Mapel ${deleteIdMapel.value} dan Kode Tes ${deleteKodeTes.value}?`)) {
    try {
      const collection = db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      const count = await collection.count();
      await collection.delete();
      
      omrStore.showToast(`${count} data berhasil dihapus`, 'success');
      dialogDeleteSpecific.value = false;
      loadHistory();
    } catch (e: any) {
      omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
    }
  }
};
"""
    content = content.replace('const dialogDeleteAll = ref(false);', 'const dialogDeleteAll = ref(false);\n' + script_insert)
    
    with open('src/views/Results.vue', 'w') as f:
        f.write(content)

def update_nilai():
    with open('src/views/Nilai.vue', 'r') as f:
        content = f.read()

    # Add Koreksi Button
    koreksi_btn = """      <div class="d-flex gap-2 align-center">
        <v-btn color="info" variant="flat" prepend-icon="mdi-check-decagram" :disabled="scanHistoryList.length < 2" @click="openDialogKoreksi" rounded="pill">
          Koreksi
        </v-btn>
"""
    content = content.replace('      <div class="d-flex gap-2 align-center">\n', koreksi_btn)
    
    delete_specific_template = """
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
          <p>Anda yakin ingin menghapus <strong>semua data hasil pemindaian</strong>?</p>
          <p class="text-caption text-error mt-2">Tindakan ini tidak dapat dibatalkan!</p>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogDeleteAll = false">Batal</v-btn>
          <v-btn color="error" variant="flat" @click="deleteAllRecords">Hapus Semua</v-btn>
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
            item-title="nisn"
            :item-value="(item) => getUniqueId(item)"
            label="Pilih Kunci Jawaban (NISN)"
            variant="outlined"
            density="comfortable"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="`Mapel: ${item.raw.id_mapel} | Tes: ${item.raw.kode_tes}`"></v-list-item>
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
  </v-container>
"""
    content = content.replace('  </v-container>', delete_specific_template)

    menu_insert = """            <v-divider class="my-1"></v-divider>
            <v-list-item prepend-icon="mdi-delete-sweep" class="text-error" @click="openDialogDeleteSpecific" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Hapus Data Spesifik</v-list-item-title>
            </v-list-item>
            <v-list-item prepend-icon="mdi-delete" class="text-error" @click="confirmDeleteAll" :disabled="scanHistoryList.length === 0">
              <v-list-item-title>Hapus Semua Data</v-list-item-title>
            </v-list-item>
"""
    content = content.replace('              <v-list-item-title>Ekspor JSON</v-list-item-title>\n            </v-list-item>', '              <v-list-item-title>Ekspor JSON</v-list-item-title>\n            </v-list-item>\n' + menu_insert)
    
    script_insert = """
import { useOmrStore } from '../store/omrStore';
const omrStore = useOmrStore();

const dialogDeleteAll = ref(false);
const dialogDeleteSpecific = ref(false);
const deleteIdMapel = ref('');
const deleteKodeTes = ref('');

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
      
      await db.scanResults.where({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn
      }).modify({ nilai: nilai, itemScores: itemScores });
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
  
  if (confirm(`Yakin ingin menghapus semua data dengan ID Mapel ${deleteIdMapel.value} dan Kode Tes ${deleteKodeTes.value}?`)) {
    try {
      const collection = db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      const count = await collection.count();
      await collection.delete();
      
      omrStore.showToast(`${count} data berhasil dihapus`, 'success');
      dialogDeleteSpecific.value = false;
      loadHistory();
    } catch (e: any) {
      omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
    }
  }
};

const confirmDeleteAll = () => {
  dialogDeleteAll.value = true;
};

const deleteAllRecords = async () => {
  try {
    await db.scanResults.clear();
    omrStore.showToast('Semua data berhasil dihapus', 'success');
    dialogDeleteAll.value = false;
    loadHistory();
  } catch (e: any) {
    omrStore.showToast('Gagal menghapus semua data: ' + e.message, 'error');
  }
};
"""
    content = content.replace("import { db, type ScanResult } from '../db/database';", "import { db, type ScanResult } from '../db/database';\n" + script_insert)

    # In export csv for Nilai, we are good.
    with open('src/views/Nilai.vue', 'w') as f:
        f.write(content)

update_results()
update_nilai()
