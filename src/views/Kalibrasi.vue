<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-3 flex-wrap gap-2">
      <div class="d-flex align-center gap-2">
        <v-avatar color="primary" size="40" class="text-white">
          <v-icon size="24">mdi-crosshairs-gps</v-icon>
        </v-avatar>
        <div>
          <h2 class="text-h6 font-weight-bold text-grey-darken-3 d-flex align-center gap-2">
            Laman Analisis & Kalibrasi ROI LJK
            <v-chip v-if="activeScan?.is_calibrated" size="x-small" color="amber-darken-3" class="font-weight-bold text-white">
              <v-icon size="12" start>mdi-star</v-icon> Sampel Sempurna
            </v-chip>
          </h2>
          <p class="text-caption text-grey-darken-1 mb-0">
            Analisis visual bounding overlay, koreksi jawaban secara dinamis, dan penetapan sampel kalibrasi presisi.
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2 flex-wrap">
        <v-btn color="primary" variant="tonal" rounded="pill" prepend-icon="mdi-text-recognition" to="/scanner">
          Pemindai
        </v-btn>
        <v-btn color="secondary" variant="tonal" rounded="pill" prepend-icon="mdi-database-eye" to="/results">
          Data Hasil
        </v-btn>
      </div>
    </div>

    <!-- Main Grid Layout: Viewport Citra & Panel Koreksi -->
    <v-row class="flex-grow-1 overflow-hidden" dense>
      <!-- KOLOM KIRI: Visualizer Citra & Bounding Overlay -->
      <v-col cols="12" lg="7" xl="8" class="d-flex flex-column h-100 overflow-hidden">
        <v-card class="rounded-xl border bg-white flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
          <!-- Toolbar Kontrol Visualizer -->
          <div class="pa-3 border-b bg-grey-lighten-5 d-flex align-center justify-space-between flex-wrap gap-2 flex-shrink-0">
            <!-- Selector Hasil Scan & Template -->
            <div class="d-flex align-center gap-2 flex-wrap flex-grow-1" style="max-width: 550px;">
              <v-select
                v-model="selectedScanKey"
                :items="scanSelectItems"
                item-title="title"
                item-value="key"
                label="Pilih Hasil Pemindaian"
                variant="outlined"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-file-document-outline"
                style="min-width: 260px;"
                @update:model-value="onScanSelected"
              ></v-select>

              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                rounded="lg"
                prepend-icon="mdi-upload"
                class="text-none font-weight-bold"
                @click="triggerUploadImage"
              >
                Unggah Citra
              </v-btn>
              <input ref="fileInputRef" type="file" accept="image/*" class="d-none" @change="onImageUploaded" />
            </div>

            <!-- Kontrol Overlay & Tampilan -->
            <div class="d-flex align-center gap-1 flex-wrap">
              <!-- Mode Tampilan Layer -->
              <v-btn-toggle v-model="viewLayer" mandatory density="compact" color="primary" rounded="lg" class="border bg-white">
                <v-btn value="overlay" size="small" class="text-none px-2" title="Citra Asli + Bounding Jawaban">
                  <v-icon size="16" start>mdi-layers-outline</v-icon> Bounding
                </v-btn>
                <v-btn value="original" size="small" class="text-none px-2" title="Hanya Citra Asli">
                  <v-icon size="16" start>mdi-image-outline</v-icon> Asli
                </v-btn>
                <v-btn value="all_rois" size="small" class="text-none px-2" title="Tampilkan Seluruh Grid Vektor ROI">
                  <v-icon size="16" start>mdi-grid</v-icon> Grid ROI
                </v-btn>
              </v-btn-toggle>

              <!-- Pemilih Warna Bounding -->
              <v-menu location="bottom end">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" size="small" variant="outlined" rounded="lg" class="px-2" title="Ubah Warna Bounding">
                    <span class="rounded-circle mr-1" :style="{ width: '14px', height: '14px', backgroundColor: boundingColor }"></span>
                    <v-icon size="14">mdi-palette</v-icon>
                  </v-btn>
                </template>
                <v-card class="pa-2 rounded-lg" min-width="160">
                  <div class="text-caption font-weight-bold text-grey-darken-2 mb-1">Warna Bounding</div>
                  <div class="d-flex gap-2 flex-wrap">
                    <v-btn
                      v-for="c in colorPresets"
                      :key="c.color"
                      size="x-small"
                      icon
                      :style="{ backgroundColor: c.color }"
                      @click="boundingColor = c.color"
                    >
                      <v-icon v-if="boundingColor === c.color" size="12" color="white">mdi-check</v-icon>
                    </v-btn>
                  </div>
                </v-card>
              </v-menu>

              <!-- Zoom Controls -->
              <v-btn icon="mdi-magnify-minus-outline" size="small" variant="text" @click="zoomOut" title="Zoom Out"></v-btn>
              <span class="text-caption font-weight-bold px-1" style="min-width: 45px; text-align: center;">
                {{ Math.round(zoomLevel * 100) }}%
              </span>
              <v-btn icon="mdi-magnify-plus-outline" size="small" variant="text" @click="zoomIn" title="Zoom In"></v-btn>
              <v-btn icon="mdi-fit-to-screen-outline" size="small" variant="text" @click="fitZoom" title="Reset / Fit"></v-btn>
            </div>
          </div>

          <!-- Canvas Viewport Interaktif -->
          <div
            ref="viewportRef"
            class="flex-grow-1 position-relative overflow-hidden bg-grey-darken-4 d-flex align-center justify-center cursor-grab"
            :class="{ 'cursor-grabbing': isDragging }"
            @mousedown="startPan"
            @mousemove="onPan"
            @mouseup="endPan"
            @mouseleave="endPan"
            @wheel.prevent="onWheel"
          >
            <!-- Kontainer Transformasi (Pan & Zoom) -->
            <div
              v-if="imageUrl"
              class="position-relative"
              :style="{
                transform: `translate(${panX}px, ${panY}px) scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out'
              }"
            >
              <!-- Citra Lembar LJK -->
              <img
                ref="imageRef"
                :src="imageUrl"
                alt="Citra LJK"
                class="d-block user-select-none"
                style="max-width: none; pointer-events: none; box-shadow: 0 10px 25px rgba(0,0,0,0.5);"
                @load="onImageLoaded"
              />

              <!-- SVG Overlay Bounding & ROI Grid -->
              <svg
                v-if="imageNaturalWidth > 0 && imageNaturalHeight > 0"
                class="position-absolute top-0 left-0"
                :width="imageNaturalWidth"
                :height="imageNaturalHeight"
                :viewBox="`0 0 ${imageNaturalWidth} ${imageNaturalHeight}`"
                style="pointer-events: none; z-index: 2;"
              >
                <!-- 1. Grid Seluruh ROI Templat (Faint Mode saat layer all_rois aktif) -->
                <g v-if="viewLayer === 'all_rois'" opacity="0.45">
                  <template v-for="roi in activeVectorRois" :key="'all_' + roi.id">
                    <rect
                      v-if="roi.isBox || roi.blockType === 'kompleks'"
                      :x="roi.normX * imageNaturalWidth - roi.normR * imageNaturalWidth"
                      :y="roi.normY * imageNaturalHeight - roi.normR * imageNaturalWidth"
                      :width="roi.normR * imageNaturalWidth * 2"
                      :height="roi.normR * imageNaturalWidth * 2"
                      rx="3"
                      fill="none"
                      stroke="#38bdf8"
                      stroke-width="1.5"
                      stroke-dasharray="3,3"
                    />
                    <circle
                      v-else
                      :cx="roi.normX * imageNaturalWidth"
                      :cy="roi.normY * imageNaturalHeight"
                      :r="roi.normR * imageNaturalWidth"
                      fill="none"
                      stroke="#38bdf8"
                      stroke-width="1.5"
                      stroke-dasharray="3,3"
                    />
                  </template>
                </g>

                <!-- 2. Bounding Circle / Bounding Box untuk Jawaban & Identitas Aktif -->
                <g v-if="viewLayer !== 'original'">
                  <template v-for="(bnd, bIdx) in activeBoundings" :key="'bnd_' + bIdx">
                    <!-- Bounding Persegi untuk PG Kompleks -->
                    <g v-if="bnd.isBox">
                      <!-- Glow Effect Outer Box -->
                      <rect
                        :x="bnd.x - bnd.size / 2"
                        :y="bnd.y - bnd.size / 2"
                        :width="bnd.size"
                        :height="bnd.size"
                        rx="4"
                        :fill="focusedQuestion === bnd.nomor_soal ? '#f59e0b' : boundingColor"
                        :fill-opacity="focusedQuestion === bnd.nomor_soal ? 0.35 : 0.22"
                        :stroke="focusedQuestion === bnd.nomor_soal ? '#f59e0b' : boundingColor"
                        :stroke-width="focusedQuestion === bnd.nomor_soal ? strokeWidth + 1.5 : strokeWidth"
                      />
                      <!-- Label Pojok Bounding -->
                      <rect
                        :x="bnd.x - bnd.size / 2 - 1"
                        :y="bnd.y - bnd.size / 2 - 14"
                        :width="Math.max(28, bnd.label.length * 7 + 8)"
                        height="13"
                        rx="2"
                        :fill="focusedQuestion === bnd.nomor_soal ? '#d97706' : boundingColor"
                      />
                      <text
                        :x="bnd.x - bnd.size / 2 + 3"
                        :y="bnd.y - bnd.size / 2 - 4"
                        fill="#ffffff"
                        font-size="9"
                        font-weight="bold"
                        font-family="monospace"
                      >{{ bnd.label }}</text>
                    </g>

                    <!-- Bounding Circle untuk Pilihan Ganda & Identitas Bulatan -->
                    <g v-else>
                      <!-- Outer Circle -->
                      <circle
                        :cx="bnd.x"
                        :cy="bnd.y"
                        :r="bnd.r"
                        :fill="focusedQuestion === bnd.nomor_soal ? '#f59e0b' : boundingColor"
                        :fill-opacity="focusedQuestion === bnd.nomor_soal ? 0.35 : 0.22"
                        :stroke="focusedQuestion === bnd.nomor_soal ? '#f59e0b' : boundingColor"
                        :stroke-width="focusedQuestion === bnd.nomor_soal ? strokeWidth + 1.5 : strokeWidth"
                      />
                      <!-- Titik Pusat Centroid -->
                      <circle
                        :cx="bnd.x"
                        :cy="bnd.y"
                        r="2.5"
                        :fill="focusedQuestion === bnd.nomor_soal ? '#f59e0b' : boundingColor"
                      />
                      <!-- Label Pojok Bounding -->
                      <rect
                        :x="bnd.x - bnd.r"
                        :y="bnd.y - bnd.r - 14"
                        :width="Math.max(24, bnd.label.length * 7 + 8)"
                        height="13"
                        rx="2"
                        :fill="focusedQuestion === bnd.nomor_soal ? '#d97706' : boundingColor"
                      />
                      <text
                        :x="bnd.x - bnd.r + 3"
                        :y="bnd.y - bnd.r - 4"
                        fill="#ffffff"
                        font-size="9"
                        font-weight="bold"
                        font-family="monospace"
                      >{{ bnd.label }}</text>
                    </g>
                  </template>
                </g>
              </svg>
            </div>

            <!-- Placeholder Saat Belum Ada Citra -->
            <div v-else class="text-center pa-8 text-grey-lighten-1">
              <v-icon size="64" class="mb-3 opacity-50">mdi-image-search-outline</v-icon>
              <div class="text-h6 font-weight-bold">Tidak ada citra lembar LJK yang dipilih</div>
              <div class="text-body-2 text-grey">Pilih data hasil pemindaian di atas atau unggah file citra baru.</div>
              <v-btn color="primary" variant="flat" rounded="pill" class="mt-4" prepend-icon="mdi-upload" @click="triggerUploadImage">
                Unggah Citra LJK
              </v-btn>
            </div>

            <!-- Petunjuk Navigasi Viewport -->
            <div
              v-if="imageUrl"
              class="position-absolute bottom-0 left-0 ma-3 pa-2 rounded-lg bg-black bg-opacity-70 text-white text-caption d-flex align-center gap-2 pointer-events-none"
            >
              <v-icon size="14">mdi-gesture-tap-drag</v-icon>
              <span>Scroll untuk Zoom • Tarik (Drag) untuk Geser</span>
              <v-chip size="x-small" color="primary" class="ml-1 font-weight-bold">
                {{ activeBoundings.length }} Bounding Aktif
              </v-chip>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- KOLOM KANAN: Panel Editor Koreksi Jawaban, Identitas, & Kalibrasi -->
      <v-col cols="12" lg="5" xl="4" class="d-flex flex-column h-100 overflow-hidden">
        <v-card class="rounded-xl border bg-white flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
          <v-tabs v-model="activeTab" bg-color="grey-lighten-5" color="primary" density="compact" class="border-b">
            <v-tab value="answers" class="text-none font-weight-bold">
              <v-icon size="18" start>mdi-check-all</v-icon> Koreksi Jawaban
            </v-tab>
            <v-tab value="identity" class="text-none font-weight-bold">
              <v-icon size="18" start>mdi-account-details-outline</v-icon> Identitas Siswa
            </v-tab>
            <v-tab value="calibration" class="text-none font-weight-bold">
              <v-icon size="18" start>mdi-tune-vertical</v-icon> Kalibrasi ROI
            </v-tab>
          </v-tabs>

          <v-window v-model="activeTab" class="flex-grow-1 overflow-y-auto pa-3">
            <!-- TAB 1: KOREKSI JAWABAN DINAMIS -->
            <v-window-item value="answers" class="h-100">
              <div class="d-flex align-center justify-space-between mb-3">
                <div>
                  <div class="text-subtitle-2 font-weight-bold text-grey-darken-3">Daftar Jawaban Butir Soal</div>
                  <div class="text-caption text-grey-darken-1">
                    Ubah jawaban di bawah, bounding box/circle akan <strong>langsung berpindah</strong> ke posisi bubble baru.
                  </div>
                </div>
                <v-chip size="small" color="blue-lighten-5" class="text-primary font-weight-bold">
                  {{ editableAnswers.length }} Soal
                </v-chip>
              </div>

              <!-- List Kartu Butir Soal -->
              <div class="d-flex flex-column gap-2 pr-1">
                <v-card
                  v-for="(ans, aIdx) in editableAnswers"
                  :key="ans.nomor_soal"
                  variant="outlined"
                  class="pa-2 rounded-lg bg-grey-lighten-5 transition-all"
                  :class="{ 'border-primary': focusedQuestion === ans.nomor_soal }"
                >
                  <div class="d-flex align-center justify-space-between mb-1">
                    <div class="d-flex align-center gap-2">
                      <v-avatar size="24" color="primary" class="text-white text-caption font-weight-black">
                        {{ ans.nomor_soal }}
                      </v-avatar>
                      <span class="text-caption font-weight-bold text-grey-darken-3">Soal No. {{ ans.nomor_soal }}</span>
                      <v-chip size="x-small" :color="getQuestionTypeBadgeColor(ans.bentuk_soal)" class="font-weight-bold">
                        {{ formatQuestionType(ans.bentuk_soal) }}
                      </v-chip>
                    </div>

                    <!-- Indikator Jawaban Terpilih -->
                    <v-chip
                      size="small"
                      :color="isAnswerEmpty(ans.jawaban) ? 'grey' : 'primary'"
                      variant="flat"
                      class="font-weight-black"
                    >
                      {{ formatAnswerDisplay(ans.jawaban) }}
                    </v-chip>
                  </div>

                  <!-- Input & Chip Pilihan Cepat Opsi -->
                  <div class="mt-2 pt-1 border-t d-flex align-center justify-space-between flex-wrap gap-1">
                    <!-- Chip Pilihan Opsi Berdasarkan Templat -->
                    <div class="d-flex align-center gap-1 flex-wrap">
                      <!-- Opsi untuk PG Kompleks (Multi Select Toggle) -->
                      <template v-if="ans.bentuk_soal === 'kompleks'">
                        <v-btn
                          v-for="opt in getQuestionAllowedOptions(ans.nomor_soal)"
                          :key="opt"
                          size="x-small"
                          :variant="isComplexOptionSelected(ans.jawaban, opt) ? 'flat' : 'outlined'"
                          :color="isComplexOptionSelected(ans.jawaban, opt) ? 'primary' : 'grey-darken-1'"
                          class="font-weight-bold px-2"
                          @click="toggleComplexAnswer(aIdx, opt)"
                        >
                          {{ opt }}
                        </v-btn>
                        <v-btn
                          size="x-small"
                          variant="text"
                          color="error"
                          class="text-caption font-weight-bold"
                          title="Kosongkan jawaban"
                          @click="setAnswerDirectly(aIdx, [])"
                        >
                          Reset
                        </v-btn>
                      </template>

                      <!-- Opsi untuk PG Biasa, Jodoh, BS, YT (Single Select) -->
                      <template v-else-if="ans.bentuk_soal !== 'bs3' && ans.bentuk_soal !== 'yt3'">
                        <v-btn
                          v-for="opt in getQuestionAllowedOptions(ans.nomor_soal)"
                          :key="opt"
                          size="x-small"
                          :variant="ans.jawaban === opt ? 'flat' : 'outlined'"
                          :color="ans.jawaban === opt ? 'primary' : 'grey-darken-1'"
                          class="font-weight-bold px-2"
                          @click="setSingleAnswer(aIdx, opt)"
                        >
                          {{ opt }}
                        </v-btn>
                        <v-btn
                          size="x-small"
                          :variant="ans.jawaban === '-' ? 'flat' : 'outlined'"
                          color="grey-darken-2"
                          class="px-2"
                          title="Kosong (-)"
                          @click="setSingleAnswer(aIdx, '-')"
                        >
                          -
                        </v-btn>
                      </template>

                      <!-- Opsi untuk BS3 / YT3 (3 Baris Sub-pernyataan) -->
                      <template v-else>
                        <div class="d-flex align-center gap-1">
                          <v-select
                            v-for="subIdx in [0, 1, 2]"
                            :key="subIdx"
                            :model-value="getTripleSubAnswer(ans.jawaban, subIdx)"
                            :items="getQuestionAllowedOptions(ans.nomor_soal)"
                            variant="outlined"
                            density="compact"
                            hide-details
                            style="width: 58px;"
                            @update:model-value="(val) => setTripleSubAnswer(aIdx, subIdx, val)"
                          ></v-select>
                        </div>
                      </template>
                    </div>

                    <!-- Input Teks Bebas dengan Validasi Otomatis -->
                    <div style="max-width: 110px;">
                      <v-text-field
                        :model-value="formatAnswerDisplay(ans.jawaban)"
                        placeholder="Ubah..."
                        variant="outlined"
                        density="compact"
                        hide-details
                        class="text-caption"
                        @change="(e: any) => onCustomTextInput(aIdx, e.target.value)"
                      ></v-text-field>
                    </div>
                  </div>
                </v-card>
              </div>
            </v-window-item>

            <!-- TAB 2: IDENTITAS SISWA -->
            <v-window-item value="identity" class="h-100">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-1">Identitas Peserta Ujian</div>
              <div class="text-caption text-grey-darken-1 mb-3">
                Koreksi data tulisan tangan atau digital hasil pemindaian.
              </div>

              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="editableIdentity.nama_siswa"
                    label="Nama Lengkap Siswa"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-account"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.kelas"
                    label="Kelas"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-google-classroom"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.no_peserta"
                    label="No. Peserta"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-card-account-details-outline"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.nisn"
                    label="NISN (10 Digit)"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-numeric"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.npsn"
                    label="NPSN (8 Digit)"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-school"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.id_mapel"
                    label="ID Mapel"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-book-open-outline"
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="editableIdentity.kode_tes"
                    label="Kode Tes"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-barcode-scan"
                  ></v-text-field>
                </v-col>
                <v-col cols="12">
                  <v-text-field
                    v-model="editableIdentity.tanggal_ujian"
                    label="Tanggal Ujian / Pelaksanaan"
                    variant="outlined"
                    density="comfortable"
                    prepend-inner-icon="mdi-calendar"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-window-item>

            <!-- TAB 3: STATUS KALIBRASI ROI TEMPLAT -->
            <v-window-item value="calibration" class="h-100">
              <div class="text-subtitle-2 font-weight-bold text-grey-darken-3 mb-1">Status Kalibrasi ROI Vektor</div>
              <div class="text-caption text-grey-darken-1 mb-3">
                Koleksi sampel kalibrasi yang diverifikasi sempurna oleh pengguna untuk templat ini.
              </div>

              <v-card class="pa-3 rounded-lg border bg-blue-lighten-5 mb-3" elevation="0">
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-caption font-weight-bold text-blue-darken-3">Templat Aktif:</span>
                  <span class="text-caption font-weight-black text-blue-darken-4">{{ activeTemplate?.name || '-' }}</span>
                </div>
                <div class="d-flex align-center justify-space-between mb-2">
                  <span class="text-caption font-weight-bold text-blue-darken-3">Total Sampel Sempurna:</span>
                  <v-chip size="x-small" color="primary" class="font-weight-bold">
                    {{ calibrationStats.totalSamples }} Sampel
                  </v-chip>
                </div>
                <div class="d-flex align-center justify-space-between">
                  <span class="text-caption font-weight-bold text-blue-darken-3">Status Resultan ROI:</span>
                  <v-chip size="x-small" :color="calibrationStats.totalSamples > 0 ? 'success' : 'grey'" class="font-weight-bold">
                    {{ calibrationStats.totalSamples > 0 ? 'Resultan Presisi Aktif' : 'Baseline Standar' }}
                  </v-chip>
                </div>
              </v-card>

              <div class="pa-3 rounded-lg border bg-amber-lighten-5 border-amber">
                <div class="d-flex align-start gap-2">
                  <v-icon color="amber-darken-3" class="mt-1">mdi-lightbulb-on</v-icon>
                  <div>
                    <div class="text-caption font-weight-bold text-amber-darken-4">Bagaimana Cara Kalibrasi Bekerja?</div>
                    <div class="text-caption text-grey-darken-2 mt-1">
                      Saat Anda menekan tombol <strong>"Simpan & Jadikan Kalibrasi Sempurna"</strong>, sistem mencocokkan setiap jawaban yang telah Anda verifikasi dengan pusat bulatan fisik asli pada citra. Pergeseran sub-piksel dihitung dan digabungkan secara resultan (median) sehingga pemindaian berikutnya terhadap lembar sejenis menjadi jauh lebih presisi dan tahan terhadap pergeseran cetak.
                    </div>
                  </div>
                </div>
              </div>
            </v-window-item>
          </v-window>

          <!-- Footer Actions -->
          <div class="pa-3 border-t bg-grey-lighten-5 d-flex align-center justify-space-between flex-wrap gap-2 flex-shrink-0">
            <v-btn
              color="primary"
              variant="flat"
              rounded="pill"
              prepend-icon="mdi-content-save-check"
              class="font-weight-bold px-4 text-none"
              :loading="isSaving"
              @click="saveUpdatedAnswers(false)"
            >
              Perbarui Jawaban
            </v-btn>

            <v-btn
              color="amber-darken-3"
              variant="flat"
              rounded="pill"
              prepend-icon="mdi-star-check"
              class="font-weight-bold px-4 text-white text-none"
              :loading="isSaving"
              @click="saveUpdatedAnswers(true)"
            >
              ⭐ Simpan & Jadikan Kalibrasi
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useOmrStore } from '../store/omrStore';
import { db, type ScanResult, type OmrTemplate, type NormalizedBubbleROI } from '../db/database';
import {
  getTemplateRoisForScanning,
  calibrateVectorRoisFromScan,
  recordCalibrationSample,
  extractVectorRoisFromTemplate,
  saveBaselineRoi
} from '../utils/roiVectorService';

const route = useRoute();
const omrStore = useOmrStore();

// State Pemilihan Scan & Citra
const allScans = ref<ScanResult[]>([]);
const selectedScanKey = ref<string>('');
const activeScan = ref<ScanResult | null>(null);
const activeTemplate = ref<OmrTemplate | null>(null);
const activeVectorRois = ref<NormalizedBubbleROI[]>([]);

const imageUrl = ref<string>('');
const imageNaturalWidth = ref(1000);
const imageNaturalHeight = ref(1414);

// UI & Viewport State
const activeTab = ref('answers');
const viewLayer = ref<'overlay' | 'original' | 'all_rois'>('overlay');
const boundingColor = ref('#ef4444'); // Default merah menyala
const strokeWidth = ref(2.5);
const focusedQuestion = ref<number | null>(null);

const colorPresets = [
  { name: 'Merah Menyala', color: '#ef4444' },
  { name: 'Biru Elektrik', color: '#0284c7' },
  { name: 'Hijau Zamrud', color: '#10b981' },
  { name: 'Kuning Amber', color: '#f59e0b' },
  { name: 'Ungu Magenta', color: '#d946ef' }
];

// Zoom & Pan State
const zoomLevel = ref(1.0);
const panX = ref(0);
const panY = ref(0);
const isDragging = ref(false);
const startMouseX = ref(0);
const startMouseY = ref(0);
const viewportRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);

// Form State
const editableAnswers = ref<any[]>([]);
const editableIdentity = ref({
  nama_siswa: '',
  kelas: '',
  no_peserta: '',
  nisn: '',
  npsn: '',
  id_mapel: '',
  kode_tes: '',
  tanggal_ujian: ''
});
const isSaving = ref(false);
const calibrationStats = ref({ totalSamples: 0 });

// Items dropdown pilihan scan
const scanSelectItems = computed(() => {
  return allScans.value.map(s => {
    const key = `${s.npsn}_${s.id_mapel}_${s.kode_tes}_${s.nisn}`;
    const nameStr = s.nama_siswa ? `${s.nama_siswa} (${s.nisn})` : `NISN: ${s.nisn}`;
    const dateStr = s.scannedAt ? new Date(s.scannedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '';
    const calibTag = s.is_calibrated ? ' ⭐' : '';
    return {
      key,
      title: `${nameStr} - Mapel ${s.id_mapel}/${s.kode_tes} [${dateStr}]${calibTag}`,
      raw: s
    };
  });
});

// Perhitungan Bounding Overlay Dinamis (Reaktif Terhadap Input Jawaban Pengguna)
interface BoundingOverlayItem {
  x: number;
  y: number;
  r: number;
  size: number;
  isBox: boolean;
  label: string;
  optValue: string;
  nomor_soal?: number;
}

const activeBoundings = computed<BoundingOverlayItem[]>(() => {
  if (!activeVectorRois.value || activeVectorRois.value.length === 0) return [];
  if (imageNaturalWidth.value <= 0 || imageNaturalHeight.value <= 0) return [];

  const W = imageNaturalWidth.value;
  const H = imageNaturalHeight.value;
  const boundings: BoundingOverlayItem[] = [];

  // Helper pencari bubble secara presisi menghindari collision q1 dengan q10
  const findQuestionBubbleRoi = (qNum: number, optValue: string, subIdx?: number) => {
    return activeVectorRois.value.find(r => {
      if (r.value !== optValue) return false;
      if (subIdx !== undefined) {
        // e.g. "8_q16_sub0_opt0" atau "q16_sub0_opt0"
        const regex = new RegExp(`(^|_|q)${qNum}_sub${subIdx}_opt\\d+`);
        return regex.test(r.id);
      } else {
        // e.g. "6_q1_opt0" atau "q1_opt0"
        const regex = new RegExp(`(^|_|q)${qNum}_opt\\d+`);
        return regex.test(r.id);
      }
    });
  };

  // 1. Bounding Jawaban Soal
  editableAnswers.value.forEach(ans => {
    const qNum = ans.nomor_soal;
    const bType = ans.bentuk_soal;
    const jwb = ans.jawaban;

    if (bType === 'kompleks') {
      const selectedOpts = Array.isArray(jwb) ? jwb : [];
      selectedOpts.forEach(opt => {
        const vRoi = findQuestionBubbleRoi(qNum, opt);
        if (vRoi) {
          const px = vRoi.normX * W;
          const py = vRoi.normY * H;
          const pr = Math.max(6, vRoi.normR * W);
          boundings.push({
            x: px,
            y: py,
            r: pr,
            size: pr * 2.2,
            isBox: true,
            label: `${qNum}: ${opt}`,
            optValue: opt,
            nomor_soal: qNum
          });
        }
      });
    } else if (bType === 'bs3' || bType === 'yt3') {
      const arr = Array.isArray(jwb) ? jwb : [];
      arr.forEach((optVal, subIdx) => {
        if (!optVal || optVal === '-') return;
        const vRoi = findQuestionBubbleRoi(qNum, optVal, subIdx);
        if (vRoi) {
          const px = vRoi.normX * W;
          const py = vRoi.normY * H;
          const pr = Math.max(5, vRoi.normR * W);
          boundings.push({
            x: px,
            y: py,
            r: pr * 1.15,
            size: pr * 2.3,
            isBox: false,
            label: `${qNum}.${subIdx + 1}: ${optVal}`,
            optValue: optVal,
            nomor_soal: qNum
          });
        }
      });
    } else {
      // PG Biasa, BS, YT, Jodoh (Single Option)
      const optVal = typeof jwb === 'string' ? jwb : (Array.isArray(jwb) ? jwb[0] : '');
      if (optVal && optVal !== '-') {
        const vRoi = findQuestionBubbleRoi(qNum, optVal);
        if (vRoi) {
          const px = vRoi.normX * W;
          const py = vRoi.normY * H;
          const pr = Math.max(5, vRoi.normR * W);
          boundings.push({
            x: px,
            y: py,
            r: pr * 1.15,
            size: pr * 2.3,
            isBox: false,
            label: `${qNum}: ${optVal}`,
            optValue: optVal,
            nomor_soal: qNum
          });
        }
      }
    }
  });

  // 2. Bounding untuk Identitas Siswa (NISN, NPSN, ID Mapel, Kode Tes)
  // NPSN
  if (editableIdentity.value.npsn) {
    const digits = editableIdentity.value.npsn.split('');
    digits.forEach((d, colIdx) => {
      const c = colIdx + 1;
      const vRoi = activeVectorRois.value.find(
        r => r.blockType === 'identity_npsn' && r.id.includes(`col${c}_`) && r.value === d
      );
      if (vRoi) {
        const px = vRoi.normX * W;
        const py = vRoi.normY * H;
        const pr = Math.max(4, vRoi.normR * W);
        boundings.push({
          x: px,
          y: py,
          r: pr * 1.1,
          size: pr * 2.2,
          isBox: false,
          label: `NPSN: ${d}`,
          optValue: d
        });
      }
    });
  }

  // NISN
  if (editableIdentity.value.nisn) {
    const digits = editableIdentity.value.nisn.split('');
    digits.forEach((d, colIdx) => {
      const c = colIdx + 1;
      const vRoi = activeVectorRois.value.find(
        r => r.blockType === 'identity_nisn' && r.id.includes(`col${c}_`) && r.value === d
      );
      if (vRoi) {
        const px = vRoi.normX * W;
        const py = vRoi.normY * H;
        const pr = Math.max(4, vRoi.normR * W);
        boundings.push({
          x: px,
          y: py,
          r: pr * 1.1,
          size: pr * 2.2,
          isBox: false,
          label: `NISN: ${d}`,
          optValue: d
        });
      }
    });
  }

  // ID Mapel
  if (editableIdentity.value.id_mapel) {
    const digits = editableIdentity.value.id_mapel.split('');
    digits.forEach((d, colIdx) => {
      const c = colIdx + 1;
      const vRoi = activeVectorRois.value.find(
        r => r.blockType === 'identity_subject' && r.id.includes(`col${c}_`) && r.value === d
      );
      if (vRoi) {
        const px = vRoi.normX * W;
        const py = vRoi.normY * H;
        const pr = Math.max(4, vRoi.normR * W);
        boundings.push({
          x: px,
          y: py,
          r: pr * 1.1,
          size: pr * 2.2,
          isBox: false,
          label: `Mapel: ${d}`,
          optValue: d
        });
      }
    });
  }

  // Kode Tes
  if (editableIdentity.value.kode_tes) {
    const digits = editableIdentity.value.kode_tes.split('');
    digits.forEach((d, colIdx) => {
      const c = colIdx + 1;
      const vRoi = activeVectorRois.value.find(
        r => r.blockType === 'identity_test' && r.id.includes(`col${c}_`) && r.value === d
      );
      if (vRoi) {
        const px = vRoi.normX * W;
        const py = vRoi.normY * H;
        const pr = Math.max(4, vRoi.normR * W);
        boundings.push({
          x: px,
          y: py,
          r: pr * 1.1,
          size: pr * 2.2,
          isBox: false,
          label: `Tes: ${d}`,
          optValue: d
        });
      }
    });
  }

  return boundings;
});

// Helper Validasi Opsi Sesuai Templat
const getQuestionBlock = (nomorSoal: number) => {
  if (!activeTemplate.value?.blocks) return null;
  return activeTemplate.value.blocks.find(b => {
    if (b.direction === 'horizontal') {
      const start = b.startNum || 0;
      const count = b.rows || 1;
      return nomorSoal >= start && nomorSoal < start + count;
    }
    return false;
  });
};

const getQuestionAllowedOptions = (nomorSoal: number): string[] => {
  const block = getQuestionBlock(nomorSoal);
  if (block?.options && block.options.length > 0) {
    return block.options;
  }
  // Default fallback
  return ['A', 'B', 'C', 'D'];
};

const isAnswerEmpty = (ans: any) => {
  if (!ans || ans === '-') return true;
  if (Array.isArray(ans) && ans.length === 0) return true;
  return false;
};

const formatAnswerDisplay = (ans: any): string => {
  if (Array.isArray(ans)) {
    return ans.length > 0 ? ans.join(', ') : '-';
  }
  return ans || '-';
};

const formatQuestionType = (type?: string): string => {
  switch (type) {
    case 'kompleks': return 'PG Kompleks';
    case 'bs': return 'Benar/Salah';
    case 'bs3': return 'B/S 3 Baris';
    case 'yt': return 'Ya/Tidak';
    case 'yt3': return 'Y/T 3 Baris';
    case 'jodoh': return 'Menjodohkan';
    default: return 'PG Biasa';
  }
};

const getQuestionTypeBadgeColor = (type?: string): string => {
  switch (type) {
    case 'kompleks': return 'indigo';
    case 'bs3': return 'teal-darken-1';
    case 'yt3': return 'cyan-darken-2';
    case 'jodoh': return 'amber-darken-3';
    default: return 'primary';
  }
};

const isComplexOptionSelected = (currentAnswers: any, opt: string): boolean => {
  if (!Array.isArray(currentAnswers)) return false;
  return currentAnswers.includes(opt);
};

// =========================================================================
// INTERACTIVE ANSWER UPDATES & STRICT DYNAMIC VALIDATION
// =========================================================================

const setSingleAnswer = (index: number, val: string) => {
  const item = editableAnswers.value[index];
  if (!item) return;

  const allowed = getQuestionAllowedOptions(item.nomor_soal);
  if (val !== '-' && !allowed.includes(val)) {
    omrStore.showToast(
      `Input "${val}" tidak valid untuk soal No. ${item.nomor_soal}! Opsi yang tersedia: [${allowed.join(', ')}]`,
      'error'
    );
    return;
  }

  item.jawaban = val;
  focusedQuestion.value = item.nomor_soal;
  omrStore.showToast(`Jawaban No. ${item.nomor_soal} diubah menjadi "${val}". Bounding dipindahkan.`, 'info');
};

const toggleComplexAnswer = (index: number, opt: string) => {
  const item = editableAnswers.value[index];
  if (!item) return;

  const allowed = getQuestionAllowedOptions(item.nomor_soal);
  if (!allowed.includes(opt)) {
    omrStore.showToast(
      `Opsi "${opt}" tidak valid untuk PGK No. ${item.nomor_soal}! Opsi yang tersedia: [${allowed.join(', ')}]`,
      'error'
    );
    return;
  }

  let current: string[] = Array.isArray(item.jawaban) ? [...item.jawaban] : [];
  if (current.includes(opt)) {
    current = current.filter(o => o !== opt);
  } else {
    current.push(opt);
    // Urutkan opsi sesuai abjad
    current.sort();
  }

  item.jawaban = current;
  focusedQuestion.value = item.nomor_soal;
  const displayStr = current.length ? current.join(', ') : 'Kosong';
  omrStore.showToast(`Jawaban PGK No. ${item.nomor_soal}: [${displayStr}]`, 'info');
};

const setAnswerDirectly = (index: number, val: any) => {
  if (editableAnswers.value[index]) {
    editableAnswers.value[index].jawaban = val;
  }
};

const getTripleSubAnswer = (jawaban: any, subIdx: number): string => {
  if (Array.isArray(jawaban) && jawaban[subIdx]) {
    return jawaban[subIdx];
  }
  return '-';
};

const setTripleSubAnswer = (index: number, subIdx: number, val: string) => {
  const item = editableAnswers.value[index];
  if (!item) return;

  const current: string[] = Array.isArray(item.jawaban) ? [...item.jawaban] : ['-', '-', '-'];
  while (current.length < 3) current.push('-');
  current[subIdx] = val;
  item.jawaban = current;
  omrStore.showToast(`Sub-pernyataan ${subIdx + 1} No. ${item.nomor_soal} diubah menjadi "${val}"`, 'info');
};

// Validasi saat pengguna mengetik manual di text field
const onCustomTextInput = (index: number, rawText: string) => {
  const item = editableAnswers.value[index];
  if (!item) return;

  const trimmed = (rawText || '').trim();
  const allowed = getQuestionAllowedOptions(item.nomor_soal);

  if (item.bentuk_soal === 'kompleks') {
    if (!trimmed || trimmed === '-') {
      item.jawaban = [];
      return;
    }
    // Pecah berdasarkan koma atau spasi
    const tokens = trimmed.split(/[,\s]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
    const invalidTokens = tokens.filter(t => !allowed.includes(t));

    if (invalidTokens.length > 0) {
      omrStore.showToast(
        `Input "${invalidTokens.join(', ')}" tidak valid! Pilihan untuk No. ${item.nomor_soal} adalah: [${allowed.join(', ')}]`,
        'error'
      );
      return;
    }
    item.jawaban = Array.from(new Set(tokens)).sort();
    omrStore.showToast(`Jawaban PGK No. ${item.nomor_soal} disetel ke [${item.jawaban.join(', ')}]`, 'success');
  } else if (item.bentuk_soal === 'bs3' || item.bentuk_soal === 'yt3') {
    const tokens = trimmed.split(/[,\s]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
    if (tokens.length !== 3) {
      omrStore.showToast(`Format soal 3 baris harus persis 3 jawaban (contoh: B,S,B)`, 'error');
      return;
    }
    item.jawaban = tokens;
  } else {
    const upper = trimmed.toUpperCase();
    if (upper !== '-' && !allowed.includes(upper)) {
      omrStore.showToast(
        `Opsi "${upper}" tidak valid! Pilihan untuk No. ${item.nomor_soal} adalah: [${allowed.join(', ')}]`,
        'error'
      );
      return;
    }
    item.jawaban = upper;
    omrStore.showToast(`Jawaban No. ${item.nomor_soal} disetel ke "${upper}"`, 'success');
  }
};

// =========================================================================
// ZOOM & PAN HANDLING
// =========================================================================

const zoomIn = () => {
  zoomLevel.value = Math.min(3.5, zoomLevel.value + 0.25);
};

const zoomOut = () => {
  zoomLevel.value = Math.max(0.4, zoomLevel.value - 0.25);
};

const fitZoom = () => {
  zoomLevel.value = 1.0;
  panX.value = 0;
  panY.value = 0;
};

const onWheel = (e: WheelEvent) => {
  if (e.deltaY < 0) {
    zoomLevel.value = Math.min(3.5, zoomLevel.value + 0.15);
  } else {
    zoomLevel.value = Math.max(0.4, zoomLevel.value - 0.15);
  }
};

const startPan = (e: MouseEvent) => {
  isDragging.value = true;
  startMouseX.value = e.clientX - panX.value;
  startMouseY.value = e.clientY - panY.value;
};

const onPan = (e: MouseEvent) => {
  if (!isDragging.value) return;
  panX.value = e.clientX - startMouseX.value;
  panY.value = e.clientY - startMouseY.value;
};

const endPan = () => {
  isDragging.value = false;
};

const onImageLoaded = () => {
  if (imageRef.value) {
    imageNaturalWidth.value = imageRef.value.naturalWidth || 1000;
    imageNaturalHeight.value = imageRef.value.naturalHeight || 1414;
  }
};

// =========================================================================
// DATA LOADING & SYNCHRONIZATION
// =========================================================================

const loadData = async () => {
  try {
    await omrStore.loadTemplatesFromDB();
    allScans.value = await db.scanResults.reverse().sortBy('scannedAt');

    // Cek query param
    const qNpsn = route.query.npsn as string;
    const qMapel = route.query.id_mapel as string;
    const qKode = route.query.kode_tes as string;
    const qNisn = route.query.nisn as string;

    let targetScan: ScanResult | undefined;
    if (qNpsn && qMapel && qKode && qNisn) {
      targetScan = allScans.value.find(
        s => s.npsn === qNpsn && s.id_mapel === qMapel && s.kode_tes === qKode && s.nisn === qNisn
      );
    }

    if (!targetScan && allScans.value.length > 0) {
      targetScan = allScans.value[0];
    }

    if (targetScan) {
      const key = `${targetScan.npsn}_${targetScan.id_mapel}_${targetScan.kode_tes}_${targetScan.nisn}`;
      selectedScanKey.value = key;
      await applyScanData(targetScan);
    }
  } catch (err: any) {
    console.warn('[Kalibrasi] Gagal memuat data:', err);
  }
};

const onScanSelected = async (key: string) => {
  const target = allScans.value.find(s => `${s.npsn}_${s.id_mapel}_${s.kode_tes}_${s.nisn}` === key);
  if (target) {
    await applyScanData(target);
  }
};

const refreshTemplateRois = async (tpl: OmrTemplate) => {
  tpl.blocks.forEach(b => {
    if (!b.bubbles || b.bubbles.length === 0) {
      b.bubbles = omrStore.computeBlockBubbles ? omrStore.computeBlockBubbles(b) : [];
    }
  });

  const rois = await getTemplateRoisForScanning(tpl.id);
  let vectorList = rois.resultant?.vectorRois || rois.baseline?.vectorRois || [];
  if (!vectorList || vectorList.length === 0) {
    const extracted = extractVectorRoisFromTemplate(tpl);
    vectorList = extracted.vectorRois;
    if (vectorList.length > 0) {
      await saveBaselineRoi(tpl);
    }
  }
  activeVectorRois.value = vectorList;
  calibrationStats.value = { totalSamples: rois.totalSamples };
};

const applyScanData = async (scan: ScanResult) => {
  activeScan.value = scan;
  imageUrl.value = scan.image_url || '';

  editableIdentity.value = {
    nama_siswa: scan.nama_siswa || '',
    kelas: scan.kelas || '',
    no_peserta: scan.no_peserta || '',
    nisn: scan.nisn || '',
    npsn: scan.npsn || '',
    id_mapel: scan.id_mapel || '',
    kode_tes: scan.kode_tes || '',
    tanggal_ujian: scan.tanggal_ujian || ''
  };

  editableAnswers.value = JSON.parse(JSON.stringify(scan.answers || []));

  if (scan.image_url) {
    const tempImg = new Image();
    tempImg.onload = () => {
      imageNaturalWidth.value = tempImg.naturalWidth || 1000;
      imageNaturalHeight.value = tempImg.naturalHeight || 1414;
    };
    tempImg.src = scan.image_url;
  }

  // Muat templat terkait
  let tpl = omrStore.savedTemplates.find(t => t.id === scan.template_id);
  if (!tpl && omrStore.savedTemplates.length > 0) {
    tpl = omrStore.savedTemplates[0];
  }
  activeTemplate.value = tpl || null;

  if (tpl) {
    await refreshTemplateRois(tpl);
  }
};

const triggerUploadImage = () => {
  if (fileInputRef.value) {
    fileInputRef.value.click();
  }
};

const onImageUploaded = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    const reader = new FileReader();
    reader.onload = (re) => {
      const dataUrl = re.target?.result as string;
      imageUrl.value = dataUrl;
      const tempImg = new Image();
      tempImg.onload = () => {
        imageNaturalWidth.value = tempImg.naturalWidth || 1000;
        imageNaturalHeight.value = tempImg.naturalHeight || 1414;
      };
      tempImg.src = dataUrl;
      omrStore.showToast(`Citra "${file.name}" berhasil dimuat ke viewport kalibrasi!`, 'success');
    };
    reader.readAsDataURL(file);
  }
};

// =========================================================================
// ACTION: SIMPAN PEMBARUAN & PENETAPAN KALIBRASI SEMPURNA
// =========================================================================

const saveUpdatedAnswers = async (asPerfectCalibration: boolean) => {
  if (!activeScan.value) {
    omrStore.showToast('Tidak ada data pemindaian aktif yang dipilih', 'warning');
    return;
  }

  isSaving.value = true;
  try {
    const updatedRecord: ScanResult = {
      ...activeScan.value,
      nama_siswa: editableIdentity.value.nama_siswa,
      kelas: editableIdentity.value.kelas,
      no_peserta: editableIdentity.value.no_peserta,
      nisn: editableIdentity.value.nisn,
      npsn: editableIdentity.value.npsn,
      id_mapel: editableIdentity.value.id_mapel,
      kode_tes: editableIdentity.value.kode_tes,
      tanggal_ujian: editableIdentity.value.tanggal_ujian,
      answers: editableAnswers.value,
      is_calibrated: asPerfectCalibration ? true : activeScan.value.is_calibrated,
      image_url: imageUrl.value || activeScan.value.image_url
    };

    // Update scanResults table
    await db.scanResults.put(updatedRecord);
    activeScan.value = updatedRecord;

    // Jika ditetapkan sebagai Kalibrasi Sempurna:
    if (asPerfectCalibration && activeTemplate.value && imageUrl.value) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl.value;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || 1000;
      canvas.height = img.naturalHeight || 1414;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const baseline = await db.templateRois.get(`${activeTemplate.value.id}_baseline`);
        const baselineRois = baseline?.vectorRois || [];

        if (baselineRois.length > 0) {
          const calibratedRois = calibrateVectorRoisFromScan(baselineRois, canvas, {
            npsn: updatedRecord.npsn,
            nisn: updatedRecord.nisn,
            id_mapel: updatedRecord.id_mapel,
            kode_tes: updatedRecord.kode_tes,
            nama_siswa: updatedRecord.nama_siswa,
            answers: updatedRecord.answers
          });

          await recordCalibrationSample(activeTemplate.value.id, calibratedRois, {
            studentName: updatedRecord.nama_siswa || '',
            nisn: updatedRecord.nisn || '',
            imageWidth: canvas.width,
            imageHeight: canvas.height,
            isUserVerified: true,
            notes: `Diverifikasi sempurna via Laman Kalibrasi (${updatedRecord.nama_siswa ? updatedRecord.nama_siswa + ' - ' : ''}NISN: ${updatedRecord.nisn})`
          });

          await refreshTemplateRois(activeTemplate.value);
        }
      }

      omrStore.showToast(
        `⭐ Berhasil disimpan & ditetapkan sebagai Sampel Kalibrasi Sempurna! (Total Sampel: ${calibrationStats.value.totalSamples})`,
        'success'
      );
    } else {
      omrStore.showToast('Data pemindaian & koreksi jawaban berhasil diperbarui!', 'success');
    }

    // Refresh daftar scan
    allScans.value = await db.scanResults.reverse().sortBy('scannedAt');
  } catch (err: any) {
    console.error('[Kalibrasi] Gagal menyimpan perubahan:', err);
    omrStore.showToast(`Gagal menyimpan: ${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.cursor-grab {
  cursor: grab;
}
.cursor-grabbing {
  cursor: grabbing;
}
.user-select-none {
  user-select: none;
  -webkit-user-drag: none;
}
</style>
