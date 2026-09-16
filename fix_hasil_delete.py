import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

old_delete = """
      const scanCollection = db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      const scoreCollection = db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      
      const count = await scanCollection.count();
      await scanCollection.delete();
      await scoreCollection.delete();
"""

new_delete = """
      const scanRecords = await db.scanResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();
      const scoreRecords = await db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();
      
      const scanKeys = scanRecords.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
      const scoreKeys = scoreRecords.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
      
      await db.scanResults.bulkDelete(scanKeys as any);
      await db.scoreResults.bulkDelete(scoreKeys as any);
      
      const count = scanRecords.length;
"""

if old_delete.strip() in content:
    content = content.replace(old_delete.strip(), new_delete.strip())
else:
    print("Could not find old_delete in Hasil.vue")

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

