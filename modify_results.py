import re

with open('src/views/Results.vue', 'r') as f:
    content = f.read()

# Modify dialogDeleteAll to include text field for confirmation
dialog_delete_all_replacement = """
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
"""
content = re.sub(r'<!-- Dialog Delete All -->.*?<\/v-dialog>', dialog_delete_all_replacement.strip(), content, flags=re.DOTALL)

# Add confirmDeleteText
content = content.replace("const dialogDeleteAll = ref(false);", "const dialogDeleteAll = ref(false);\nconst confirmDeleteText = ref('');")
content = content.replace("dialogDeleteAll.value = true;", "confirmDeleteText.value = '';\n  dialogDeleteAll.value = true;")

# Update deleteAllRecords
delete_all_records = """
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
"""
content = re.sub(r'const deleteAllRecords = async \(\) => \{.*?\};', delete_all_records.strip(), content, flags=re.DOTALL)

# Update deleteSpecificRecords
delete_specific_records = """
const deleteSpecificRecords = async () => {
  if (!deleteIdMapel.value || !deleteKodeTes.value) {
    omrStore.showToast('ID Mapel dan Kode Tes harus diisi', 'warning');
    return;
  }
  
  if (confirm(`Yakin ingin menghapus semua data dengan ID Mapel ${deleteIdMapel.value} dan Kode Tes ${deleteKodeTes.value}?`)) {
    try {
      const scanCollection = db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      const scoreCollection = db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      
      const count = await scanCollection.count();
      await scanCollection.delete();
      await scoreCollection.delete();
      
      omrStore.showToast(`${count} data berhasil dihapus`, 'success');
      dialogDeleteSpecific.value = false;
      loadHistory();
    } catch (e: any) {
      omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
    }
  }
};
"""
content = re.sub(r'const deleteSpecificRecords = async \(\) => \{.*?\};\n', delete_specific_records.strip() + '\n', content, flags=re.DOTALL)

# Update deleteRecord
delete_record = """
const deleteRecord = async (res: ScanResult) => {
  if (confirm(`Yakin ingin menghapus data NISN ${res.nisn}?`)) {
    try {
      await db.scanResults.where({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn
      }).delete();
      await db.scoreResults.where({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn
      }).delete();
      omrStore.showToast('Data berhasil dihapus', 'success');
      loadHistory();
    } catch (e: any) {
      omrStore.showToast('Gagal menghapus data: ' + e.message, 'error');
    }
  }
};
"""
content = re.sub(r'const deleteRecord = async \(res: ScanResult\) => \{.*?\};\n', delete_record.strip() + '\n', content, flags=re.DOTALL)

with open('src/views/Results.vue', 'w') as f:
    f.write(content)

