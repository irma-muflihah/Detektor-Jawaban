import re

with open('src/views/Desain.vue', 'r') as f:
    content = f.read()

pattern = r'<g v-if="block.type === \'handwritten_identity\'">.*?</g>'

replacement = """<g v-if="block.type === 'handwritten_identity'">
              <rect :width="820" :height="220" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-20" width="8" height="8" fill="#0f172a" rx="1" />
              <text x="12" y="-10" font-size="14" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              <text x="15" y="25" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Nama Lengkap:</text>
              <rect x="15" y="35" width="790" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="15" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Kelas:</text>
              <rect x="15" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="180" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">No. Absen:</text>
              <rect x="180" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="345" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanggal Pelaksanaan Tes:</text>
              <rect x="345" y="90" width="460" height="25" fill="none" stroke="#475569" stroke-width="1" />

              <text x="15" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Pernyataan Kejujuran: Salin teks "Saya mengerjakan tes dengan jujur."</text>
              <rect x="15" y="155" width="550" height="50" fill="none" stroke="#475569" stroke-width="1" />
              <text x="580" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanda Tangan:</text>
              <rect x="580" y="155" width="225" height="50" fill="none" stroke="#475569" stroke-width="1" />
            </g>"""

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('src/views/Desain.vue', 'w') as f:
    f.write(content)
