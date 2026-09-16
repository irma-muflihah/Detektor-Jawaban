import re

with open('src/views/Nilai.vue', 'r') as f:
    content = f.read()

js_addition = """
const tableHeaders = computed(() => {
  const headers = [
    { title: 'Waktu', key: 'scoredAt', sortable: true },
    { title: 'NPSN', key: 'npsn', sortable: true },
    { title: 'Mapel', key: 'id_mapel', sortable: true },
    { title: 'Tes', key: 'kode_tes', sortable: true },
    { title: 'NISN', key: 'nisn', sortable: true },
    { title: 'Nilai', key: 'nilai', sortable: true }
  ];
  for (const n of scoredQuestions.value) {
    headers.push({ title: `S-${n}`, key: `soal_${n}`, sortable: false });
  }
  return headers;
});
"""
content = content.replace("const scoredQuestions = computed(() => {", js_addition + "\nconst scoredQuestions = computed(() => {")

with open('src/views/Nilai.vue', 'w') as f:
    f.write(content)

