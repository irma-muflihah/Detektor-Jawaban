import re

with open('src/views/Results.vue', 'r') as f:
    content = f.read()

content = re.sub(r'<v-btn color="info"[^>]*@click="openDialogKoreksi"[^>]*>\s*Koreksi\s*</v-btn>', '', content, flags=re.DOTALL)
content = re.sub(r'<th[^>]*>Nilai</th>', '', content)
content = re.sub(r'<td[^>]*:class="res\.nilai !== undefined \? \'text-success\' : \'text-grey\'">\s*\{\{ res\.nilai !== undefined \? res\.nilai : \'-\' \}\}\s*</td>', '', content, flags=re.DOTALL)
content = re.sub(r'<!-- Dialog Koreksi -->.*?<\/v-dialog>', '', content, flags=re.DOTALL)
content = re.sub(r'const dialogKoreksi = ref\(false\);.*?const loadHistory = async', 'const loadHistory = async', content, flags=re.DOTALL)
content = content.replace('<v-table class="flex-grow-1 h-100 bg-white" fixed-header density="comfortable">', '<v-table class="flex-grow-1 h-100 bg-white text-caption" fixed-header density="compact">')
content = content.replace('Waktu,NPSN,ID Mapel,Kode Tes,NISN,Nilai,Jawaban', 'Waktu,NPSN,ID Mapel,Kode Tes,NISN,Jawaban')
content = content.replace("const nilai = row.nilai !== undefined ? row.nilai : '';", '')
content = content.replace('","${nilai}","${jawaban}"', '","${jawaban}"')
content = content.replace('nilai: row.nilai,', '')
content = content.replace('itemScores: row.itemScores,', '')

with open('src/views/Results.vue', 'w') as f:
    f.write(content)

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()
content = content.replace('<v-table class="flex-grow-1 h-100 bg-white" fixed-header density="comfortable">', '<v-table class="flex-grow-1 h-100 bg-white text-caption" fixed-header density="compact">')
with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)
