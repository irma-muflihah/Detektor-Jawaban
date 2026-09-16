import re

with open('src/App.vue', 'r') as f:
    content = f.read()

# Fix drawer header
old_header = """      <v-list>
        <v-list-item class="py-2" nav>
          <template v-slot:prepend>
            <div class="bg-primary rounded d-flex align-center justify-center text-white mr-4" style="width: 32px; height: 32px;">
              <v-icon size="20">mdi-camera-iris</v-icon>
            </div>
          </template>
          <v-list-item-title class="font-weight-bold text-white text-body-1">OMROJEN</v-list-item-title>
          <v-list-item-subtitle class="text-caption text-grey-lighten-1">Sistem OMR SMPN 2</v-list-item-subtitle>
        </v-list-item>
      </v-list>"""

new_header = """      <v-list>
        <v-list-item class="py-3" nav>
          <template v-slot:prepend>
            <div class="bg-primary rounded d-flex align-center justify-center text-white mr-4" style="width: 32px; height: 32px;">
              <v-icon size="20">mdi-camera-iris</v-icon>
            </div>
          </template>
          <v-list-item-title class="font-weight-bold text-white text-h6" style="letter-spacing: 1px;">OMROJEN</v-list-item-title>
        </v-list-item>
      </v-list>"""

content = content.replace(old_header, new_header)

# Fix drawer list items
old_list = """      <v-list nav class="px-3" bg-color="transparent" active-class="bg-primary text-white">
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dasbor" to="/" :active="currentRouteName === 'Dashbor'" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-draw-pen" title="Desain" to="/designer" :active="currentRouteName === 'Desain'" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-printer-3d" title="Simulasi" to="/simulator" :active="currentRouteName === 'Simulator'" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-text-recognition" title="Pindai" to="/scanner" :active="currentRouteName === 'Pindai'" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-database-eye" title="Hasil" to="/results" :active="currentRouteName === 'Hasil'" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-file-percent" title="Nilai" to="/nilai" :active="currentRouteName === 'Nilai'" rounded="lg" class="mb-1"></v-list-item>
      </v-list>"""

new_list = """      <v-list nav class="px-2 no-active-bg" bg-color="transparent" color="primary">
        <v-list-item prepend-icon="mdi-view-dashboard" title="Dasbor" to="/" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-draw-pen" title="Desain" to="/designer" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-printer-3d" title="Simulasi" to="/simulator" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-text-recognition" title="Pindai" to="/scanner" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-database-eye" title="Hasil" to="/results" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-file-percent" title="Nilai" to="/nilai" rounded="lg" class="mb-1"></v-list-item>
        <v-list-item prepend-icon="mdi-chart-box-outline" title="Analisis" to="/analisis" rounded="lg" class="mb-1"></v-list-item>
      </v-list>"""

content = content.replace(old_list, new_list)

# Add style for no-active-bg
style = """
<style>
.no-active-bg .v-list-item--active > .v-list-item__overlay {
  opacity: 0 !important;
}
</style>
"""

content += style

with open('src/App.vue', 'w') as f:
    f.write(content)

