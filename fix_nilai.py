import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

old_code = """      await db.scoreResults.put({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn,
        nilai: nilai,
        itemScores: itemScores,
        scoredAt: Date.now()
      });"""

new_code = """      await db.scoreResults.put({
        npsn: res.npsn,
        id_mapel: res.id_mapel,
        kode_tes: res.kode_tes,
        nisn: res.nisn,
        nilai: nilai,
        itemScores: itemScores,
        scoredAt: Date.now(),
        isKey: res.nisn === keyRecord.nisn
      });"""

content = content.replace(old_code, new_code)

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

