import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

old_scan_delete = """const scanRecords = await db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();"""
new_scan_delete = """const scanRecords = await db.scanResults.filter(item => 
        String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
        String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
      ).toArray();"""

old_score_delete = """const scoreRecords = await db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();"""
new_score_delete = """const scoreRecords = await db.scoreResults.filter(item => 
        String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
        String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
      ).toArray();"""

content = content.replace(old_scan_delete, new_scan_delete)
content = content.replace(old_score_delete, new_score_delete)

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

