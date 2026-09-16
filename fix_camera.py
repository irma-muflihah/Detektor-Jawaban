import re

with open('src/views/Pindai.vue', 'r') as f:
    content = f.read()

content = content.replace(
    '<div v-if="scanMode === \'camera\'" class="flex-grow-1 position-relative bg-black d-flex align-center justify-center">',
    '<div v-if="scanMode === \'camera\'" class="flex-grow-1 position-relative bg-black d-flex align-center justify-center" :class="{ \'fullscreen-camera\': cameraActive }">'
)

style_insertion = """
<style scoped>
.fullscreen-camera {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  z-index: 9999 !important;
  width: 100vw !important;
  height: 100vh !important;
  border-radius: 0 !important;
}
"""

content = content.replace('<style scoped>', style_insertion)

with open('src/views/Pindai.vue', 'w') as f:
    f.write(content)

