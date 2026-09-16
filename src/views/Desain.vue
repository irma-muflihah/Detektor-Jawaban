<template>
  <div class="d-flex flex-column flex-md-row h-100 pa-2 pa-md-4 gap-4 designer-layout" style="gap: 1.5rem;">
    <!-- Sheet Configuration Panel -->
    <div class="d-flex flex-column gap-4 overflow-y-auto property-sidebar pr-md-2">
      <div class="bg-white rounded-xl border pa-5 shadow-sm">
        <h3 class="font-weight-bold text-caption text-grey-darken-1 mb-4" style="text-transform: uppercase; letter-spacing: 0.05em;">Konfigurasi</h3>
        
        <v-text-field 
          v-model="omrStore.activeTemplate.name" 
          label="Judul LJK" 
          variant="outlined" 
          density="compact" 
          hide-details 
          class="mb-4 bg-white"
        ></v-text-field>
        
        <v-select
          v-model="selectedBlockType"
          :items="availableBlockTypes"
          item-title="label"
          item-value="id"
          label="Tipe Blok"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3 bg-white"
        ></v-select>

        <v-select
          v-if="dynamicOptionChoices.length > 1"
          v-model="selectedOptionCount"
          :items="dynamicOptionChoices"
          item-title="title"
          item-value="value"
          label="Jml Opsi"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4 bg-white"
        ></v-select>

        <v-select
          v-if="isQuestionBlock"
          v-model="selectedRowCount"
          :items="rowCountChoices"
          label="Jml Soal"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-4 bg-white"
        ></v-select>

        <v-btn block color="primary" class="text-none font-weight-bold mb-2 rounded-lg" prepend-icon="mdi-plus" @click="addBlock">
          Tambah
        </v-btn>
        
        <v-btn block color="grey-lighten-4" class="text-none text-grey-darken-3 mb-2 rounded-lg border" prepend-icon="mdi-auto-fix" @click="autoLayoutBlocks(true)">
          Rapi Otomatis Sekali
        </v-btn>

        <v-switch
          v-model="omrStore.activeTemplate.autoLayout"
          label="Auto Layout (Aktif)"
          color="primary"
          density="compact"
          hide-details
          class="mb-2 ml-1"
        ></v-switch>
      </div>

      <div class="bg-white rounded-xl border pa-5 shadow-sm">
        <h3 class="font-weight-bold text-caption text-grey-darken-1 mb-4" style="text-transform: uppercase; letter-spacing: 0.05em;">Hierarki</h3>
        <v-expansion-panels variant="accordion" class="border rounded-lg bg-transparent">
          <v-expansion-panel v-for="(block, idx) in omrStore.activeTemplate.blocks" :key="block.id" elevation="0" class="bg-transparent border-b">
            <v-expansion-panel-title class="py-2 min-height-0 text-caption font-weight-bold">
              {{ block.title }}
            </v-expansion-panel-title>
            <v-expansion-panel-text class="pt-2 bg-grey-lighten-5">
              <v-row dense>
                <v-col cols="6"><v-text-field v-model.number="block.x" label="Pos X" type="number" density="compact" variant="outlined" hide-details class="bg-white"></v-text-field></v-col>
                <v-col cols="6"><v-text-field v-model.number="block.y" label="Pos Y" type="number" density="compact" variant="outlined" hide-details class="bg-white"></v-text-field></v-col>
                
                <template v-if="identityTypes.includes(block.type) && block.type !== 'handwritten_identity'">
                  <v-col cols="12" class="mt-2">
                    <v-text-field 
                      v-model="block.prefillValue" 
                      :label="'Isi Awal'" 
                      :readonly="block.type === 'identity_npsn'"
                      :class="['bg-white', block.type === 'identity_npsn' ? 'bg-grey-lighten-3' : '']"
                      density="compact" 
                      variant="outlined" 
                      hide-details
                      placeholder="Nilai"
                    ></v-text-field>
                  </v-col>
                </template>

                <template v-if="block.type === 'teks_kustom'">
                  <v-col cols="12" class="mt-2">
                    <v-textarea 
                      v-model="block.prefillValue" 
                      label="Keterangan"
                      class="bg-white"
                      density="compact" 
                      variant="outlined" 
                      hide-details
                      auto-grow
                      rows="2"
                    ></v-textarea>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model.number="block.cols" label="Lebar (px)" type="number" density="compact" variant="outlined" hide-details class="bg-white"></v-text-field>
                  </v-col>
                  <v-col cols="6" class="mt-2">
                    <v-text-field v-model.number="block.rows" label="Tinggi (px)" type="number" density="compact" variant="outlined" hide-details class="bg-white"></v-text-field>
                  </v-col>
                </template>
                <template v-if="block.direction === 'horizontal'">
                  <v-col cols="12" class="mt-2"><v-text-field v-model.number="block.rows" label="Jml Soal" type="number" density="compact" variant="outlined" hide-details class="bg-white"></v-text-field></v-col>
                </template>
              </v-row>
              <v-btn block color="error" variant="text" size="small" class="mt-3" prepend-icon="mdi-trash-can" @click="removeBlock(idx)">Hapus</v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn block color="secondary" class="mt-6 font-weight-bold rounded-lg text-none" prepend-icon="mdi-content-save" @click="omrStore.saveTemplate">Simpan</v-btn>
      </div>
    </div>
    
    <!-- Canvas Area -->
    <div class="canvas-wrapper flex-grow-1 d-flex justify-center overflow-auto bg-grey-lighten-2 rounded-xl border-lg pa-2 pa-md-6 pb-12 shadow-inner position-relative">
      <div class="canvas-container">
        <svg viewBox="0 0 1000 1414" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect width="1000" height="1414" fill="#ffffff" />
          
          <!-- Judul LJK Global -->
          <text x="500" y="95" font-size="28" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif" fill="#0f172a">{{ omrStore.activeTemplate.name }}</text>

          <!-- Penanda Batas Optik & Fiducial -->
          <g id="fiducial-marks">
            <g fill="#0f172a">
              <rect x="30" y="30" width="40" height="40" rx="4" />
              <rect x="36" y="36" width="28" height="28" rx="2" fill="#fff" />
              <rect x="42" y="42" width="16" height="16" rx="2" />
              <rect x="930" y="30" width="40" height="40" rx="4" />
              <rect x="936" y="36" width="28" height="28" rx="2" fill="#fff" />
              <rect x="942" y="42" width="16" height="16" rx="2" />
              <rect x="30" y="1344" width="40" height="40" rx="4" />
              <rect x="36" y="1350" width="28" height="28" rx="2" fill="#fff" />
              <rect x="42" y="1356" width="16" height="16" rx="2" />
              <rect x="930" y="1344" width="40" height="40" rx="4" />
              <rect x="936" y="1350" width="28" height="28" rx="2" fill="#fff" />
              <rect x="942" y="1356" width="16" height="16" rx="2" />
            </g>
            <g fill="#0f172a">
              <g v-for="i in 30" :key="'v_timing_'+i">
                <rect x="46" :y="46 + (i*41.5)" width="8" height="4" rx="1" />
                <rect x="946" :y="46 + (i*41.5)" width="8" height="4" rx="1" />
              </g>
              <g v-for="i in 18" :key="'h_timing_'+i">
                <rect :x="46 + (i*46.3)" y="46" width="4" height="8" rx="1" />
                <rect :x="46 + (i*46.3)" y="1360" width="4" height="8" rx="1" />
              </g>
            </g>
          </g>

          <line v-if="separatorY > 0" x1="90" :y1="separatorY" x2="910" :y2="separatorY" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="8,6" stroke-linecap="round" />

          <!-- Blocks -->
          <g v-for="block in omrStore.activeTemplate.blocks" :key="block.id" :transform="'translate(' + block.x + ',' + block.y + ')'" style="transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);">
            
            <g v-if="block.type === 'handwritten_identity'">
              <rect :width="820" :height="220" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-20" width="8" height="8" fill="#0f172a" rx="1" />
              <text x="12" y="-10" font-size="14" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              <text x="15" y="25" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Nama Lengkap:</text>
              <rect x="15" y="35" width="790" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="15" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Kelas:</text>
              <rect x="15" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="180" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">No. Peserta:</text>
              <rect x="180" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
              <text x="345" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanggal Pelaksanaan Tes:</text>
              <rect x="345" y="90" width="460" height="25" fill="none" stroke="#475569" stroke-width="1" />

              <text x="15" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Pernyataan Kejujuran: Salin teks <tspan font-style="italic">"Saya mengerjakan tes dengan jujur."</tspan></text>
              <rect x="15" y="155" width="550" height="50" fill="none" stroke="#475569" stroke-width="1" />
              <text x="580" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanda Tangan:</text>
              <rect x="580" y="155" width="225" height="50" fill="none" stroke="#475569" stroke-width="1" />
            </g>

            <g v-else-if="block.direction === 'vertical'">
              <g>
                <rect v-for="c in block.cols" :key="'z_col_'+c" v-show="(c-1) % 2 === 1" :x="(c-1)*32 + 4" y="0" width="32" :height="(block.rows||10) * 28 + 35" fill="#f8fafc" />
              </g>
              <rect :width="(block.cols||0) * 32 + 20" :height="(block.rows||10) * 28 + 60" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-20" width="8" height="8" fill="#0f172a" rx="1" />
              <text x="12" y="-10" font-size="14" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              
              <g v-for="c in block.cols" :key="'box'+c">
                <rect :x="(c-1)*32 + 9" y="5" width="24" height="24" fill="none" stroke="#475569" stroke-width="1.5" />
                <text v-if="block.prefillValue && block.prefillValue[c-1]" 
                      :x="(c-1)*32 + 21" y="23" 
                      font-size="16" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif" fill="#0f172a">
                    {{ block.prefillValue[c-1] }}
                </text>
              </g>
              
              <g v-for="r in block.rows" :key="'r'+r">
                <g v-for="c in block.cols" :key="'c'+c">
                  <circle 
                      :cx="(c-1)*32 + 21" 
                      :cy="(r)*28 + 20" 
                      r="10" 
                      fill="none" 
                      stroke="#475569" 
                      stroke-width="1.5" 
                  />
                  <text 
                      :x="(c-1)*32 + 21" 
                      :y="(r)*28 + 24" 
                      font-size="10" 
                      text-anchor="middle" 
                      font-family="Inter, sans-serif"
                      fill="#475569"
                  >{{ block.options?.[r-1] }}</text>
                  <g v-if="block.prefillValue && block.prefillValue[c-1] === (block.options?.[r-1])" v-html="generateScribble((c-1)*32 + 21, (r)*28 + 20, 10, 'circle')"></g>
                </g>
              </g>
            </g>

            <g v-else-if="block.direction === 'horizontal'">
              <g>
                <rect v-for="r in (block.type === 'bs3' ? (block.rows||1)*3 : block.rows)" :key="'z_row_'+r" v-show="(r-1) % 2 === 1" x="5" :y="(r-1)*30 + 5" :width="(block.options?.length||0) * 35 + 40" height="30" fill="#f8fafc" />
              </g>
              <rect :width="(block.options?.length||0) * 35 + 50" :height="(block.type === 'bs3' ? (block.rows||1)*3 : block.rows||1) * 30 + 10" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-20" width="8" height="8" fill="#0f172a" rx="1" />
              <text x="12" y="-10" font-size="14" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              
              <g v-for="r in (block.type === 'bs3' ? (block.rows||1)*3 : block.rows)" :key="'r'+r">
                <text v-if="block.type !== 'bs3' || (r-1)%3 === 0" :x="10" :y="(r-1)*30 + 25" font-size="12" font-weight="bold" font-family="Inter, sans-serif">{{ (block.startNum||0) + (block.type === 'bs3' ? Math.floor((r-1)/3) : (r - 1)) }}.</text>
                <g v-for="(opt, oIdx) in block.options" :key="'o'+oIdx">
                  <circle v-if="block.type !== 'kompleks'" :cx="oIdx*35 + 45" :cy="(r-1)*30 + 20" r="10" fill="none" stroke="#475569" stroke-width="1.5" />
                  <rect v-else :x="oIdx*35 + 35" :y="(r-1)*30 + 10" width="20" height="20" rx="3" fill="none" stroke="#475569" stroke-width="1.5" />
                  <text :x="oIdx*35 + 45" :y="(r-1)*30 + 24" :font-size="opt.length > 1 ? 8 : 10" text-anchor="middle" font-family="Inter, sans-serif" fill="#475569">{{ opt }}</text>
                </g>
              </g>
            </g>

            <g v-else-if="block.type === 'teks_kustom'">
              <rect :width="block.cols || 150" :height="block.rows || 100" fill="none" stroke="#475569" stroke-width="2" />
              <rect x="0" y="-20" width="8" height="8" fill="#0f172a" rx="1" />
              <text x="12" y="-10" font-size="14" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              <foreignObject x="10" y="10" :width="(block.cols || 150) - 20" :height="(block.rows || 100) - 20">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, sans-serif; font-size: 14px; color: #0f172a; text-align: justify; word-wrap: break-word; line-height: 1.4; width: 100%; height: 100%; overflow: hidden; white-space: pre-wrap;">{{ block.prefillValue || 'Teks kosong' }}</div>
              </foreignObject>
            </g>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useOmrStore } from '../store/omrStore';
import type { TemplateBlock } from '../db/database';

const omrStore = useOmrStore();

const separatorY = ref(0);
const selectedBlockType = ref('biasa');
const selectedOptionCount = ref(4); 
const selectedRowCount = ref(10); 

const availableBlockTypes = [
  { id: 'handwritten_identity', label: 'ID: Tulis Tangan' },
  { id: 'identity_nisn', label: 'ID: NISN (10x)' },
  { id: 'identity_npsn', label: 'ID: NPSN (8x)' },
  { id: 'identity_subject', label: 'ID: Mapel (2x)' },
  { id: 'identity_test', label: 'ID: Tes (2x)' },
  { id: 'biasa', label: 'Soal: PG (Huruf)' },
  { id: 'kompleks', label: 'Soal: PG Kompleks' },
  { id: 'bs', label: 'Soal: Benar/Salah' },
  { id: 'bs3', label: 'Soal: Benar/Salah (3 Baris)' },
  { id: 'sts', label: 'Soal: Sesuai/Tidak' },
  { id: 'skala', label: 'Soal: Angka/Skala' },
  { id: 'jodoh', label: 'Soal: Jodohkan' },
  { id: 'teks_kustom', label: 'Teks Bebas / Keterangan' }
];

const identityTypes = ['handwritten_identity', 'identity_nisn', 'identity_npsn', 'identity_subject', 'identity_test'];

const isQuestionBlock = computed(() => {
  return !identityTypes.includes(selectedBlockType.value);
});

const rowCountChoices = Array.from({ length: 20 }, (_, i) => i + 1);

const dynamicOptionChoices = computed(() => {
  const type = selectedBlockType.value;
  if (['biasa', 'kompleks'].includes(type)) {
      return [
          { title: '3 (A,B,C)', value: 3 },
          { title: '4 (A,B,C,D)', value: 4 },
          { title: '5 (A,B,C,D,E)', value: 5 }
      ];
  } else if (type === 'skala') {
      return [
          { title: '3 (1-3)', value: 3 },
          { title: '4 (1-4)', value: 4 },
          { title: '5 (1-5)', value: 5 },
          { title: '7 (1-7)', value: 7 }
      ];
  } else if (type === 'jodoh') {
      return Array.from({ length: 13 }, (_, i) => {
          const val = i + 3;
          const endChar = String.fromCharCode(65 + val - 1);
          return { title: `${val} (A-${endChar})`, value: val };
      });
  } else {
      return [{ title: 'Bawaan', value: 0 }];
  }
});

const recalculateQuestionNumbers = () => {
  let currentStartNumber = 1;
  omrStore.activeTemplate.blocks.forEach((block: TemplateBlock) => {
      if (!identityTypes.includes(block.type)) {
          block.startNum = currentStartNumber;
          currentStartNumber += (block.rows || 0);
      }
  });
};

watch(selectedBlockType, (newType) => {
  if (['biasa', 'kompleks', 'skala', 'jodoh'].includes(newType)) {
      selectedOptionCount.value = newType === 'jodoh' ? 5 : 4; 
  }
});

watch(() => omrStore.activeTemplate.blocks, () => {
  recalculateQuestionNumbers();
}, { deep: true });

const generateAlphaOptions = (count: number) => Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
const generateNumericOptions = (count: number) => Array.from({ length: count }, (_, i) => (i + 1).toString());

const generateScribble = (cx: number, cy: number, r: number, type: 'circle' | 'rect') => {
  const seed = cx * 1000 + cy;
  const random = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const color = '#2b2b36';
  let paths = '';
  const dx = random(seed) * 2 - 1;
  const dy = random(seed + 1) * 2 - 1;

  if (type === 'circle') {
     paths += `<circle cx="${cx + dx}" cy="${cy + dy}" r="${r * 0.85}" fill="${color}" opacity="0.95" />`;
  } else {
     paths += `<rect x="${cx - r * 0.85 + dx}" y="${cy - r * 0.85 + dy}" width="${r * 1.7}" height="${r * 1.7}" rx="2" fill="${color}" opacity="0.95" />`;
  }
  
  for (let i=0; i<3; i++) {
    const x1 = cx - r + random(seed + i * 4 + 2) * r * 2;
    const y1 = cy - r + random(seed + i * 4 + 3) * r * 2;
    const x2 = cx - r + random(seed + i * 4 + 4) * r * 2;
    const y2 = cy - r + random(seed + i * 4 + 5) * r * 2;
    paths += `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" stroke="${color}" stroke-width="${random(seed + i)*1.5 + 1}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  }
  return paths;
};

const addBlock = () => {
  try {
      const blocks = omrStore.activeTemplate.blocks;
      const newId = blocks.length > 0 ? Math.max(...blocks.map(b => Number(b.id) || 0)) + 1 : 1;
      const type = selectedBlockType.value;
      let newBlock: TemplateBlock = { id: newId, x: 100, y: 160, type: type, prefillValue: '', title: '' }; 
      
      const optCount = selectedOptionCount.value;
      const rowCount = selectedRowCount.value;

      switch (type) {
          case 'handwritten_identity':
              newBlock = { ...newBlock, title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [] };
              break;
          case 'identity_nisn':
              newBlock = { ...newBlock, title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'] };
              break;
          case 'identity_npsn':
              newBlock = { ...newBlock, title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' };
              break;
          case 'identity_subject':
              newBlock = { ...newBlock, title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '01' };
              break;
          case 'identity_test':
              newBlock = { ...newBlock, title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '01' };
              break;
          case 'biasa':
          case 'kompleks':
              newBlock = { ...newBlock, title: type === 'biasa' ? 'Pilihan Ganda' : 'Pilihan Ganda Kompleks', direction: 'horizontal', rows: rowCount, options: generateAlphaOptions(optCount), startNum: 1 };
              break;
          case 'bs':
              newBlock = { ...newBlock, title: 'Benar / Salah', direction: 'horizontal', rows: rowCount, options: ['B','S'], startNum: 1 };
              break;
          case 'bs3':
              newBlock = { ...newBlock, title: 'Benar / Salah (3 Baris)', direction: 'horizontal', rows: rowCount, options: ['B','S'], startNum: 1 };
              break;
          case 'sts':
              newBlock = { ...newBlock, title: 'Sesuai / Tak Sesuai', direction: 'horizontal', rows: rowCount, options: ['S','TS'], startNum: 1 };
              break;
          case 'skala':
              newBlock = { ...newBlock, title: 'Skala Kuesioner', direction: 'horizontal', rows: rowCount, options: generateNumericOptions(optCount), startNum: 1 };
              break;
          case 'jodoh':
              newBlock = { ...newBlock, title: 'Menjodohkan', direction: 'horizontal', rows: rowCount, options: generateAlphaOptions(optCount), startNum: 1 };
              break;
          case 'teks_kustom':
              newBlock = { ...newBlock, title: 'Keterangan', direction: 'teks', prefillValue: 'Teks keterangan\nBisa multiline', cols: 150, rows: 100 };
              break;
          default:
              throw new Error("Tipe blok tidak dikenal.");
      }

      blocks.push(newBlock);
      autoLayoutBlocks();
      omrStore.showToast(`Blok disisipkan`, 'success');
  } catch (error: any) {
      omrStore.showToast(`Kesalahan: ${error.message}`, 'error');
  }
};

const getBlockDimensions = (block: TemplateBlock) => {
  if (block.type === 'handwritten_identity') return { width: 820, height: 220 };
  if (block.type === 'teks_kustom') return { width: block.cols || 150, height: block.rows || 100 };
  
  const width = block.direction === 'vertical' ? (block.cols||0) * 32 + 20 : (block.options?.length||0) * 35 + 50;
  const height = block.direction === 'vertical' ? (block.rows||0) * 28 + 60 : (block.type === 'bs3' ? (block.rows||0)*3 : (block.rows||0)) * 30 + 10;
  return { width, height };
};

const autoLayoutBlocks = (force = false) => {
  if (!omrStore.activeTemplate.autoLayout && force !== true) return;
  try {
      const MARGIN_TOP = 150; 
      const MARGIN_LEFT = 90; 
      const GAP_X_ID = 12; 
      const GAP_X_SOAL = 40; 
      const GAP_Y = 32; 
      const MAX_Y_LIMIT = 1320; 
      const MAX_HEADER_X = 920; 

      let warningShown = false;
      let currentY = MARGIN_TOP;
      
      const blocks = omrStore.activeTemplate.blocks;
      const handwrittenBlock = blocks.find((b: TemplateBlock) => b.type === 'handwritten_identity');
      if (handwrittenBlock) {
          handwrittenBlock.x = MARGIN_LEFT;
          handwrittenBlock.y = currentY;
          currentY += 220 + GAP_Y; 
      }

      const idBlocks = blocks
          .filter((b: TemplateBlock) => identityTypes.includes(b.type) && b.type !== 'handwritten_identity')
          .sort((a: TemplateBlock, b: TemplateBlock) => identityTypes.indexOf(a.type) - identityTypes.indexOf(b.type));

      let currentHeaderX = MARGIN_LEFT;
      let currentRowMaxHeight = 0;

      idBlocks.forEach((block: TemplateBlock) => {
          const dims = getBlockDimensions(block);
          
          if (currentHeaderX + dims.width > MAX_HEADER_X && currentHeaderX > MARGIN_LEFT) {
              currentHeaderX = MARGIN_LEFT;
              currentY += currentRowMaxHeight + GAP_Y;
              currentRowMaxHeight = 0;
          }

          block.x = currentHeaderX;
          block.y = currentY;
          currentHeaderX += dims.width + GAP_X_ID;
          currentRowMaxHeight = Math.max(currentRowMaxHeight, dims.height);
      });

      if (idBlocks.length > 0) currentY += currentRowMaxHeight + 20;

      separatorY.value = currentY;
      currentY += 30; 
      
      const questionBlocks = blocks.filter((b: TemplateBlock) => !identityTypes.includes(b.type));
      
      let currentSoalX = MARGIN_LEFT;
      let currentSoalY = currentY;
      let currentRowMaxHeightSoal = 0;

      questionBlocks.forEach((block: TemplateBlock) => {
          const dims = getBlockDimensions(block);

          if (currentSoalX > MARGIN_LEFT && (currentSoalX + dims.width > MAX_HEADER_X)) {
              currentSoalX = MARGIN_LEFT;
              currentSoalY += currentRowMaxHeightSoal + GAP_Y;
              currentRowMaxHeightSoal = 0; 
          }

          block.x = currentSoalX;
          block.y = currentSoalY;

          currentSoalX += dims.width + GAP_X_SOAL;
          currentRowMaxHeightSoal = Math.max(currentRowMaxHeightSoal, dims.height);

          if (currentSoalY + dims.height > MAX_Y_LIMIT && !warningShown) {
              omrStore.showToast('Peringatan: Area soal mendekati/melebihi batas bawah kertas A4.', 'warning');
              warningShown = true;
          }
      });

  } catch (error: any) {
      omrStore.showToast(`Kesalahan Modul Auto-Layout: ${error.message}`, 'error');
  }
};

const removeBlock = (index: number) => {
  omrStore.activeTemplate.blocks.splice(index, 1);
  autoLayoutBlocks(); 
};

onMounted(() => {
  if(omrStore.activeTemplate.id === '') {
      omrStore.createNewTemplate();
      autoLayoutBlocks(true);
  } else {
      autoLayoutBlocks();
  }
});
</script>

<style scoped>
.property-sidebar {
  width: 100%;
  flex: 0 0 auto;
}
@media (min-width: 960px) {
  .property-sidebar {
    width: 320px;
    min-width: 320px;
  }
}
.canvas-wrapper {
  flex: 1 1 auto;
  min-width: 0;
}
</style>
