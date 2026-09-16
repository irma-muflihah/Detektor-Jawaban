import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

old_delete = """
      const scoreCollection = db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value);
      
      const count = await scoreCollection.count();
      await scoreCollection.delete();
"""

new_delete = """
      const records = await db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();
      const keys = records.map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn]);
      
      await db.scoreResults.bulkDelete(keys as any);
      const count = records.length;
"""

content = content.replace(old_delete.strip(), new_delete.strip())

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

