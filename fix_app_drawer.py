import re

with open('src/App.vue', 'r') as f:
    content = f.read()

content = content.replace(
    '<v-navigation-drawer v-model="drawer" :permanent="$vuetify.display.lgAndUp" color="secondary" theme="dark" class="border-0" rail expand-on-hover>',
    '<v-navigation-drawer permanent color="secondary" theme="dark" class="border-0" rail expand-on-hover>'
)

with open('src/App.vue', 'w') as f:
    f.write(content)

