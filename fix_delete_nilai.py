import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

old_delete = """const records = await db.scoreResults.filter(item => item.id_mapel === deleteIdMapel.value && item.kode_tes === deleteKodeTes.value).toArray();"""

new_delete = """const records = await db.scoreResults.filter(item => 
        String(item.id_mapel).replace(/^0+/, '') === String(deleteIdMapel.value).replace(/^0+/, '') && 
        String(item.kode_tes).replace(/^0+/, '') === String(deleteKodeTes.value).replace(/^0+/, '')
      ).toArray();"""

content = content.replace(old_delete, new_delete)

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

