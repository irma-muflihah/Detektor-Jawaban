<template>
  <div class="d-flex flex-column flex-md-row h-100 pa-2 pa-md-4 gap-4 designer-layout" style="gap: 1.5rem;">
    <!-- Sheet Configuration Panel -->
    <div class="d-flex flex-column gap-4 overflow-y-auto property-sidebar pr-md-2">
      <!-- Pustaka Templat & Aksi Lembar -->
      <div class="bg-white rounded-xl border pa-5 shadow-sm">
        <div class="d-flex justify-space-between align-center mb-3">
          <h3 class="font-weight-bold text-caption text-grey-darken-1" style="text-transform: uppercase; letter-spacing: 0.05em;">Pustaka Templat</h3>
          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">{{ omrStore.savedTemplates.length }} Koleksi</v-chip>
        </div>
        
        <v-select
          v-model="selectedTemplateToLoad"
          :items="omrStore.savedTemplates"
          item-title="name"
          item-value="id"
          placeholder="Pilih dari koleksi..."
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3 bg-white"
        ></v-select>

        <div class="d-flex gap-2 mb-3">
          <v-btn 
            color="primary" 
            variant="flat" 
            size="small" 
            class="flex-grow-1 text-none font-weight-bold rounded-lg" 
            prepend-icon="mdi-folder-open" 
            :disabled="!selectedTemplateToLoad"
            @click="loadSelectedTemplate"
          >
            Muat Templat
          </v-btn>
          <v-btn 
            color="secondary" 
            variant="tonal" 
            size="small" 
            class="flex-grow-1 text-none font-weight-bold rounded-lg" 
            prepend-icon="mdi-file-plus-outline" 
            @click="createBlankSheet"
          >
            Lembar Baru
          </v-btn>
        </div>

        <v-btn 
          block 
          color="indigo-darken-1" 
          variant="tonal" 
          size="small" 
          class="text-none font-weight-bold rounded-lg mb-2" 
          prepend-icon="mdi-restore" 
          @click="omrStore.resetToDefaultTemplate"
        >
          Default SMPN 2 Kemranjen
        </v-btn>

        <v-btn 
          v-if="hasQuestionBlocks" 
          block 
          color="warning" 
          variant="tonal" 
          size="small" 
          class="text-none font-weight-bold rounded-lg mb-2" 
          prepend-icon="mdi-eraser" 
          @click="omrStore.clearQuestionBlocks"
        >
          Kosongkan Bagian Soal
        </v-btn>

        <div class="d-flex gap-2 mb-2">
          <v-btn 
            color="primary" 
            variant="tonal" 
            size="small" 
            class="flex-grow-1 text-none font-weight-bold rounded-lg" 
            prepend-icon="mdi-file-upload-outline" 
            @click="openJsonImportDialog"
          >
            Impor JSON (ROI)
          </v-btn>
          <v-btn 
            color="teal-darken-2" 
            variant="tonal" 
            size="small" 
            class="flex-grow-1 text-none font-weight-bold rounded-lg" 
            prepend-icon="mdi-code-json" 
            @click="openJsonExportDialog"
          >
            Ekspor JSON
          </v-btn>
        </div>
      </div>

      <div class="bg-white rounded-xl border pa-5 shadow-sm">
        <h3 class="font-weight-bold text-caption text-grey-darken-1 mb-4" style="text-transform: uppercase; letter-spacing: 0.05em;">Konfigurasi Lembar</h3>
        
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
          Tambah Blok
        </v-btn>
        
        <v-btn block color="primary" variant="tonal" class="text-none font-weight-bold mb-2 rounded-lg border" prepend-icon="mdi-auto-fix" @click="autoLayoutBlocks(true)">
          Penataan Otomatis
        </v-btn>

        <v-switch
          v-model="omrStore.activeTemplate.autoLayout"
          label="Penataan Otomatis (Dinamis)"
          color="primary"
          density="compact"
          hide-details
          class="mb-2 ml-1"
        ></v-switch>
      </div>

      <div class="bg-white rounded-xl border pa-5 shadow-sm">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="font-weight-bold text-caption text-grey-darken-1" style="text-transform: uppercase; letter-spacing: 0.05em;">Hierarki Blok</h3>
          <span class="text-caption text-grey">{{ omrStore.activeTemplate.blocks.length }} Blok</span>
        </div>

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
                      label="Catatan / Keterangan"
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
              <v-btn block color="error" variant="text" size="small" class="mt-3" prepend-icon="mdi-trash-can" @click="removeBlock(idx)">Hapus Blok</v-btn>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
        <v-btn block color="secondary" class="mt-6 font-weight-bold rounded-lg text-none" prepend-icon="mdi-content-save" @click="omrStore.saveTemplate">Simpan Templat</v-btn>
        <v-btn block color="primary" variant="flat" class="mt-2 font-weight-bold rounded-lg text-none" prepend-icon="mdi-download" @click="directDownloadJson">
          Unduh Desain JSON (ROI Lengkap)
        </v-btn>
      </div>
    </div>
    
    <!-- Canvas Area -->
    <div class="canvas-wrapper flex-grow-1 d-flex flex-column align-center overflow-auto bg-grey-lighten-2 rounded-xl border-lg pa-2 pa-md-6 pb-12 shadow-inner position-relative">
      <!-- Quick Bar Di Atas Kanvas LJK -->
      <div class="canvas-toolbar w-100 mb-3 d-flex justify-space-between align-center flex-wrap gap-2 bg-white pa-2 pa-sm-3 rounded-lg shadow-sm border" style="max-width: 1000px;">
        <div class="d-flex align-center gap-2">
          <v-chip size="small" color="primary" variant="tonal" class="font-weight-bold">
            <v-icon start icon="mdi-file-document-outline"></v-icon>
            A4 (1000 × 1414 px)
          </v-chip>
          <span class="text-caption text-grey font-weight-medium d-none d-sm-inline">{{ omrStore.activeTemplate.blocks.length }} Blok Terpasang</span>
        </div>

        <div class="d-flex align-center gap-2">
          <v-btn
            size="small"
            color="indigo-darken-1"
            variant="tonal"
            class="text-none font-weight-bold rounded-lg"
            prepend-icon="mdi-file-upload-outline"
            @click="openJsonImportDialog"
          >
            Impor JSON
          </v-btn>
          <v-btn
            size="small"
            color="teal-darken-1"
            variant="tonal"
            class="text-none font-weight-bold rounded-lg"
            prepend-icon="mdi-code-json"
            @click="openJsonExportDialog"
          >
            Pratinjau JSON ROI
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            variant="flat"
            class="text-none font-weight-bold rounded-lg"
            prepend-icon="mdi-download"
            @click="directDownloadJson"
          >
            Unduh .JSON
          </v-btn>
        </div>
      </div>

      <div class="canvas-container">
        <svg viewBox="0 0 1000 1414" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <rect width="1000" height="1414" fill="#ffffff" />
          
          <!-- Judul LJK Global (Diposisikan di y=95 dengan jarak aman dari ticker mark dan batas atas) -->
          <text x="500" y="95" font-size="26" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif" fill="#0f172a">{{ omrStore.activeTemplate.name }}</text>

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
              <rect :width="820" :height="195" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
              <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              <text x="15" y="22" font-size="11" font-weight="bold" font-family="Inter, sans-serif">Nama Lengkap:</text>
              <rect x="15" y="28" width="790" height="24" fill="none" stroke="#475569" stroke-width="1" />
              
              <text x="15" y="70" font-size="11" font-weight="bold" font-family="Inter, sans-serif">Kelas:</text>
              <rect x="15" y="76" width="150" height="24" fill="none" stroke="#475569" stroke-width="1" />
              <text x="180" y="70" font-size="11" font-weight="bold" font-family="Inter, sans-serif">No. Peserta:</text>
              <rect x="180" y="76" width="150" height="24" fill="none" stroke="#475569" stroke-width="1" />
              <text x="345" y="70" font-size="11" font-weight="bold" font-family="Inter, sans-serif">Tanggal Pelaksanaan Tes:</text>
              <rect x="345" y="76" width="460" height="24" fill="none" stroke="#475569" stroke-width="1" />

              <text x="15" y="124" font-size="11" font-weight="bold" font-family="Inter, sans-serif">Pernyataan Kejujuran: Salin teks <tspan font-style="italic">"Saya mengerjakan tes dengan jujur."</tspan></text>
              <rect x="15" y="132" width="550" height="48" fill="none" stroke="#475569" stroke-width="1" />
              <text x="580" y="124" font-size="11" font-weight="bold" font-family="Inter, sans-serif">Tanda Tangan:</text>
              <rect x="580" y="132" width="225" height="48" fill="none" stroke="#475569" stroke-width="1" />
            </g>

            <g v-else-if="block.direction === 'vertical'">
              <g>
                <rect v-for="c in block.cols" :key="'z_col_'+c" v-show="(c-1) % 2 === 1" :x="(c-1)*32 + 4" y="0" width="32" :height="(block.rows||10) * 28 + 35" fill="#f8fafc" />
              </g>
              <rect :width="(block.cols||0) * 32 + 20" :height="(block.rows||10) * 28 + 60" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
              <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              
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
                <rect v-for="r in ((block.type === 'bs3' || block.type === 'yt3') ? (block.rows||1)*3 : block.rows)" :key="'z_row_'+r" v-show="(r-1) % 2 === 1" x="5" :y="(r-1)*30 + 5" :width="(block.options?.length||0) * 35 + 40" height="30" fill="#f8fafc" />
              </g>
              <rect :width="(block.options?.length||0) * 35 + 50" :height="((block.type === 'bs3' || block.type === 'yt3') ? (block.rows||1)*3 : block.rows||1) * 30 + 10" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
              <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
              <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              
              <g v-for="r in ((block.type === 'bs3' || block.type === 'yt3') ? (block.rows||1)*3 : block.rows)" :key="'r'+r">
                <text v-if="(block.type !== 'bs3' && block.type !== 'yt3') || (r-1)%3 === 0" :x="10" :y="(r-1)*30 + 25" font-size="12" font-weight="bold" font-family="Inter, sans-serif">{{ (block.startNum||0) + ((block.type === 'bs3' || block.type === 'yt3') ? Math.floor((r-1)/3) : (r - 1)) }}.</text>
                <g v-for="(opt, oIdx) in block.options" :key="'o'+oIdx">
                  <circle v-if="block.type !== 'kompleks'" :cx="oIdx*35 + 45" :cy="(r-1)*30 + 20" r="10" fill="none" stroke="#475569" stroke-width="1.5" />
                  <rect v-else :x="oIdx*35 + 35" :y="(r-1)*30 + 10" width="20" height="20" rx="3" fill="none" stroke="#475569" stroke-width="1.5" />
                  <text :x="oIdx*35 + 45" :y="(r-1)*30 + 24" :font-size="opt.length > 1 ? 8 : 10" text-anchor="middle" font-family="Inter, sans-serif" fill="#475569">{{ opt }}</text>
                </g>
              </g>
            </g>

            <g v-else-if="block.type === 'teks_kustom'">
              <rect :width="block.cols || 150" :height="block.rows || 100" fill="none" stroke="#475569" stroke-width="1.5" />
              <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
              <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">{{ block.title }}</text>
              <foreignObject x="10" y="10" :width="(block.cols || 150) - 20" :height="(block.rows || 100) - 20">
                <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: Inter, sans-serif; font-size: 13px; color: #0f172a; text-align: justify; word-wrap: break-word; line-height: 1.4; width: 100%; height: 100%; overflow: hidden; white-space: pre-wrap;">{{ block.prefillValue || 'Catatan kosong' }}</div>
              </foreignObject>
            </g>
          </g>
        </svg>
      </div>
    </div>

    <!-- Dialog Ekspor Desain JSON & Koordinat ROI Lengkap -->
    <v-dialog v-model="showJsonDialog" max-width="850" scrollable>
      <v-card class="rounded-xl overflow-hidden shadow-2xl">
        <v-card-title class="pa-4 bg-slate-900 text-white d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon color="teal-lighten-2" icon="mdi-code-json" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Ekspor Desain LJK & Koordinat ROI (JSON)</div>
              <div class="text-caption text-grey-lighten-1">Spesifikasi Region of Interest (ROI) optik lengkap untuk mesin OMR & AI Vision</div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" density="compact" @click="showJsonDialog = false"></v-btn>
        </v-card-title>

        <!-- Summary Chips -->
        <div class="pa-3 bg-grey-lighten-4 border-b d-flex flex-wrap gap-2 align-center">
          <v-chip size="small" color="primary" variant="flat" prepend-icon="mdi-view-grid-outline">
            {{ exportedJsonStats.totalBlocks }} Blok
          </v-chip>
          <v-chip size="small" color="teal-darken-2" variant="flat" prepend-icon="mdi-checkbox-blank-circle-outline">
            {{ exportedJsonStats.totalBubbles }} Titik ROI Bulatan
          </v-chip>
          <v-chip size="small" color="indigo-darken-1" variant="flat" prepend-icon="mdi-numeric">
            {{ exportedJsonStats.totalDigitBoxes }} Kotak Digit
          </v-chip>
          <v-chip size="small" color="amber-darken-3" variant="flat" prepend-icon="mdi-lead-pencil">
            {{ exportedJsonStats.totalHandwritten }} Bidang Isian Tulisan
          </v-chip>
          <v-chip size="small" color="blue-grey-darken-1" variant="outlined">
            Kanvas: 1000 × 1414 px
          </v-chip>
        </div>

        <v-card-text class="pa-4 bg-slate-950" style="max-height: 520px;">
          <pre class="text-caption text-emerald-400 pa-2 overflow-x-auto" style="white-space: pre; line-height: 1.45; font-family: monospace; user-select: all;">{{ exportedJsonString }}</pre>
        </v-card-text>

        <v-card-actions class="pa-4 bg-white border-t d-flex justify-space-between align-center flex-wrap gap-2">
          <v-btn variant="text" color="grey-darken-1" rounded="pill" @click="showJsonDialog = false">
            Tutup
          </v-btn>
          <div class="d-flex gap-2">
            <v-btn variant="outlined" color="primary" rounded="pill" prepend-icon="mdi-content-copy" @click="copyJsonToClipboard">
              Salin JSON
            </v-btn>
            <v-btn color="primary" variant="flat" rounded="pill" class="px-5 font-weight-bold" prepend-icon="mdi-download" @click="directDownloadJson">
              Unduh Berkas .json
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Impor Desain JSON & Koordinat ROI -->
    <v-dialog v-model="showImportJsonDialog" max-width="700" scrollable>
      <v-card class="rounded-xl overflow-hidden shadow-2xl">
        <v-card-title class="pa-4 bg-slate-900 text-white d-flex align-center justify-space-between">
          <div class="d-flex align-center">
            <v-icon color="indigo-lighten-2" icon="mdi-file-upload-outline" class="mr-2"></v-icon>
            <div>
              <div class="text-subtitle-1 font-weight-bold">Impor Desain LJK & Koordinat ROI (JSON)</div>
              <div class="text-caption text-grey-lighten-1">Muat berkas JSON ROI templat LJK untuk langsung diterapkan ke kanvas</div>
            </div>
          </div>
          <v-btn icon="mdi-close" variant="text" color="white" density="compact" @click="showImportJsonDialog = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4 bg-grey-lighten-5">
          <!-- Pilihan Unggah Berkas -->
          <div class="mb-4">
            <label class="text-caption font-weight-bold text-grey-darken-3 mb-1 d-block">Pilih Berkas JSON dari Perangkat:</label>
            <div class="d-flex align-center gap-2">
              <input ref="fileInputRef" type="file" accept=".json,application/json" class="d-none" @change="handleImportFileUpload" />
              <v-btn
                variant="outlined"
                color="primary"
                rounded="lg"
                prepend-icon="mdi-paperclip"
                class="text-none font-weight-bold"
                @click="triggerImportFilePick"
              >
                Pilih Berkas (.json)
              </v-btn>
              <span v-if="importedFileName" class="text-caption text-grey-darken-2 font-weight-medium">
                {{ importedFileName }}
              </span>
            </div>
          </div>

          <!-- Pilihan Tempel Teks JSON -->
          <div>
            <label class="text-caption font-weight-bold text-grey-darken-3 mb-1 d-block">Atau Tempelkan Struktur Kode JSON:</label>
            <v-textarea
              v-model="importJsonText"
              placeholder="Tempel teks JSON di sini (mendukung format OmrRoiJsonExport lengkap atau OmrTemplate)..."
              variant="outlined"
              density="comfortable"
              rows="9"
              auto-grow
              class="font-mono text-caption bg-white"
              hide-details
            ></v-textarea>
          </div>

          <v-alert
            v-if="importJsonError"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3 rounded-lg text-caption"
            closable
            @click:close="importJsonError = ''"
          >
            {{ importJsonError }}
          </v-alert>
        </v-card-text>

        <v-card-actions class="pa-4 bg-white border-t d-flex justify-space-between align-center">
          <v-btn variant="text" color="grey-darken-1" rounded="pill" @click="showImportJsonDialog = false">
            Batal
          </v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="pill"
            class="px-5 font-weight-bold text-none"
            prepend-icon="mdi-check"
            :loading="isImporting"
            @click="executeImportJson"
          >
            Terapkan & Simpan Desain
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useOmrStore } from '../store/omrStore';
import type { TemplateBlock } from '../db/database';
import { generateOmrRoiJson, downloadJsonFile } from '../utils/roiExporter';

const omrStore = useOmrStore();

const separatorY = ref(0);
const selectedTemplateToLoad = ref('');
const selectedBlockType = ref('biasa');
const selectedOptionCount = ref(4); 
const selectedRowCount = ref(10); 

// Istilah-istilah blok soal sesuai spesifikasi:
// PG Biasa, PG Kompleks, BS (1 set), BS (3 set), YT (1 set), YT (3 set), Skala, Menjodohkan, Catatan
const availableBlockTypes = [
  { id: 'handwritten_identity', label: 'ID: Tulis Tangan' },
  { id: 'identity_nisn', label: 'ID: NISN' },
  { id: 'identity_npsn', label: 'ID: NPSN' },
  { id: 'identity_subject', label: 'ID: Mapel' },
  { id: 'identity_test', label: 'ID: Kode Tes' },
  { id: 'biasa', label: 'PG Biasa' },
  { id: 'kompleks', label: 'PG Kompleks' },
  { id: 'bs', label: 'BS (1 set)' },
  { id: 'bs3', label: 'BS (3 set)' },
  { id: 'yt', label: 'YT (1 set)' },
  { id: 'yt3', label: 'YT (3 set)' },
  { id: 'skala', label: 'Skala' },
  { id: 'jodoh', label: 'Menjodohkan' },
  { id: 'teks_kustom', label: 'Catatan' }
];

const identityTypes = ['handwritten_identity', 'identity_nisn', 'identity_npsn', 'identity_subject', 'identity_test'];

const isQuestionBlock = computed(() => {
  return !identityTypes.includes(selectedBlockType.value);
});

const hasQuestionBlocks = computed(() => {
  return omrStore.activeTemplate.blocks.some(b => !identityTypes.includes(b.type));
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
  } else if (['bs', 'bs3'].includes(type)) {
      return [{ title: '2 (B, S)', value: 2 }];
  } else if (['yt', 'yt3'].includes(type)) {
      return [{ title: '2 (Y, T)', value: 2 }];
  } else {
      return [{ title: 'Bawaan', value: 0 }];
  }
});

const recalculateQuestionNumbers = () => {
  let currentStartNumber = 1;
  omrStore.activeTemplate.blocks.forEach((block: TemplateBlock) => {
      if (!identityTypes.includes(block.type) && block.type !== 'teks_kustom') {
          block.startNum = currentStartNumber;
          currentStartNumber += (block.rows || 0);
      }
  });
};

watch(selectedBlockType, (newType) => {
  if (['biasa', 'kompleks', 'skala', 'jodoh'].includes(newType)) {
      selectedOptionCount.value = newType === 'jodoh' ? 4 : 4; 
  } else if (['bs', 'bs3', 'yt', 'yt3'].includes(newType)) {
      selectedOptionCount.value = 2;
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
              newBlock = { ...newBlock, title: 'PG Biasa', direction: 'horizontal', rows: rowCount, options: generateAlphaOptions(optCount), startNum: 1 };
              break;
          case 'kompleks':
              newBlock = { ...newBlock, title: 'PG Kompleks', direction: 'horizontal', rows: rowCount, options: generateAlphaOptions(optCount), startNum: 1 };
              break;
          case 'bs':
              newBlock = { ...newBlock, title: 'BS (1 set)', direction: 'horizontal', rows: rowCount, options: ['B','S'], startNum: 1 };
              break;
          case 'bs3':
              newBlock = { ...newBlock, title: 'BS (3 set)', direction: 'horizontal', rows: rowCount, options: ['B','S'], startNum: 1 };
              break;
          case 'yt':
              newBlock = { ...newBlock, title: 'YT (1 set)', direction: 'horizontal', rows: rowCount, options: ['Y','T'], startNum: 1 };
              break;
          case 'yt3':
              newBlock = { ...newBlock, title: 'YT (3 set)', direction: 'horizontal', rows: rowCount, options: ['Y','T'], startNum: 1 };
              break;
          case 'skala':
              newBlock = { ...newBlock, title: 'Skala', direction: 'horizontal', rows: rowCount, options: generateNumericOptions(optCount), startNum: 1 };
              break;
          case 'jodoh':
              newBlock = { ...newBlock, title: 'Menjodohkan', direction: 'horizontal', rows: rowCount, options: generateAlphaOptions(optCount), startNum: 1 };
              break;
          case 'teks_kustom':
              newBlock = { ...newBlock, title: 'Catatan', direction: 'teks', prefillValue: 'Jaga lembar jawaban agar tidak terlipat, basah, atau kotor.', cols: 250, rows: 95 };
              break;
          default:
              throw new Error("Tipe blok tidak dikenal.");
      }

      blocks.push(newBlock);
      autoLayoutBlocks();
      omrStore.showToast(`Blok ${newBlock.title} ditambahkan`, 'success');
  } catch (error: any) {
      omrStore.showToast(`Kesalahan: ${error.message}`, 'error');
  }
};

const getBlockDimensions = (block: TemplateBlock) => {
  if (block.type === 'handwritten_identity') return { width: 820, height: 195 };
  if (block.type === 'teks_kustom') return { width: block.cols || 250, height: block.rows || 95 };
  
  const isTriple = block.type === 'bs3' || block.type === 'yt3';
  const width = block.direction === 'vertical' ? (block.cols||0) * 32 + 20 : (block.options?.length||0) * 35 + 50;
  const height = block.direction === 'vertical' ? (block.rows||0) * 28 + 60 : (isTriple ? (block.rows||0)*3 : (block.rows||0)) * 30 + 10;
  return { width, height };
};

// Partisi blok-blok ke dalam baris-baris secara dinamis (fluid) berdasarkan lebar kanvas
const partitionBlocksIntoRows = (blockList: TemplateBlock[], maxWidth: number, minGap: number): TemplateBlock[][] => {
  const rows: TemplateBlock[][] = [];
  let currentRow: TemplateBlock[] = [];
  let currentTotalWidth = 0;

  for (const block of blockList) {
    const dims = getBlockDimensions(block);
    const neededWidth = currentRow.length === 0 ? dims.width : currentTotalWidth + minGap + dims.width;

    if (currentRow.length > 0 && neededWidth > maxWidth) {
      rows.push(currentRow);
      currentRow = [block];
      currentTotalWidth = dims.width;
    } else {
      currentRow.push(block);
      currentTotalWidth = neededWidth;
    }
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  return rows;
};

// Posisikan satu baris blok secara merata dan seimbang (proporsional)
const positionRowFluidly = (
  row: TemplateBlock[],
  yPos: number,
  leftBound: number,
  availableWidth: number,
  minGap: number,
  maxGap: number
) => {
  const k = row.length;
  if (k === 0) return;

  const dimsList = row.map(b => getBlockDimensions(b));
  const totalBlockWidth = dimsList.reduce((sum, d) => sum + d.width, 0);
  const remainingSpace = availableWidth - totalBlockWidth;

  if (k === 1) {
    const singleWidth = dimsList[0].width;
    if (singleWidth >= availableWidth - 20) {
      row[0].x = leftBound;
    } else {
      row[0].x = Math.round(leftBound + (availableWidth - singleWidth) / 2);
    }
    row[0].y = yPos;
    return;
  }

  const rawGap = remainingSpace / (k - 1);

  if (rawGap >= minGap && rawGap <= maxGap) {
    let curX = leftBound;
    for (let i = 0; i < k; i++) {
      row[i].x = Math.round(curX);
      row[i].y = yPos;
      curX += dimsList[i].width + rawGap;
    }
  } else if (rawGap > maxGap) {
    const effectiveGap = maxGap;
    const contentRowWidth = totalBlockWidth + (k - 1) * effectiveGap;
    const sideMargin = Math.max(0, (availableWidth - contentRowWidth) / 2);

    let curX = leftBound + sideMargin;
    for (let i = 0; i < k; i++) {
      row[i].x = Math.round(curX);
      row[i].y = yPos;
      curX += dimsList[i].width + effectiveGap;
    }
  } else {
    const effectiveGap = Math.max(4, remainingSpace / (k - 1));
    let curX = leftBound;
    for (let i = 0; i < k; i++) {
      row[i].x = Math.round(curX);
      row[i].y = yPos;
      curX += dimsList[i].width + effectiveGap;
    }
  }
};

const autoLayoutBlocks = (force = false) => {
  if (!omrStore.activeTemplate.autoLayout && force !== true) return;
  try {
    const LEFT_BOUND = 90;
    const RIGHT_BOUND = 910;
    const USABLE_WIDTH = RIGHT_BOUND - LEFT_BOUND; // 820px
    const MARGIN_TOP = 135;
    const GAP_Y = 30;
    const MAX_Y_LIMIT = 1320;
    const MAX_NATURAL_GAP = 60;
    const MIN_NATURAL_GAP = 14;

    let warningShown = false;
    let currentY = MARGIN_TOP;
    
    const blocks = omrStore.activeTemplate.blocks;
    if (!blocks || blocks.length === 0) return;

    // 1. Data Peserta / Tulis Tangan (Lebar Penuh 820px)
    const handwrittenBlock = blocks.find((b: TemplateBlock) => b.type === 'handwritten_identity');
    if (handwrittenBlock) {
      handwrittenBlock.x = LEFT_BOUND;
      handwrittenBlock.y = currentY;
      currentY += 195 + GAP_Y;
    }

    // 2. Blok Identitas Digital (NISN, NPSN, Mapel, Kode Tes)
    const idBlocks = blocks
      .filter((b: TemplateBlock) => identityTypes.includes(b.type) && b.type !== 'handwritten_identity')
      .sort((a: TemplateBlock, b: TemplateBlock) => identityTypes.indexOf(a.type) - identityTypes.indexOf(b.type));

    if (idBlocks.length > 0) {
      const idRows = partitionBlocksIntoRows(idBlocks, USABLE_WIDTH, 12);
      for (const row of idRows) {
        positionRowFluidly(row, currentY, LEFT_BOUND, USABLE_WIDTH, 12, 40);
        const rowMaxH = Math.max(...row.map(b => getBlockDimensions(b).height));
        currentY += rowMaxH + GAP_Y;
      }
      separatorY.value = currentY - (GAP_Y / 2);
      currentY += 10;
    } else {
      separatorY.value = 0;
    }

    // 3. Blok Soal / Keterangan
    const questionBlocks = blocks.filter((b: TemplateBlock) => !identityTypes.includes(b.type));
    if (questionBlocks.length > 0) {
      const qRows = partitionBlocksIntoRows(questionBlocks, USABLE_WIDTH, MIN_NATURAL_GAP);
      let testTotalHeight = currentY;
      for (const row of qRows) {
        testTotalHeight += Math.max(...row.map(b => getBlockDimensions(b).height)) + GAP_Y;
      }

      const hasTallBlock = questionBlocks.some(b => getBlockDimensions(b).height > 400);
      if ((testTotalHeight > MAX_Y_LIMIT || hasTallBlock) && questionBlocks.length >= 3) {
        // Alokasikan ke dalam 3 kolom seimbang vertikal
        const colsCount = 3;
        const colBlocks: TemplateBlock[][] = [[], [], []];
        const colHeights = [0, 0, 0];

        // Pisahkan blok tinggi terlebih dahulu ke kolom ke-3
        questionBlocks.forEach(b => {
          const h = getBlockDimensions(b).height;
          if (h > 400) {
            colBlocks[2].push(b);
            colHeights[2] += h + 20;
          }
        });

        // Masukkan sisa blok ke kolom dengan tinggi tersedikit
        questionBlocks.forEach(b => {
          const h = getBlockDimensions(b).height;
          if (h <= 400) {
            let minColIdx = 0;
            if (colHeights[1] < colHeights[minColIdx]) minColIdx = 1;
            if (colHeights[2] < colHeights[minColIdx] && colHeights[2] + h < MAX_Y_LIMIT - currentY) minColIdx = 2;
            colBlocks[minColIdx].push(b);
            colHeights[minColIdx] += h + 20;
          }
        });

        const colWidths = colBlocks.map(col => {
          if (col.length === 0) return 180;
          return Math.max(...col.map(b => getBlockDimensions(b).width));
        });
        const totalColsW = colWidths.reduce((a, b) => a + b, 0);
        const freeW = USABLE_WIDTH - totalColsW;
        const gutter = Math.max(16, freeW / 2);

        let curColX = LEFT_BOUND + Math.max(0, (USABLE_WIDTH - (totalColsW + gutter * 2)) / 2);
        for (let c = 0; c < colsCount; c++) {
          let curBlockY = currentY;
          for (const b of colBlocks[c]) {
            b.x = Math.round(curColX);
            b.y = Math.round(curBlockY);
            curBlockY += getBlockDimensions(b).height + 20;
          }
          curColX += colWidths[c] + gutter;
        }
      } else {
        for (const row of qRows) {
          positionRowFluidly(row, currentY, LEFT_BOUND, USABLE_WIDTH, MIN_NATURAL_GAP, MAX_NATURAL_GAP);
          const rowMaxH = Math.max(...row.map(b => getBlockDimensions(b).height));
          
          if (currentY + rowMaxH > MAX_Y_LIMIT && !warningShown) {
            omrStore.showToast('Peringatan: Area soal mendekati/melebihi batas bawah kertas A4.', 'warning');
            warningShown = true;
          }
          
          currentY += rowMaxH + GAP_Y;
        }
      }
    }

    // 4. Perbarui koordinat ROI bulatan (bubbles)
    blocks.forEach((b: TemplateBlock) => {
      b.bubbles = omrStore.computeBlockBubbles(b);
    });

  } catch (error: any) {
    omrStore.showToast(`Kesalahan Penataan: ${error.message}`, 'error');
  }
};

const removeBlock = (index: number) => {
  omrStore.activeTemplate.blocks.splice(index, 1);
  autoLayoutBlocks(); 
};

const createBlankSheet = () => {
  omrStore.createNewTemplate();
  autoLayoutBlocks(true);
  omrStore.showToast('Lembar baru siap tanpa blok soal.', 'info');
};

const loadSelectedTemplate = () => {
  if (!selectedTemplateToLoad.value) return;
  const tpl = omrStore.savedTemplates.find(t => t.id === selectedTemplateToLoad.value);
  if (tpl) {
    omrStore.openTemplate(tpl);
    autoLayoutBlocks();
    omrStore.showToast(`Memuat templat: ${tpl.name}`, 'success');
  }
};

// State dan Aksi Ekspor JSON & ROI Lengkap
const showJsonDialog = ref(false);
const exportedJsonString = ref('');
const exportedJsonStats = ref({
  totalBlocks: 0,
  totalBubbles: 0,
  totalDigitBoxes: 0,
  totalHandwritten: 0,
  questionCount: 0
});

const generateJsonData = () => {
  const tpl = JSON.parse(JSON.stringify(omrStore.activeTemplate));
  tpl.blocks.forEach((b: TemplateBlock) => {
    b.bubbles = omrStore.computeBlockBubbles(b);
  });
  return generateOmrRoiJson(tpl);
};

const directDownloadJson = () => {
  try {
    const data = generateJsonData();
    const safeName = (omrStore.activeTemplate.name || 'Desain_LJK').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${safeName}_ROI_Coordinates.json`;
    downloadJsonFile(data, filename);
    omrStore.showToast(`Berkas JSON ROI berhasil diunduh (${filename})`, 'success');
  } catch (err: any) {
    omrStore.showToast(`Gagal mengunduh JSON: ${err.message}`, 'error');
  }
};

const openJsonExportDialog = () => {
  try {
    const data = generateJsonData();
    exportedJsonString.value = JSON.stringify(data, null, 2);
    exportedJsonStats.value = {
      totalBlocks: data.summary.total_blocks,
      totalBubbles: data.summary.total_bubbles,
      totalDigitBoxes: data.summary.total_digit_boxes,
      totalHandwritten: data.summary.total_handwritten_fields,
      questionCount: data.summary.question_count
    };
    showJsonDialog.value = true;
  } catch (err: any) {
    omrStore.showToast(`Gagal menyiapkan data JSON: ${err.message}`, 'error');
  }
};

const copyJsonToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportedJsonString.value);
    omrStore.showToast('JSON ROI berhasil disalin ke papan klip!', 'success');
  } catch {
    omrStore.showToast('Gagal menyalin otomatis, silakan salin teks manual.', 'warning');
  }
};

// State dan Handler Impor JSON
const showImportJsonDialog = ref(false);
const importJsonText = ref('');
const importJsonError = ref('');
const importedFileName = ref('');
const isImporting = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerImportFilePick = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const openJsonImportDialog = () => {
  importJsonText.value = '';
  importJsonError.value = '';
  importedFileName.value = '';
  showImportJsonDialog.value = true;
};

const handleImportFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (!target.files || target.files.length === 0) return;
  const file = target.files[0];
  importedFileName.value = file.name;
  const reader = new FileReader();
  reader.onload = (e) => {
    importJsonText.value = String(e.target?.result || '');
    importJsonError.value = '';
  };
  reader.onerror = () => {
    importJsonError.value = 'Gagal membaca berkas JSON dari penyimpanan.';
  };
  reader.readAsText(file);
};

const executeImportJson = async () => {
  if (!importJsonText.value.trim()) {
    importJsonError.value = 'Silakan pilih berkas JSON atau tempel teks JSON terlebih dahulu.';
    return;
  }
  isImporting.value = true;
  importJsonError.value = '';
  try {
    const imported = await omrStore.importTemplateFromJson(importJsonText.value);
    selectedTemplateToLoad.value = imported.id;
    recalculateQuestionNumbers();
    showImportJsonDialog.value = false;
  } catch (err: any) {
    importJsonError.value = err.message || 'Format JSON tidak valid atau struktur tidak dikenali.';
  } finally {
    isImporting.value = false;
  }
};

onMounted(async () => {
  await omrStore.loadTemplatesFromDB();
  // Pastikan templat aktif tersedia; jika belum ada atau kosong, aktifkan templat standar SMPN 2 Kemranjen
  if (!omrStore.activeTemplate.id || omrStore.activeTemplate.blocks.length === 0) {
    omrStore.resetToDefaultTemplate();
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

