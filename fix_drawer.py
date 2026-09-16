import re

with open('src/App.vue', 'r') as f:
    content = f.read()

content = content.replace("const drawer = ref(false);", "")

with open('src/App.vue', 'w') as f:
    f.write(content)

