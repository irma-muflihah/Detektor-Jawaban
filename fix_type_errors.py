import re

with open('src/views/Hasil.vue', 'r') as f:
    content = f.read()

content = content.replace(", align: 'center' as any", "")

with open('src/views/Hasil.vue', 'w') as f:
    f.write(content)

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

# Fix kkm vs batasKetuntasan
content = content.replace('v-model.number="kkm"', 'v-model.number="batasKetuntasan"')
content = content.replace('import { ref, onMounted, computed, nextTick }', 'import { ref, onMounted }')
content = content.replace("import { ref, onMounted, watch } from 'vue';", "import { ref, onMounted, watch, computed, nextTick } from 'vue';")
# Remove duplicate import
content = content.replace("import { ref, onMounted } from 'vue';", "")

with open('src/views/Analisis.vue', 'w') as f:
    f.write(content)

