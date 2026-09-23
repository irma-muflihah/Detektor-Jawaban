<template>
  <v-container fluid class="pa-4 h-100 d-flex flex-column bg-grey-lighten-4">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold text-grey-darken-3">Pemindai LJK</h2>
      </div>
      <v-btn color="primary" variant="tonal" prepend-icon="mdi-history" to="/results" rounded="pill">
        Riwayat Data
      </v-btn>
    </div>

    <!-- Main Content via Stepper -->
    <v-stepper v-model="step" class="elevation-0 bg-transparent flex-grow-1 d-flex flex-column overflow-hidden" hide-actions>
      <v-stepper-header class="elevation-0 bg-white rounded-xl mb-4 border flex-shrink-0">
        <v-stepper-item :complete="step > 1" title="Template" :value="1" editable></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item :complete="step > 2" title="Pindai" :value="2" :editable="step > 1"></v-stepper-item>
        <v-divider></v-divider>
        <v-stepper-item title="Status" :value="3" :editable="step > 2"></v-stepper-item>
      </v-stepper-header>

      <v-stepper-window class="flex-grow-1 pa-0 overflow-hidden d-flex flex-column" style="margin: 0;">
        <!-- STEP 1: Pilih Template -->
        <v-stepper-window-item :value="1" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 pa-4 d-flex flex-column overflow-hidden" elevation="0">
            <div class="d-flex align-center mb-4 flex-shrink-0">
              <v-text-field
                v-model="searchTemplate"
                prepend-inner-icon="mdi-magnify"
                placeholder="Cari template..."
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 320px;"
              ></v-text-field>
            </div>

            <div class="flex-grow-1 overflow-y-auto pr-2">
              <v-list class="bg-transparent pa-0" lines="two">
                <v-list-item
                  v-for="t in filteredTemplates"
                  :key="t.id"
                  @click="selectTemplate(t.id)"
                  :class="{'bg-blue-lighten-5': selectedTemplateId === t.id}"
                  class="mb-2 border rounded-lg transition-all"
                >
                  <template v-slot:prepend>
                    <v-icon :color="selectedTemplateId === t.id ? 'primary' : 'grey'">
                      {{ selectedTemplateId === t.id ? 'mdi-check-circle' : 'mdi-file-document-outline' }}
                    </v-icon>
                  </template>
                  <v-list-item-title class="font-weight-bold">{{ t.name }}</v-list-item-title>
                  <v-list-item-subtitle>{{ new Date(t.updatedAt).toLocaleDateString('id-ID') }}</v-list-item-subtitle>
                </v-list-item>
                
                <v-list-item v-if="filteredTemplates.length === 0" class="text-center pa-8">
                  <v-icon size="48" class="mb-2 opacity-50 text-grey">mdi-file-hidden</v-icon>
                  <div class="text-grey">Belum ada template.</div>
                </v-list-item>
              </v-list>
            </div>
            <div class="mt-4 pt-4 border-t d-flex justify-end flex-shrink-0">
              <v-btn color="primary" variant="flat" rounded="pill" :disabled="!selectedTemplateId" @click="step = 2" prepend-icon="mdi-arrow-right">
                Lanjut
              </v-btn>
            </div>
          </v-card>
          </div>
        </v-stepper-window-item>

        <!-- STEP 2: Mode Pemindaian -->
        <v-stepper-window-item :value="2" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 pa-4 d-flex flex-column overflow-hidden" elevation="0">
              <!-- AI Scanner Engine Selector Banner -->
              <div class="mb-3 pa-3 rounded-lg border d-flex flex-wrap align-center justify-space-between gap-3" :class="scanEngine === 'gemini' ? 'bg-blue-lighten-5 border-blue-lighten-3' : 'bg-grey-lighten-4 border-grey-lighten-2'">
                <div class="d-flex align-center gap-3">
                  <v-avatar :color="scanEngine === 'gemini' ? 'primary' : 'grey-darken-1'" size="36" class="text-white">
                    <v-icon size="20">{{ scanEngine === 'gemini' ? 'mdi-creation' : 'mdi-camera-metering-matrix' }}</v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-2 font-weight-bold d-flex align-center gap-2">
                      <span>Mesin Pemindaian:</span>
                      <v-chip size="x-small" :color="scanEngine === 'gemini' ? 'primary' : 'grey-darken-2'" class="font-weight-bold">
                        {{ scanEngine === 'gemini' ? '✨ Gemini AI Vision' : 'OpenCV Tradisional' }}
                      </v-chip>
                      <v-chip v-if="scanEngine === 'gemini'" size="x-small" color="success" variant="tonal" class="font-weight-bold">
                        Presisi Tinggi
                      </v-chip>
                    </div>
                    <div class="text-caption text-grey-darken-1">
                      {{ scanEngine === 'gemini'
                        ? 'Menganalisis bulatan LJK & identitas siswa dengan multimodal AI (tahan bayangan & kemiringan).'
                        : 'Algoritma ambang batas piksel lokal (memerlukan LJK tegak lurus dan pencahayaan rata).' }}
                    </div>
                  </div>
                </div>

                <div class="d-flex align-center flex-wrap gap-2">
                  <v-btn-toggle v-model="scanEngine" mandatory density="compact" color="primary" rounded="lg" class="border bg-white">
                    <v-btn value="gemini" class="text-none font-weight-bold" prepend-icon="mdi-creation">
                      Gemini AI
                    </v-btn>
                    <v-btn value="opencv" class="text-none" prepend-icon="mdi-camera-metering-matrix">
                      OpenCV
                    </v-btn>
                  </v-btn-toggle>

                  <!-- Badge Model Gemini Terpilih -->
                  <v-chip
                    v-if="scanEngine === 'gemini'"
                    size="small"
                    color="primary"
                    variant="tonal"
                    class="font-weight-bold cursor-pointer"
                    prepend-icon="mdi-brain"
                    title="Klik untuk memilih model lain atau mengatur API Key"
                    @click="showApiKeyDialog = true"
                  >
                    {{ activeModelLabel }}
                    <v-icon size="14" class="ml-1">mdi-chevron-down</v-icon>
                  </v-chip>

                  <v-btn
                    v-if="scanEngine === 'gemini'"
                    size="small"
                    color="primary"
                    variant="outlined"
                    class="text-none font-weight-bold rounded-lg"
                    prepend-icon="mdi-tune"
                    title="Konfigurasi Model & API Key Gemini"
                    @click="showApiKeyDialog = true"
                  >
                    Atur Model
                  </v-btn>

                  <v-switch
                    v-if="scanEngine === 'gemini'"
                    v-model="previewBeforeSave"
                    label="Tinjau Hasil AI"
                    color="primary"
                    density="compact"
                    hide-details
                    class="ml-2"
                  ></v-switch>
                </div>

                <!-- Kontrol Koleksi Kalibrasi ROI Presisi -->
                <div class="w-100 mt-2 pt-2 border-t d-flex align-center flex-wrap justify-space-between gap-2">
                  <div class="d-flex align-center gap-2 flex-wrap">
                    <v-chip
                      size="small"
                      :color="calibrationSampleCount > 0 ? 'secondary' : 'grey-darken-1'"
                      variant="flat"
                      class="font-weight-bold"
                      prepend-icon="mdi-target-account"
                    >
                      {{ calibrationSampleCount > 0 ? `Kalibrasi: ${calibrationSampleCount} Sampel Sempurna (Resultan Aktif)` : 'ROI Vektor Baseline' }}
                    </v-chip>

                    <span class="text-caption text-grey-darken-1 d-none d-sm-inline">
                      Hanya proses yang Anda anggap sempurna yang disimpan ke koleksi kalibrasi.
                    </span>
                  </div>

                  <div class="d-flex align-center gap-1">
                    <v-btn
                      size="small"
                      color="secondary"
                      variant="tonal"
                      rounded="pill"
                      prepend-icon="mdi-format-list-checks"
                      class="text-none font-weight-bold"
                      @click="showCalibrationCollectionDialog = true"
                    >
                      Koleksi Kalibrasi ({{ calibrationSampleCount }})
                    </v-btn>
                  </div>
                </div>
              </div>

              <!-- Horizontal Mode Selection (Kamera / Batch) -->
              <div class="d-flex align-center justify-space-between mb-4 flex-shrink-0">
                <v-btn-toggle v-model="scanMode" color="primary" mandatory class="rounded-lg border bg-grey-lighten-4" density="default">
                  <v-btn value="camera" class="px-6 text-none font-weight-bold" prepend-icon="mdi-camera" height="48">
                    Kamera
                  </v-btn>
                  <v-btn value="batch" class="px-6 text-none font-weight-bold" prepend-icon="mdi-folder-multiple-image" height="48">
                    File (Batch)
                  </v-btn>
                </v-btn-toggle>
                <v-btn variant="tonal" rounded="pill" @click="step = 1" prepend-icon="mdi-arrow-left">Kembali</v-btn>
              </div>

              <!-- Main Scan Area -->
              <div class="flex-grow-1 rounded-xl overflow-hidden d-flex flex-column border">
                <!-- CAMERA VIEW -->
                <div v-if="scanMode === 'camera'" class="flex-grow-1 position-relative bg-black d-flex align-center justify-center" :class="{ 'fullscreen-camera': cameraActive }">
                  <video ref="videoElement" class="w-100 h-100 object-fit-cover" playsinline autoplay muted></video>
                  
                  <div v-if="!cameraActive" class="position-absolute d-flex flex-column align-center">
                    <v-icon size="64" color="white" class="mb-4 opacity-50">mdi-camera-off</v-icon>
                    <v-btn color="primary" variant="flat" rounded="pill" @click="startCamera">
                      Aktifkan Kamera
                    </v-btn>
                  </div>

                  <div v-if="cameraActive" class="position-absolute top-0 left-0 w-100 h-100 pointer-events-none d-flex align-center justify-center">
                    <div class="scanner-guide border-success border-opacity-50"></div>
                  </div>

                  <div v-if="cameraActive" class="position-absolute bottom-0 left-0 w-100 pa-4 bg-black bg-opacity-50 d-flex justify-space-between align-center">
                    <v-btn color="white" variant="text" rounded="pill" prepend-icon="mdi-close" @click="stopCamera">
                      Tutup
                    </v-btn>
                    
                    <v-btn
                      :color="scanEngine === 'gemini' ? 'primary' : 'success'"
                      size="x-large"
                      variant="flat"
                      rounded="pill"
                      :prepend-icon="scanEngine === 'gemini' ? 'mdi-creation' : 'mdi-line-scan'"
                      class="px-8 font-weight-bold"
                      :loading="isScanning"
                      @click="captureAndScan"
                    >
                      {{ scanEngine === 'gemini' ? 'Pindai dengan Gemini AI' : 'Pindai OpenCV' }}
                    </v-btn>

                    <v-badge :content="sessionLogs.length" color="primary" :model-value="sessionLogs.length > 0">
                      <v-btn color="white" variant="tonal" rounded="pill" prepend-icon="mdi-format-list-bulleted" @click="goToStep3">
                        Status
                      </v-btn>
                    </v-badge>
                  </div>
                </div>

                <!-- BATCH VIEW -->
                <div v-else class="flex-grow-1 pa-6 d-flex flex-column bg-grey-lighten-4">
                  <div
                    class="border-dashed border-2 rounded-xl d-flex flex-column align-center justify-center bg-white transition-all flex-grow-1 mb-4"
                    :class="{ 'border-primary bg-blue-lighten-5': isDragging }"
                    @dragover.prevent="isDragging = true"
                    @dragleave.prevent="isDragging = false"
                    @drop.prevent="handleDrop"
                  >
                    <input type="file" ref="fileInput" class="d-none" multiple accept="image/*" @change="handleFileSelect">
                    <v-icon size="48" :color="isDragging ? 'primary' : 'grey'" class="mb-2">mdi-cloud-upload</v-icon>
                    <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-2 mb-1">Tarik & Lepas File LJK</h3>
                    <p class="text-caption text-grey-darken-1 mb-4">Mendukung format JPG, PNG, WEBP (bisa pilih sekaligus)</p>
                    <v-btn color="primary" variant="tonal" rounded="pill" @click="triggerFileInput" prepend-icon="mdi-image-plus">
                      Pilih File LJK
                    </v-btn>
                  </div>

                  <div class="bg-white rounded-xl border pa-4 d-flex align-center justify-space-between flex-shrink-0">
                    <div>
                      <span class="font-weight-bold text-subtitle-1">{{ batchFiles.length }}</span>
                      <span class="text-caption text-grey-darken-1 ml-1">File siap dipindai</span>
                    </div>
                    <div class="d-flex gap-2">
                      <v-btn color="error" variant="text" size="small" :disabled="batchFiles.length === 0" @click="batchFiles = []">Kosongkan</v-btn>
                      <v-btn
                        :color="scanEngine === 'gemini' ? 'primary' : 'success'"
                        variant="flat"
                        rounded="pill"
                        :prepend-icon="scanEngine === 'gemini' ? 'mdi-creation' : 'mdi-play'"
                        :loading="isScanning"
                        :disabled="batchFiles.length === 0"
                        @click="processBatchQueue"
                      >
                        {{ scanEngine === 'gemini' ? 'Proses dengan Gemini AI' : 'Proses dengan OpenCV' }}
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>
            </v-card>
          </div>
        </v-stepper-window-item>

        <!-- STEP 3: Status & Hasil -->
        <v-stepper-window-item :value="3" class="h-100 pa-0">
          <div class="d-flex flex-column h-100">
            <v-card class="rounded-xl border bg-white flex-grow-1 d-flex flex-column overflow-hidden" elevation="0">
            <div class="pa-4 border-b d-flex align-center justify-space-between bg-grey-lighten-4 flex-shrink-0">
              <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3">Log Sesi</h3>
              <div class="d-flex gap-2">
                <v-chip color="success" variant="flat" size="small" class="font-weight-bold">Berhasil: {{ successfulScans }}</v-chip>
                <v-chip color="error" variant="flat" size="small" class="font-weight-bold">Gagal: {{ failedScans }}</v-chip>
              </div>
            </div>
            
            <div class="flex-grow-1 overflow-auto">
              <v-table density="compact" fixed-header class="h-100">
                <thead>
                  <tr>
                    <th class="font-weight-bold" style="width: 60px;">Status</th>
                    <th class="font-weight-bold" style="width: 110px;">Metode</th>
                    <th class="font-weight-bold" style="width: 100px;">Waktu</th>
                    <th class="font-weight-bold" style="width: 250px;">Informasi</th>
                    <th class="font-weight-bold">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(log, i) in sessionLogs" :key="i">
                    <td class="text-center">
                      <v-icon size="small" :color="log.status === 'success' ? 'success' : 'error'">
                        {{ log.status === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                      </v-icon>
                    </td>
                    <td>
                      <v-chip size="x-small" :color="log.engine === 'gemini' ? 'primary' : 'grey-darken-1'" class="font-weight-bold" variant="tonal">
                        <v-icon start size="12" v-if="log.engine === 'gemini'">mdi-creation</v-icon>
                        {{ log.engine === 'gemini' ? 'Gemini AI' : 'OpenCV' }}
                      </v-chip>
                    </td>
                    <td class="text-caption text-grey-darken-1">{{ new Date(log.timestamp).toLocaleTimeString('id-ID') }}</td>
                    <td class="font-weight-medium text-truncate" style="max-width: 250px;" :title="log.info">{{ log.info }}</td>
                    <td :class="log.status === 'success' ? 'text-success' : 'text-error'">{{ log.message }}</td>
                  </tr>
                  <tr v-if="sessionLogs.length === 0">
                    <td colspan="5" class="text-center pa-8 text-grey">
                      <v-icon size="48" class="mb-2 opacity-50">mdi-clipboard-text-outline</v-icon>
                      <br>Belum ada proses pemindaian.
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </div>
            
            <div class="pa-4 border-t d-flex justify-end gap-2 bg-white flex-shrink-0">
              <v-btn variant="tonal" color="primary" rounded="pill" @click="step = 2" prepend-icon="mdi-backup-restore">Pindai Lagi</v-btn>
              <v-btn color="primary" variant="flat" rounded="pill" to="/results" prepend-icon="mdi-database-eye">Lihat Data</v-btn>
            </div>
          </v-card>
          </div>
        </v-stepper-window-item>
      </v-stepper-window>
    </v-stepper>

    <!-- Scanning Overlay -->
    <v-overlay :model-value="isScanning" class="align-center justify-center" persistent>
      <v-card class="pa-6 rounded-xl text-center" min-width="280" elevation="6">
        <v-progress-circular indeterminate color="primary" size="52" width="4" class="mb-4"></v-progress-circular>
        <h3 class="text-subtitle-1 font-weight-bold mb-1">{{ scanStatusMessage }}</h3>
        <p class="text-caption text-grey-darken-1">Mohon tunggu, proses ekstraksi data sedang berlangsung...</p>
      </v-card>
    </v-overlay>

    <!-- Dialog Tinjau & Verifikasi Hasil Gemini AI -->
    <v-dialog v-model="showAiPreviewDialog" max-width="720" persistent scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" density="comfortable" class="px-2">
          <v-icon class="mr-2" size="24">mdi-creation</v-icon>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            Verifikasi Hasil Pemindaian (Gemini AI Vision)
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" @click="cancelAiResult"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-4 bg-grey-lighten-5">
          <div v-if="pendingAiResult" class="d-flex flex-column gap-3">
            <!-- Header status & confidence -->
            <div class="pa-3 rounded-lg bg-white border d-flex flex-wrap align-center justify-space-between gap-2">
              <div class="d-flex align-center gap-2">
                <v-icon :color="getConfidenceColor(pendingAiResult.confidence_score)" size="28">
                  mdi-shield-check
                </v-icon>
                <div>
                  <div class="text-caption text-grey-darken-1">Tingkat Keyakinan AI</div>
                  <div class="text-subtitle-2 font-weight-bold" :class="getConfidenceTextColor(pendingAiResult.confidence_score)">
                    {{ Math.round((pendingAiResult.confidence_score || 0.95) * 100) }}% - {{ getConfidenceLabel(pendingAiResult.confidence_score) }}
                  </div>
                </div>
              </div>
              <div class="text-caption text-grey-darken-2 font-italic">
                "{{ pendingAiResult.scan_notes || 'Deteksi visual OMR berhasil' }}"
              </div>
            </div>

            <!-- Pratinjau Citra LJK Tegak Lurus (Hasil Koreksi Orientasi) -->
            <div v-if="pendingImageUrl" class="bg-white rounded-lg border pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-grey-darken-2 d-flex align-center gap-1">
                  <v-icon size="18" color="primary">mdi-crop-rotate</v-icon>
                  CITRA LJK TERSINKRONISASI (POTRET TEGAK)
                </span>
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                  Kop Judul di Atas
                </v-chip>
              </div>
              <div class="d-flex justify-center bg-grey-lighten-4 rounded pa-2 border border-dashed">
                <img
                  :src="pendingImageUrl"
                  alt="LJK Tegak Lurus"
                  style="max-height: 220px; max-width: 100%; object-fit: contain;"
                  class="rounded elevation-1"
                />
              </div>
            </div>

            <!-- Identity Grid (OCR Tulisan Tangan & OMR Digital) -->
            <div class="bg-white rounded-lg border pa-3">
              <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase">
                Profil Peserta (OCR Tulisan Tangan Esensial)
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="pendingAiResult.nama_siswa"
                    label="Nama Siswa (Tulisan Tangan)"
                    variant="outlined"
                    density="compact"
                    placeholder="Contoh: Kanza Aditya"
                    prepend-inner-icon="mdi-account-edit-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="pendingAiResult.kelas"
                    label="Kelas"
                    variant="outlined"
                    density="compact"
                    placeholder="Contoh: 8C"
                    prepend-inner-icon="mdi-google-classroom"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="6" sm="3">
                  <v-text-field
                    v-model="pendingAiResult.no_peserta"
                    label="No. Peserta"
                    variant="outlined"
                    density="compact"
                    placeholder="Contoh: 01-8C-14"
                    prepend-inner-icon="mdi-badge-account-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="pendingAiResult.tanggal_ujian"
                    label="Tanggal Pelaksanaan Tes"
                    variant="outlined"
                    density="compact"
                    placeholder="Contoh: 23 - September - 2026"
                    prepend-inner-icon="mdi-calendar-check"
                    hide-details
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-divider class="my-3"></v-divider>

              <div class="text-caption font-weight-bold text-grey-darken-2 mb-2 text-uppercase">
                Identitas Digital (OMR & Validasi Silang)
              </div>
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="pendingAiResult.nisn"
                    label="NISN (10 Digit)"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-card-account-details-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="pendingAiResult.npsn"
                    label="NPSN (8 Digit)"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-school-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="pendingAiResult.id_mapel"
                    label="ID Mapel (2 Digit)"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-book-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="pendingAiResult.kode_tes"
                    label="Kode Tes (2 Digit)"
                    variant="outlined"
                    density="compact"
                    prepend-inner-icon="mdi-clipboard-check-outline"
                    hide-details
                  ></v-text-field>
                </v-col>
              </v-row>
            </div>

            <!-- Answers Grid -->
            <div class="bg-white rounded-lg border pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption font-weight-bold text-grey-darken-2 text-uppercase">
                  Jawaban Terdeteksi ({{ pendingAiResult.answers?.length || 0 }} Butir Soal)
                </span>
                <span class="text-caption text-grey">Periksa ketepatan deteksi jawaban siswa</span>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; max-height: 280px; overflow-y: auto;">
                <div
                  v-for="(ans, idx) in pendingAiResult.answers"
                  :key="idx"
                  class="pa-2 rounded border d-flex align-center justify-space-between bg-grey-lighten-5"
                >
                  <div class="d-flex align-center gap-1">
                    <span class="text-caption font-weight-bold text-grey-darken-3">No. {{ ans.nomor_soal }}</span>
                    <span v-if="ans.bentuk_soal === 'kompleks'" class="text-caption text-indigo font-weight-bold" style="font-size: 10px;">[PGK]</span>
                    <span v-else-if="ans.bentuk_soal === 'bs3'" class="text-caption text-teal-darken-2 font-weight-bold" style="font-size: 10px;">[BS3]</span>
                    <span v-else-if="ans.bentuk_soal === 'yt3'" class="text-caption text-cyan-darken-2 font-weight-bold" style="font-size: 10px;">[YT3]</span>
                    <span v-else-if="ans.bentuk_soal === 'jodoh'" class="text-caption text-amber-darken-3 font-weight-bold" style="font-size: 10px;">[Jdh]</span>
                  </div>
                  <v-chip
                    size="small"
                    :color="ans.jawaban === '-' || (Array.isArray(ans.jawaban) && ans.jawaban.length === 0) ? 'grey-lighten-2' : 'primary'"
                    class="font-weight-black"
                  >
                    {{ Array.isArray(ans.jawaban) ? (ans.jawaban.length ? ans.jawaban.join(', ') : '-') : (ans.jawaban || '-') }}
                  </v-chip>
                </div>
              </div>
            </div>

            <!-- OPSI VALIDASI KALIBRASI SEMPURNA OLEH PENGGUNA -->
            <div class="bg-amber-lighten-5 rounded-lg border border-amber pa-3 d-flex align-center justify-space-between flex-wrap gap-2">
              <div class="d-flex align-center gap-2">
                <v-avatar color="amber-darken-3" size="32">
                  <v-icon color="white" size="20">mdi-star</v-icon>
                </v-avatar>
                <div>
                  <div class="text-caption font-weight-bold text-grey-darken-3">Validasi Hasil Sempurna (Koleksi Kalibrasi ROI)</div>
                  <div class="text-caption text-grey-darken-2">
                    Tandai lembar ini jika Anda menganggap hasilnya <strong>100% Sempurna & Akurat</strong> untuk disimpan ke koleksi kalibrasi ROI templat.
                  </div>
                </div>
              </div>
              <v-switch
                v-model="markAsPerfectCalibration"
                color="amber-darken-3"
                density="compact"
                hide-details
                label="Jadikan Kalibrasi"
              ></v-switch>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 bg-white border-t d-flex justify-space-between align-center flex-wrap gap-2">
          <v-btn variant="text" color="grey-darken-1" rounded="pill" @click="cancelAiResult" prepend-icon="mdi-close">
            Batal / Pindai Ulang
          </v-btn>
          <div class="d-flex gap-2">
            <v-btn
              color="primary"
              variant="tonal"
              rounded="pill"
              class="font-weight-bold"
              prepend-icon="mdi-content-save"
              @click="confirmAndSaveAiResult(false)"
            >
              Simpan Biasa
            </v-btn>
            <v-btn
              color="amber-darken-3"
              variant="flat"
              rounded="pill"
              class="px-5 font-weight-bold text-white"
              prepend-icon="mdi-star-check"
              @click="confirmAndSaveAiResult(true)"
            >
              Simpan & Jadikan Kalibrasi Sempurna
            </v-btn>
          </div>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog Pengaturan Gemini API Key -->
    <GeminiSettingsDialog v-model="showApiKeyDialog" @saved="refreshGeminiHealth" />

    <!-- Dialog Koleksi Sampel Kalibrasi ROI Sempurna -->
    <CalibrationCollectionDialog
      v-model="showCalibrationCollectionDialog"
      :template-id="selectedTemplateId"
      :template-name="selectedTemplate?.name"
      @updated="refreshCalibrationInfo"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useOmrStore } from '../store/omrStore';
import { db, type ScanResult, type NormalizedBubbleROI } from '../db/database';
import { scanWithGemini, checkGeminiHealth, type GeminiOmrResultData } from '../services/geminiScanner';
import { getStoredModel, GEMINI_MODEL_PRESETS, DEFAULT_GEMINI_MODEL } from '../services/geminiKeyService';
import {
  getTemplateRoisForScanning,
  saveBaselineRoi,
  calibrateVectorRoisFromScan,
  recordCalibrationSample
} from '../utils/roiVectorService';
import { recognizeEssentialHandwriting, terminateOcrWorker } from '../services/tesseractOcr';
import {
  rectifyAndOrientLjkSheet,
  normalizeSourceToUprightCanvas
} from '../utils/imageOrientationService';
import { extractOmrWithRelativeScoring, refineFiducialRegistration } from '../utils/omrExtractionService';
import GeminiSettingsDialog from '../components/GeminiSettingsDialog.vue';
import CalibrationCollectionDialog from '../components/CalibrationCollectionDialog.vue';

const omrStore = useOmrStore();

const step = ref(1);
const searchTemplate = ref('');
const selectedTemplateId = ref<string | null>(null);
const scanMode = ref<'camera' | 'batch'>('camera');
const cvReady = ref(false);

const isScanning = ref(false);
const scanStatusMessage = ref('Memproses...');
const scanEngine = ref<'gemini' | 'opencv'>('gemini');
const previewBeforeSave = ref(true);
const showAiPreviewDialog = ref(false);
const showApiKeyDialog = ref(false);
const showCalibrationCollectionDialog = ref(false);
const markAsPerfectCalibration = ref(false);
const pendingAiResult = ref<GeminiOmrResultData | null>(null);
const pendingImageUrl = ref<string>('');
const geminiStatus = ref<{ status: string; hasGeminiKey: boolean }>({ status: 'checking', hasGeminiKey: false });
const activeModel = ref<string>(getStoredModel());

// State Kalibrasi ROI Presisi Sempurna
const calibrationSampleCount = ref(0);
const isCalibrating = ref(false);

const refreshCalibrationInfo = async () => {
  if (!selectedTemplateId.value) {
    calibrationSampleCount.value = 0;
    return;
  }
  try {
    const rois = await getTemplateRoisForScanning(selectedTemplateId.value);
    calibrationSampleCount.value = rois.totalSamples;
  } catch (err) {
    console.warn('Gagal memuat status kalibrasi:', err);
  }
};

const activeModelLabel = computed(() => {
  const modelId = activeModel.value;
  const preset = GEMINI_MODEL_PRESETS.find(p => p.id === modelId);
  return preset ? preset.name : (modelId || DEFAULT_GEMINI_MODEL);
});

const refreshGeminiHealth = async () => {
  geminiStatus.value = await checkGeminiHealth();
  activeModel.value = getStoredModel();
};

// Session State
interface SessionLog {
  status: 'success' | 'error';
  engine?: 'gemini' | 'opencv';
  info: string;
  message: string;
  timestamp: number;
}
const sessionLogs = ref<SessionLog[]>([]);

const successfulScans = computed(() => sessionLogs.value.filter(l => l.status === 'success').length);
const failedScans = computed(() => sessionLogs.value.filter(l => l.status === 'error').length);

const getConfidenceColor = (score?: number) => {
  const s = score ?? 0.9;
  if (s >= 0.85) return 'success';
  if (s >= 0.70) return 'warning';
  return 'error';
};

const getConfidenceTextColor = (score?: number) => {
  const s = score ?? 0.9;
  if (s >= 0.85) return 'text-success';
  if (s >= 0.70) return 'text-warning';
  return 'text-error';
};

const getConfidenceLabel = (score?: number) => {
  const s = score ?? 0.9;
  if (s >= 0.90) return 'Sangat Tinggi (Akurat)';
  if (s >= 0.75) return 'Cukup Baik';
  return 'Perlu Ditinjau Manual';
};

// Camera Refs
const videoElement = ref<HTMLVideoElement | null>(null);
const cameraActive = ref(false);
let mediaStream: MediaStream | null = null;

// Batch Refs
const isDragging = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
  if (fileInput.value) {
    fileInput.value.click();
  }
};

interface BatchFile {
  file: File;
}
const batchFiles = ref<BatchFile[]>([]);

const filteredTemplates = computed(() => {
  if (!searchTemplate.value) return omrStore.savedTemplates;
  const s = searchTemplate.value.toLowerCase();
  return omrStore.savedTemplates.filter(t => t.name.toLowerCase().includes(s));
});

const selectedTemplate = computed(() => {
  return omrStore.savedTemplates.find(t => t.id === selectedTemplateId.value);
});

const selectTemplate = async (id: string) => {
  selectedTemplateId.value = id;
  await refreshCalibrationInfo();
  step.value = 2;
};

const goToStep3 = () => {
  stopCamera();
  step.value = 3;
};

onMounted(async () => {
  await omrStore.loadTemplatesFromDB();
  await refreshCalibrationInfo();

  // Check Gemini status
  checkGeminiHealth().then(status => {
    geminiStatus.value = status;
  });
  
  // Check OpenCV ready
  const checkCv = setInterval(() => {
    if ((window as any).cvLoaded && (window as any).cv) {
      cvReady.value = true;
      clearInterval(checkCv);
    }
  }, 500);
});

onUnmounted(() => {
  stopCamera();
  terminateOcrWorker();
});

watch(scanMode, (newVal) => {
  if (newVal !== 'camera') {
    stopCamera();
  }
});

watch(step, (newVal) => {
  if (newVal !== 2 || scanMode.value !== 'camera') {
    stopCamera();
  }
});

const startCamera = async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    omrStore.showToast('Browser tidak mendukung akses kamera', 'error');
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } 
    });
    if (videoElement.value) {
      videoElement.value.srcObject = mediaStream;
      cameraActive.value = true;
    }
  } catch (err: any) {
    omrStore.showToast('Gagal mengakses kamera: ' + err.message, 'error');
  }
};

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  if (videoElement.value) {
    videoElement.value.srcObject = null;
  }
  cameraActive.value = false;
};

const captureImageFromVideo = (): string => {
  if (!videoElement.value) throw new Error("Kamera tidak aktif");
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.value.videoWidth || 1280;
  canvas.height = videoElement.value.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error("Gagal menginisialisasi canvas");
  ctx.drawImage(videoElement.value, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
};

// Catatan: Fungsi rectifyLjkSheet telah ditingkatkan menjadi rectifyAndOrientLjkSheet
// pada modul imageOrientationService untuk deteksi orientasi landscape (90°, 270°) dan terbalik (180°).

// Evaluasi ekstraksi menggunakan set koordinat ROI vektor tertentu dengan Local Snapping & Relative Scoring
const evaluateExtractionWithVectorRoi = (
  threshMat: any,
  cv: any,
  vectorRois: NormalizedBubbleROI[],
  sheetW: number,
  sheetH: number,
  template: any
) => {
  return extractOmrWithRelativeScoring(threshMat, null, cv, vectorRois, sheetW, sheetH, template);
};

// Pemrosesan OMR Citra OpenCV + Homografi + Skala ROI Vektor + Multi-ROI Iteration + Tesseract OCR
const processOMRImage = async (imageSource: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | string): Promise<any> => {
  if (!cvReady.value) {
    throw new Error("OpenCV belum siap.");
  }

  const template = selectedTemplate.value;
  if (!template) {
    throw new Error("Template tidak ditemukan.");
  }

  const cv = (window as any).cv;
  let sourceEl: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement;

  if (typeof imageSource === 'string') {
    sourceEl = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Gagal membaca gambar untuk OpenCV"));
      img.src = imageSource;
    });
  } else {
    sourceEl = imageSource;
  }

  let rawCanvas = document.createElement('canvas');
  const naturalW = (sourceEl as any).naturalWidth || (sourceEl as any).videoWidth || (sourceEl as any).width || 1280;
  const naturalH = (sourceEl as any).naturalHeight || (sourceEl as any).videoHeight || (sourceEl as any).height || 720;
  rawCanvas.width = naturalW;
  rawCanvas.height = naturalH;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) throw new Error("Gagal menginisialisasi kanvas sumber");
  rawCtx.drawImage(sourceEl, 0, 0, naturalW, naturalH);

  let src = cv.imread(rawCanvas);
  let rectifiedMat: any = null;
  let gray = new cv.Mat();
  let thresh = new cv.Mat();

  try {
    // 1. Transformasi homografi + Koreksi orientasi otomatis ke Potret Tegak Lurus (1000x1414)
    const rectResult = rectifyAndOrientLjkSheet(src, cv, 1000, 1414);
    rectifiedMat = rectResult.rectifiedMat;
    const rectifiedCanvas = rectResult.canvas;
    pendingImageUrl.value = rectResult.dataUrl;

    // 2. Thresholding biner inversi untuk OMR dengan Gaussian blur peredam noise
    cv.cvtColor(rectifiedMat, gray, cv.COLOR_RGBA2GRAY, 0);
    let blurMat = new cv.Mat();
    cv.GaussianBlur(gray, blurMat, new cv.Size(3, 3), 0);
    cv.threshold(blurMat, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    blurMat.delete();

    // 2b. Penyelarasan Sub-Piksel Presisi Tinggi berbasis 4 Penanda Fiducial Sudut (50,50),(950,50),(50,1364),(950,1364)
    const fiducial = refineFiducialRegistration(thresh, cv, 1000, 1414);
    if (fiducial.isRegistered && fiducial.transformMatrix) {
      let fineRectified = new cv.Mat();
      cv.warpPerspective(
        rectifiedMat,
        fineRectified,
        fiducial.transformMatrix,
        new cv.Size(1000, 1414),
        cv.INTER_LINEAR,
        cv.BORDER_CONSTANT,
        new cv.Scalar(255, 255, 255, 255)
      );
      rectifiedMat.delete();
      rectifiedMat = fineRectified;

      // Render ulang ke kanvas pratinjau dan OCR
      cv.imshow(rectifiedCanvas, rectifiedMat);
      pendingImageUrl.value = rectifiedCanvas.toDataURL('image/jpeg', 0.94);

      // Sinkronkan threshold biner dengan citra yang telah terselaraskan sub-piksel
      gray.delete();
      thresh.delete();
      gray = new cv.Mat();
      thresh = new cv.Mat();
      cv.cvtColor(rectifiedMat, gray, cv.COLOR_RGBA2GRAY, 0);
      let blurFine = new cv.Mat();
      cv.GaussianBlur(gray, blurFine, new cv.Size(3, 3), 0);
      cv.threshold(blurFine, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
      blurFine.delete();
      fiducial.transformMatrix.delete();
    }

    // 3. Ambil koleksi ROI vektor dari Dexie (Resultan, Sampel Kalibrasi AI, Baseline)
    const roiPackage = await getTemplateRoisForScanning(template.id);
    const candidateRois: Array<{ name: string; vectorRois: NormalizedBubbleROI[] }> = [];

    if (roiPackage.resultant && roiPackage.resultant.vectorRois?.length > 0) {
      candidateRois.push({ name: 'Resultan Kalibrasi', vectorRois: roiPackage.resultant.vectorRois });
    }
    // Tambahkan sampel kalibrasi jika resultan kurang memuaskan
    roiPackage.samples.forEach((s, idx) => {
      if (s.vectorRois?.length > 0) {
        candidateRois.push({ name: `Sampel AI #${idx + 1}`, vectorRois: s.vectorRois });
      }
    });
    if (roiPackage.baseline && roiPackage.baseline.vectorRois?.length > 0) {
      candidateRois.push({ name: 'Baseline Desain', vectorRois: roiPackage.baseline.vectorRois });
    }

    if (candidateRois.length === 0) {
      try {
        const baselineRecord = await saveBaselineRoi(template);
        if (baselineRecord.vectorRois?.length > 0) {
          candidateRois.push({ name: 'Baseline Desain Otomatis', vectorRois: baselineRecord.vectorRois });
        }
      } catch (genErr) {
        console.warn('Gagal membangkitkan baseline ROI otomatis:', genErr);
      }
    }

    if (candidateRois.length === 0) {
      throw new Error("Data ROI vektor templat belum tersedia di basis data.");
    }

    // 4. Ekstraksi dengan strategi Multi-ROI: coba resultan terlebih dahulu, fallback ke sampel terbaik jika perlu
    let bestResult: any = null;
    let highestScore = -1;

    for (let i = 0; i < candidateRois.length; i++) {
      const candidate = candidateRois[i];
      const res = evaluateExtractionWithVectorRoi(thresh, cv, candidate.vectorRois, 1000, 1414, template);

      // Skor gabungan: bobot kontras pemisahan + validitas ID (NPSN/NISN) + jumlah butir terjawab
      const hasValidId = res.npsn.replace(/0/g, '').length >= 3 && res.nisn.replace(/0/g, '').length >= 3;
      const filledCount = res.detectedMarksCount || 0;
      const combinedScore = res.contrastScore * 2 + (hasValidId ? 0.5 : 0) + (filledCount / 30.0);

      if (combinedScore > highestScore) {
        highestScore = combinedScore;
        bestResult = { ...res, candidateName: candidate.name };
      }

      // Jika resultan pertama sudah memiliki kontras sangat baik (>0.60), ID valid, dan terdeteksi jawaban, hentikan iterasi
      if (i === 0 && res.contrastScore >= 0.60 && hasValidId && filledCount >= 10) {
        break;
      }
    }

    // Validasi sekunder: Jika skor kontras awal rendah atau ID kosong, uji kemungkinan lembar LJK terbalik 180°
    if (!bestResult || bestResult.contrastScore < 0.25 || (bestResult.npsn.replace(/0/g, '').length < 3 && bestResult.nisn.replace(/0/g, '').length < 3)) {
      let flippedThresh = new cv.Mat();
      cv.rotate(thresh, flippedThresh, cv.ROTATE_180);
      let bestFlippedResult: any = null;
      let highestFlippedScore = -1;

      for (let i = 0; i < candidateRois.length; i++) {
        const candidate = candidateRois[i];
        const res = evaluateExtractionWithVectorRoi(flippedThresh, cv, candidate.vectorRois, 1000, 1414, template);
        const hasValidId = res.npsn.replace(/0/g, '').length >= 3 && res.nisn.replace(/0/g, '').length >= 3;
        const filledCount = res.detectedMarksCount || 0;
        const combinedScore = res.contrastScore * 2 + (hasValidId ? 0.5 : 0) + (filledCount / 30.0);

        if (combinedScore > highestFlippedScore) {
          highestFlippedScore = combinedScore;
          bestFlippedResult = { ...res, candidateName: candidate.name };
        }
      }

      if (bestFlippedResult && highestFlippedScore > highestScore + 0.25) {
        let flippedMat = new cv.Mat();
        cv.rotate(rectifiedMat, flippedMat, cv.ROTATE_180);
        rectifiedMat.delete();
        rectifiedMat = flippedMat;
        cv.imshow(rectifiedCanvas, rectifiedMat);
        pendingImageUrl.value = rectifiedCanvas.toDataURL('image/jpeg', 0.92);
        thresh.delete();
        thresh = flippedThresh;
        bestResult = bestFlippedResult;
      } else {
        flippedThresh.delete();
      }
    }

    if (!bestResult || !bestResult.npsn || bestResult.npsn.replace(/0/g, '').length === 0) {
      throw new Error("Ekstraksi OpenCV gagal: Bulatan LJK tidak terdeteksi dengan jelas. Coba atur pencahayaan atau gunakan Gemini AI.");
    }

    // 5. Jalankan OCR Tesseract.js pada area tulisan tangan esensial (Nama, Kelas, No. Peserta, Tanggal Ujian)
    scanStatusMessage.value = 'Mengenali tulisan tangan esensial dengan Tesseract.js...';
    const ocrData = await recognizeEssentialHandwriting(
      rectifiedCanvas,
      roiPackage.resultant?.handwrittenFields || roiPackage.baseline?.handwrittenFields
    );

    const rotationInfo = rectResult.detectedRotation !== 0
      ? ` (Orientasi ${rectResult.detectedRotation}° diselaraskan)`
      : '';

    return {
      npsn: bestResult.npsn,
      id_mapel: bestResult.id_mapel,
      kode_tes: bestResult.kode_tes,
      nisn: bestResult.nisn,
      answers: bestResult.answers,
      nama_siswa: ocrData.nama_siswa || '',
      kelas: ocrData.kelas || '',
      no_peserta: ocrData.no_peserta || '',
      tanggal_ujian: ocrData.tanggal_ujian || '',
      confidence_score: Math.min(0.98, Math.max(0.65, bestResult.contrastScore)),
      scan_notes: `Ekstraksi OpenCV sukses via ${bestResult.candidateName}${rotationInfo} (Kontras: ${Math.round(bestResult.contrastScore * 100)}%).`,
      engine: 'opencv',
      image_url: pendingImageUrl.value || undefined
    };

  } finally {
    if (src && !src.isDeleted()) src.delete();
    if (rectifiedMat && !rectifiedMat.isDeleted()) rectifiedMat.delete();
    if (gray && !gray.isDeleted()) gray.delete();
    if (thresh && !thresh.isDeleted()) thresh.delete();
  }
};

// Fungsi perekaman sampel kalibrasi ROI HANYA saat pengguna mengonfirmasi proses/hasil sempurna
const calibrateAndSavePerfectSample = async (imageDataUrl: string, verifiedData: GeminiOmrResultData) => {
  if (!selectedTemplate.value) return;
  try {
    isCalibrating.value = true;
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imageDataUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 1000;
    canvas.height = img.naturalHeight || 1414;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const baseline = await db.templateRois.get(`${selectedTemplate.value.id}_baseline`);
    const baselineRois = baseline?.vectorRois || [];
    if (baselineRois.length > 0) {
      const calibratedRois = calibrateVectorRoisFromScan(baselineRois, canvas, verifiedData);
      await recordCalibrationSample(selectedTemplate.value.id, calibratedRois, {
        modelName: activeModelLabel.value,
        studentName: verifiedData.nama_siswa || '',
        nisn: verifiedData.nisn || '',
        imageWidth: canvas.width,
        imageHeight: canvas.height,
        isUserVerified: true,
        notes: `Diverifikasi sempurna oleh pengguna (${verifiedData.nama_siswa ? verifiedData.nama_siswa + ' - ' : ''}NISN: ${verifiedData.nisn || '-'})`
      });
      await refreshCalibrationInfo();
      omrStore.showToast(`Sampel kalibrasi sempurna berhasil ditambahkan ke koleksi ROI! (Total: ${calibrationSampleCount.value})`, 'success');
    }
  } catch (err: any) {
    console.warn('[Kalibrasi ROI] Gagal menyimpan sampel kalibrasi:', err);
    omrStore.showToast(`Gagal menyimpan kalibrasi ROI: ${err.message}`, 'error');
  } finally {
    isCalibrating.value = false;
  }
};

const saveScanResult = async (result: any) => {
  const scanData: ScanResult = {
    ...result,
    template_id: result.template_id || selectedTemplate.value?.id,
    image_url: result.image_url || pendingImageUrl.value || undefined,
    scannedAt: Date.now()
  };
  
  await db.scanResults.put(scanData);
};

const addSessionLog = (status: 'success'|'error', info: string, message: string, engine: 'gemini' | 'opencv' = 'gemini') => {
  sessionLogs.value.unshift({ status, info, message, engine, timestamp: Date.now() });
};

const captureAndScan = async () => {
  if (!videoElement.value) return;
  
  isScanning.value = true;
  scanStatusMessage.value = scanEngine.value === 'gemini'
    ? `Menganalisis LJK dengan ${activeModelLabel.value}...`
    : 'Memproses dengan OpenCV & Tesseract...';

  try {
    if (scanEngine.value === 'gemini') {
      let dataUrl: string;
      // Jika modul OpenCV aktif, selaraskan orientasi LJK menjadi potret tegak (judul di atas)
      if (cvReady.value && (window as any).cv) {
        try {
          scanStatusMessage.value = 'Menyelaraskan orientasi LJK ke potret tegak...';
          const norm = normalizeSourceToUprightCanvas(videoElement.value, (window as any).cv);
          dataUrl = norm.dataUrl;
          if (norm.detectedRotation !== 0) {
            console.info(`[Camera Capture] Orientasi diselaraskan (+${norm.detectedRotation}°)`);
          }
        } catch (normErr) {
          console.warn('Fallback ke tangkapan kamera standar:', normErr);
          dataUrl = captureImageFromVideo();
        }
      } else {
        dataUrl = captureImageFromVideo();
      }

      pendingImageUrl.value = dataUrl;
      scanStatusMessage.value = `Menganalisis LJK dengan ${activeModelLabel.value}...`;

      try {
        const res = await scanWithGemini(dataUrl, selectedTemplate.value, activeModel.value);
        if (!res.data) throw new Error(res.error || "Hasil pemindaian Gemini kosong.");

        if (previewBeforeSave.value) {
          pendingAiResult.value = res.data;
          markAsPerfectCalibration.value = false;
          showAiPreviewDialog.value = true;
        } else {
          await saveScanResult({
            ...res.data,
            engine: 'gemini'
          });
          // Catatan: Kalibrasi hanya disimpan jika pengguna memverifikasi dan menandai sempurna di pratinjau
          addSessionLog('success', `NISN: ${res.data.nisn}`, `Berhasil (${activeModelLabel.value})`, 'gemini');
          omrStore.showToast(`Berhasil dipindai (${activeModelLabel.value})! NISN: ${res.data.nisn}`, 'success');
        }
      } catch (geminiErr: any) {
        const errMsg = geminiErr.message || String(geminiErr);
        const isQuotaOrServerIssue = (
          errMsg.includes('429') ||
          errMsg.includes('503') ||
          errMsg.includes('kuota') ||
          errMsg.includes('quota') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('antrean')
        );

        if (isQuotaOrServerIssue && cvReady.value && (window as any).cv) {
          omrStore.showToast('Kuota Gemini penuh/antrean padat. Beralih ke OpenCV & Tesseract lokal...', 'warning');
          console.warn('[Pindai LJK] Fallback otomatis ke OpenCV karena isu kuota cloud:', errMsg);
          scanStatusMessage.value = 'Memproses dengan OpenCV & Tesseract (Fallback)...';
          const result = await processOMRImage(videoElement.value || dataUrl);
          await saveScanResult({
            ...result,
            engine: 'opencv',
            scan_notes: `${result.scan_notes || ''} (Dialihkan dari Gemini karena kuota cloud)`.trim()
          });
          addSessionLog('success', `NISN: ${result.nisn}`, 'Berhasil disimpan via Fallback OpenCV lokal', 'opencv');
          omrStore.showToast(`Berhasil dipindai via OpenCV! (NISN: ${result.nisn})`, 'success');
        } else {
          throw geminiErr;
        }
      }
    } else {
      const result = await processOMRImage(videoElement.value);
      await saveScanResult({
        ...result,
        engine: 'opencv'
      });
      addSessionLog('success', `NISN: ${result.nisn}`, 'Berhasil disimpan (OpenCV + Vektor ROI)', 'opencv');
      omrStore.showToast(`Berhasil dipindai! (NISN: ${result.nisn})`, 'success');
    }
  } catch (e: any) {
    addSessionLog('error', 'Tangkapan Kamera', e.message, scanEngine.value);
    omrStore.showToast(e.message, 'error');
  } finally {
    isScanning.value = false;
  }
};

const confirmAndSaveAiResult = async (forceCalibrate?: boolean) => {
  if (!pendingAiResult.value) return;
  const isPerfect = forceCalibrate !== undefined ? forceCalibrate : markAsPerfectCalibration.value;
  try {
    await saveScanResult({
      ...pendingAiResult.value,
      is_calibrated: isPerfect,
      engine: 'gemini'
    });

    if (isPerfect && pendingImageUrl.value) {
      await calibrateAndSavePerfectSample(pendingImageUrl.value, pendingAiResult.value);
    } else {
      omrStore.showToast(`Data NISN ${pendingAiResult.value.nisn || '-'} berhasil disimpan!`, 'success');
    }

    addSessionLog(
      'success',
      `NISN: ${pendingAiResult.value.nisn || '-'}`,
      `Berhasil disimpan (Gemini AI)${isPerfect ? ' [Sampel Kalibrasi Sempurna]' : ''}`,
      'gemini'
    );
    showAiPreviewDialog.value = false;
    pendingAiResult.value = null;
    pendingImageUrl.value = '';
    markAsPerfectCalibration.value = false;
  } catch (err: any) {
    omrStore.showToast(`Gagal menyimpan: ${err.message}`, 'error');
  }
};

const cancelAiResult = () => {
  showAiPreviewDialog.value = false;
  pendingAiResult.value = null;
  pendingImageUrl.value = '';
  markAsPerfectCalibration.value = false;
  omrStore.showToast('Pemindaian dibatalkan.', 'info');
};

// Batch Processing Logic
const handleDrop = (e: DragEvent) => {
  isDragging.value = false;
  if (!selectedTemplate.value) {
    omrStore.showToast('Pilih template terlebih dahulu', 'error');
    return;
  }
  if (e.dataTransfer && e.dataTransfer.files) {
    addFilesToQueue(Array.from(e.dataTransfer.files));
  }
};

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement;
  if (target.files) {
    addFilesToQueue(Array.from(target.files));
  }
  if (fileInput.value) fileInput.value.value = '';
};

const addFilesToQueue = (files: File[]) => {
  const imageFiles = files.filter(f => f.type.startsWith('image/'));
  imageFiles.forEach(file => {
    batchFiles.value.push({ file });
  });
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) resolve(e.target.result as string);
      else reject(new Error("Gagal membaca file gambar."));
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Format gambar tidak didukung."));
      if (e.target?.result) img.src = e.target.result as string;
    };
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.readAsDataURL(file);
  });
};

const processBatchQueue = async () => {
  if (batchFiles.value.length === 0) return;
  isScanning.value = true;
  
  for (let i = 0; i < batchFiles.value.length; i++) {
    const batchFile = batchFiles.value[i];
    scanStatusMessage.value = `Memproses berkas ${i + 1} dari ${batchFiles.value.length} (${scanEngine.value === 'gemini' ? 'Gemini AI' : 'OpenCV'})...`;

    try {
      if (scanEngine.value === 'gemini') {
        let dataUrl = await fileToDataUrl(batchFile.file);
        // Jika modul OpenCV aktif, selaraskan orientasi berkas gambar ke potret tegak (judul di atas)
        if (cvReady.value && (window as any).cv) {
          try {
            const img = await loadImageFromFile(batchFile.file);
            const norm = normalizeSourceToUprightCanvas(img, (window as any).cv);
            dataUrl = norm.dataUrl;
            if (norm.detectedRotation !== 0) {
              console.info(`[Batch File] Berkas ${batchFile.file.name} diputar ${norm.detectedRotation}° menjadi tegak lurus.`);
            }
          } catch (normErr) {
            console.warn('Fallback ke berkas asli:', normErr);
          }
        }
        pendingImageUrl.value = dataUrl;
        try {
          const res = await scanWithGemini(dataUrl, selectedTemplate.value, activeModel.value);
          if (!res.data) throw new Error(res.error || "Gagal memindai berkas.");
          await saveScanResult({
            ...res.data,
            engine: 'gemini'
          });
          // Catatan: Kalibrasi tidak otomatis ditambahkan pada pemrosesan batch
          addSessionLog('success', batchFile.file.name, `Berhasil (${activeModelLabel.value} - NISN: ${res.data.nisn})`, 'gemini');
        } catch (geminiErr: any) {
          const errMsg = geminiErr.message || String(geminiErr);
          const isQuotaOrServerIssue = (
            errMsg.includes('429') ||
            errMsg.includes('503') ||
            errMsg.includes('kuota') ||
            errMsg.includes('quota') ||
            errMsg.includes('RESOURCE_EXHAUSTED') ||
            errMsg.includes('antrean')
          );

          if (isQuotaOrServerIssue && cvReady.value && (window as any).cv) {
            console.warn(`[Batch File] Fallback berkas ${batchFile.file.name} ke OpenCV karena limit kuota cloud:`, errMsg);
            const img = await loadImageFromFile(batchFile.file);
            const result = await processOMRImage(img);
            await saveScanResult({
              ...result,
              engine: 'opencv',
              scan_notes: `${result.scan_notes || ''} (Dialihkan ke OpenCV karena batas kuota Gemini)`.trim()
            });
            addSessionLog('success', batchFile.file.name, `Berhasil via OpenCV lokal (NISN: ${result.nisn})`, 'opencv');
          } else {
            throw geminiErr;
          }
        }
      } else {
        const img = await loadImageFromFile(batchFile.file);
        const result = await processOMRImage(img);
        await saveScanResult({
          ...result,
          engine: 'opencv'
        });
        addSessionLog('success', batchFile.file.name, `Berhasil (NISN: ${result.nisn})`, 'opencv');
      }
    } catch (e: any) {
      addSessionLog('error', batchFile.file.name, e.message, scanEngine.value);
    }
  }
  
  batchFiles.value = [];
  isScanning.value = false;
  step.value = 3; // Auto navigate to step 3 when batch finishes
  omrStore.showToast('Proses batch selesai.', 'info');
};

</script>


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

.scanner-guide {
  width: 70%;
  height: 80%;
  border: 3px solid;
  border-radius: 16px;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  position: relative;
}

.scanner-guide::before,
.scanner-guide::after {
  content: '';
  position: absolute;
  background-color: rgba(76, 175, 80, 0.5);
}

.scanner-guide::before {
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  transform: translateY(-50%);
}

.scanner-guide::after {
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  transform: translateX(-50%);
}

.object-fit-cover {
  object-fit: cover;
}
</style>

