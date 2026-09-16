import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

# Fix table header
content = content.replace('title: `Soal ${i}`', 'title: `S-${i}`')

# Fix row styling
content = content.replace('<v-row class="mb-4" dense>', '<v-row class="px-4 py-2" dense>')
content = content.replace('pa-3', 'pa-2')
content = content.replace('text-h5', 'text-subtitle-1')

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

