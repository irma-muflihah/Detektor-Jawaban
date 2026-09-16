import re

with open('src/store/omrStore.ts', 'r') as f:
    content = f.read()

# Fix default layout
old_blocks = """  const getDefaultBlocks = (): TemplateBlock[] => [
    { id: 1, x: 100, y: 130, type: 'handwritten_identity', title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [], prefillValue: '' },
    { id: 2, x: 100, y: 130, type: 'identity_nisn', title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 3, x: 100, y: 130, type: 'identity_npsn', title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' },
    { id: 4, x: 100, y: 130, type: 'identity_subject', title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 5, x: 100, y: 130, type: 'identity_test', title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' }
  ];"""

new_blocks = """  const getDefaultBlocks = (): TemplateBlock[] => [
    { id: 1, x: 90, y: 150, type: 'handwritten_identity', title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [], prefillValue: '' },
    { id: 2, x: 90, y: 390, type: 'identity_nisn', title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 3, x: 442, y: 390, type: 'identity_npsn', title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' },
    { id: 4, x: 730, y: 390, type: 'identity_subject', title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 5, x: 826, y: 390, type: 'identity_test', title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' }
  ];"""

content = content.replace(old_blocks, new_blocks)
content = content.replace("name: 'Lembar Jawaban Baru'", "name: 'Lembar Jawaban'")

with open('src/store/omrStore.ts', 'w') as f:
    f.write(content)
