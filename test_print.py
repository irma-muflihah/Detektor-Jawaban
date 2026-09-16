import re

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

print("items-per-page" in content)
