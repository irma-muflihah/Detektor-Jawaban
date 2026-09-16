import re

with open('src/App.vue', 'r') as f:
    content = f.read()

# Replace header for better spacing
old_header = """      <v-list>
        <v-list-item class="py-3" nav>
          <template v-slot:prepend>
            <div class="bg-primary rounded d-flex align-center justify-center text-white mr-4" style="width: 32px; height: 32px;">
              <v-icon size="20">mdi-camera-iris</v-icon>
            </div>
          </template>
          <v-list-item-title class="font-weight-bold text-white text-h6" style="letter-spacing: 1px;">OMROJEN</v-list-item-title>
        </v-list-item>
      </v-list>"""

new_header = """      <v-list>
        <v-list-item class="py-4" nav>
          <template v-slot:prepend>
            <div class="bg-primary rounded d-flex align-center justify-center text-white" style="width: 36px; height: 36px; margin-right: 16px;">
              <v-icon size="24">mdi-camera-iris</v-icon>
            </div>
          </template>
          <v-list-item-title class="font-weight-black text-white text-h6" style="letter-spacing: 2px;">OMROJEN</v-list-item-title>
        </v-list-item>
      </v-list>"""

content = content.replace(old_header, new_header)

# Refine list
old_list = """      <v-list nav class="px-2 no-active-bg" bg-color="transparent" color="primary">"""
new_list = """      <v-list nav class="px-2" bg-color="transparent" active-class="custom-active-item">"""
content = content.replace(old_list, new_list)

# Replace style block
old_style = """<style>
.no-active-bg .v-list-item--active > .v-list-item__overlay {
  opacity: 0 !important;
}
</style>"""

new_style = """<style>
.custom-active-item {
  background: transparent !important;
  color: #3b82f6 !important;
}
.custom-active-item .v-icon {
  color: #3b82f6 !important;
}
.custom-active-item .v-list-item__overlay {
  opacity: 0 !important;
}
.v-list-item:not(.custom-active-item):hover .v-list-item__overlay {
  opacity: 0.08 !important;
}
</style>"""

content = content.replace(old_style, new_style)

with open('src/App.vue', 'w') as f:
    f.write(content)

