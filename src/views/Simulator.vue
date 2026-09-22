<template>
  <div class="pa-4 h-100 d-flex flex-column gap-4 overflow-y-auto">
    <div class="bg-white rounded-xl border pa-6 shadow-sm mx-auto" style="max-width: 900px; width: 100%;">
      <div class="d-flex align-center gap-3 mb-6">
        <v-avatar color="primary-lighten-5" size="48" class="border">
          <v-icon color="primary" size="28">mdi-printer-3d</v-icon>
        </v-avatar>
        <div>
          <h2 class="font-weight-bold text-h6 text-grey-darken-4" style="line-height: 1.2;">Simulator LJK</h2>
          <p class="text-caption text-grey-darken-1 mb-0">Hasilkan data uji sintetis otomatis untuk validasi pemindai AI.</p>
        </div>
      </div>
      
      <v-divider class="mb-6"></v-divider>

      <v-row dense class="mb-4">
        <v-col cols="12">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">Pilih Templat</label>
          <v-select
            v-model="selectedTemplateId"
            :items="omrStore.savedTemplates"
            item-title="name"
            item-value="id"
            placeholder="Pilih Templat LJK"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          >
            <template v-slot:no-data>
              <div class="pa-3 text-caption text-grey">Belum ada templat tersimpan.</div>
            </template>
          </v-select>
        </v-col>
      </v-row>
      
      <v-row dense class="mb-4">
        <v-col cols="12" sm="3" md="3">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">Jml LJK</label>
          <v-text-field
            v-model.number="config.count"
            placeholder="2-32"
            type="number"
            min="2"
            max="32"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="3" md="3">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">Kelas</label>
          <v-text-field
            v-model="config.className"
            placeholder="Contoh: 7A"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="3" md="3">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">ID Mapel</label>
          <v-text-field
            v-model="config.mapel"
            placeholder="Mapel"
            maxlength="2"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          ></v-text-field>
        </v-col>

        <v-col cols="12" sm="3" md="2">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">Kode Tes</label>
          <v-text-field
            v-model="config.tes"
            placeholder="Tes"
            maxlength="2"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          ></v-text-field>
        </v-col>
        
        <v-col cols="12" sm="12" md="3">
          <label class="text-caption font-weight-bold text-grey-darken-2 mb-1 d-block">Format Kertas</label>
          <v-select
            v-model="config.format"
            :items="[{title: 'A4/A5 (Tunggal)', value: 'A4'}, {title: 'F4 (2 Berdampingan)', value: 'F4'}]"
            variant="outlined"
            density="compact"
            hide-details
            class="bg-white"
          ></v-select>
        </v-col>
      </v-row>

      <div class="d-flex flex-wrap gap-3 align-center mb-2">
        <v-btn 
          color="primary" 
          class="text-none font-weight-bold rounded-lg" 
          prepend-icon="mdi-play-circle" 
          :disabled="!selectedTemplateId || isGenerating"
          :loading="isGenerating"
          @click="generateSimulation"
        >
          Mulai Simulasi & Unduh ZIP
        </v-btn>
        
        <v-btn 
          variant="tonal"
          color="grey-darken-3"
          class="text-none font-weight-bold rounded-lg"
          prepend-icon="mdi-refresh"
          :disabled="!selectedTemplateId || isGenerating"
          @click="shufflePreview"
        >
          Acak Lembar Uji
        </v-btn>

        <v-btn 
          v-if="!selectedTemplateId"
          color="secondary" 
          variant="tonal"
          class="text-none font-weight-bold rounded-lg" 
          to="/designer"
        >
          Buat Templat Baru
        </v-btn>
      </div>

      <!-- Progress bar saat simulasi berjalan -->
      <div v-if="isGenerating" class="mt-4 pa-4 rounded-lg bg-blue-lighten-5 border border-blue-lighten-3">
        <div class="d-flex justify-space-between align-center mb-2">
          <div class="d-flex align-center gap-2">
            <v-progress-circular indeterminate color="primary" size="20" width="2"></v-progress-circular>
            <span class="text-caption font-weight-bold text-grey-darken-3">{{ progressText }}</span>
          </div>
          <span class="text-caption font-weight-bold text-primary">{{ progressPercent }}%</span>
        </div>
        <v-progress-linear :model-value="progressPercent" color="primary" height="8" rounded striped></v-progress-linear>
      </div>
    </div>

    <!-- Live Preview Card -->
    <div v-if="selectedTemplate" class="bg-white rounded-xl border pa-6 shadow-sm mx-auto" style="max-width: 900px; width: 100%;">
      <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
        <div class="d-flex align-center gap-2">
          <v-icon color="primary">mdi-eye-outline</v-icon>
          <h3 class="text-subtitle-1 font-weight-bold text-grey-darken-3 mb-0">Pratinjau Lembar Simulasi</h3>
        </div>
        <div class="d-flex align-center gap-2">
          <v-btn-toggle v-model="previewMode" mandatory density="compact" variant="outlined" color="primary" class="rounded-lg">
            <v-btn value="student" class="text-none text-caption">Siswa</v-btn>
            <v-btn value="key" class="text-none text-caption">Kunci Jawaban</v-btn>
          </v-btn-toggle>
          <v-btn size="small" variant="text" icon="mdi-dice-5-outline" color="grey-darken-2" title="Acak Jawaban Siswa" @click="shufflePreview"></v-btn>
        </div>
      </div>

      <div class="border rounded-lg bg-grey-lighten-4 pa-4 d-flex justify-center overflow-x-auto">
        <div 
          class="bg-white rounded border shadow-sm" 
          style="max-width: 650px; width: 100%;"
          v-html="previewSvg"
        ></div>
      </div>
    </div>

    <!-- Hidden Container for SVG rendering -->
    <div style="position: fixed; top: -9999px; left: -9999px; visibility: hidden;" ref="svgContainer"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useOmrStore } from '../store/omrStore';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { OmrTemplate, TemplateBlock } from '../db/database';

const omrStore = useOmrStore();
const selectedTemplateId = ref<string>('');
const svgContainer = ref<HTMLElement | null>(null);
const isGenerating = ref(false);
const progressText = ref('Mempersiapkan data...');
const progressPercent = ref(0);
const previewMode = ref<'student' | 'key'>('student');
const previewSvg = ref<string>('');

const config = ref({
  count: 32,
  className: '7A',
  mapel: '01',
  tes: '01',
  format: 'A4',
});

const banyumasNames = [
  "Maya Sari",
  "Eko Maulana",
  "Kartika Wahyuni",
  "Siti Susanti",
  "Wulan Marlina",
  "Yuni Lestari",
  "Eka Sungkar",
  "Tegar Wijaya",
  "Naufal Kurniawan",
  "Sophia Latjuba",
  "Dewi Handayani",
  "Bunga Sastro",
  "Putri Lestari",
  "Lestari Sari",
  "Cinta Sari",
  "Titi DJ",
  "Ratih Ramadhani",
  "Junaedi",
  "Fitri Ayunda",
  "Jessica Gutawa",
  "Joko Nugraha",
  "Jessica Handayani",
  "Surya Akbar",
  "Andi Hakim",
  "Budi Maulana",
  "Eka Ramadhani",
  "Tiara Andriana",
  "Fauzi Nugraha",
  "Tiara Gutawa",
  "Naufal Susilo",
  "Aditya Pratama",
  "Bunga Handayani",
  "Hani Marlina",
  "Vina Gutawa",
  "Zaskia Ayunda",
  "Hendra Nugraha",
  "Tiara Marlina",
  "Miko Pratama",
  "Bambang Pamungkas",
  "Candra Susilo",
  "Lukman Setiawan",
  "Jessica Lestari",
  "Rina Wahyuni",
  "Hendra Susilo",
  "Eko Nugraha",
  "Eka Andriana",
  "Inul Daratista",
  "Fauzi Wijaya",
  "Dewi Sarasvati",
  "Ratih Andriana",
  "Irfan Kurniawan",
  "Cinta Sungkar",
  "Fadil Jaidi",
  "Indah Susanti",
  "Aditya Hakim",
  "Rizky Hakim",
  "Maya Susanti",
  "Chelsea Islan",
  "Siti Aminah",
  "Dewi Ayunda",
  "Olla Marlina",
  "Rian Hidayat",
  "Lutfi Agizal",
  "Fauzi Ramadhan",
  "Irfan Hidayat",
  "Irfan Nugraha",
  "Dewi Marlina",
  "Fauzi Setiawan",
  "Yuni Wahyuni",
  "Fuji An",
  "Tiara Sari",
  "Nadia Handayani",
  "Ayu Handayani",
  "Joko Setiawan",
  "Rina Ayunda",
  "Andi Pratama",
  "Kartika Islan",
  "Oki Prasetyo",
  "Olla Ayunda",
  "Maya Ayunda",
  "Deni Hakim",
  "Ayu Ting Ting",
  "Tegar Hidayat",
  "Anneth Delliecia",
  "Rizky Nugraha",
  "Dewi Ramadhani",
  "Nadia Marlina",
  "Andi Akbar",
  "Tiara Wahyuni",
  "Tiara Islan",
  "Tegar Akbar",
  "Putri Sari",
  "Ratih Gutawa",
  "Syahrini",
  "Rizky Maulana",
  "Ayu Celia",
  "Kartika Susanti",
  "Lestari Sastro",
  "Aditya Maulana",
  "Miko Akbar",
  "Kartika Handayani",
  "Eko Gunawan",
  "Rizky Setiawan",
  "Hani Lestari",
  "Agus Akbar",
  "Dewi Sartika",
  "Rian Nugraha",
  "Indah Islan",
  "Nadia Susanti",
  "Gilang Nugraha",
  "Yoga Gunawan",
  "Oki Setiawan",
  "Rina Andriana",
  "Sri Gutawa",
  "Asnawi Mangkualam",
  "Fauzi Gunawan",
  "Lestari Marlina",
  "Chico Jericho",
  "Melly Goeslaw",
  "Ratih Sari",
  "Tiara Sarasvati",
  "Indah Marlina",
  "Rina Gutawa",
  "Hendra Setiawan",
  "Lestari Andriana",
  "Sri Islan",
  "Kevin Nugraha",
  "Fauzi Hakim",
  "Indah Sastro",
  "Sri Handayani",
  "Reza Hidayat",
  "Miko Susilo",
  "Rizky Susilo",
  "Indah Ayunda",
  "Bunga Gutawa",
  "Titi Kamal",
  "Candra Santoso",
  "Putri Andriana",
  "Lestari Susanti",
  "Deni Akbar",
  "Surya Saputra",
  "Putra Hidayat",
  "Vina Islan",
  "Gilang Hidayat",
  "Eka Handayani",
  "Eko Wijaya",
  "Agus Hakim",
  "Rian Hakim",
  "Fajar Hakim",
  "Bunga Ayunda",
  "Reza Susilo",
  "Yuni Islan",
  "Ratih Sarasvati",
  "Aditya Saputra",
  "Jessica Sastro",
  "Brisia Jodie",
  "Zainal Abidin",
  "Surya Hidayat",
  "Eka Islan",
  "Vidi Aldiano",
  "Reza Prasetyo",
  "Eka Sari",
  "Yuni Sungkar",
  "Eko Hidayat",
  "Fajar Setiawan",
  "Aditya Kurniawan",
  "Candra Nugraha",
  "Agus Hidayat",
  "Tiara Ramadhani",
  "Jessica Susanti",
  "Oki Saputra",
  "Miko Wijaya",
  "Bunga Celia",
  "Candra Hidayat",
  "Jessica Iskandar",
  "Budi Santoso",
  "Fachrudin Aryanto",
  "Budi Ramadhan",
  "Oki Nugraha",
  "Putra Ramadhan",
  "Surya Kurniawan",
  "Gita Islan",
  "Ayu Gutawa",
  "Olla Lestari",
  "Yuni Celia",
  "Kevin Prasetyo",
  "Vicky Prasetyo",
  "Tito Karnavian",
  "Putra Wijaya",
  "Dewi Gutawa",
  "Gita Sungkar",
  "Vina Sarasvati",
  "Irfan Santoso",
  "Ayu Ayunda",
  "Candra Saputra",
  "Nella Kharisma",
  "Deni Setiawan",
  "Fitri Andriana",
  "Gita Susanti",
  "Hani Ayunda",
  "Wulan Handayani",
  "Yuni Sarasvati",
  "Kevin Maulana",
  "Yuni Gutawa",
  "Raffi Ahmad",
  "Lukman Nugraha",
  "Kartika Ramadhani",
  "Bunga Citra",
  "Andi Prasetyo",
  "Yoga Hidayat",
  "Tara Basro",
  "Aditya Ramadhan",
  "Bunga Susanti",
  "Tiara Susanti",
  "Nadia Sari",
  "Nadia Lestari",
  "Deni Maulana",
  "Dewi Lestari",
  "Cinta Ramadhani",
  "Eka Sastro",
  "Hendra Hakim",
  "Eka Ayunda",
  "Ayu Andriana",
  "Siti Handayani",
  "Putra Gunawan",
  "Hendra Saputra",
  "Maya Andriana",
  "Hani Susanti",
  "Kartika Marlina",
  "Andi Maulana",
  "Joko Akbar",
  "Putri Sungkar",
  "Tiara Sastro",
  "Sulis",
  "Lesti Kejora",
  "Maya Marlina",
  "Cinta Gutawa",
  "Hani Islan",
  "Hasan Sadikin",
  "Rina Islan",
  "Rian Akbar",
  "Nita Talia",
  "Reza Wijaya",
  "Deni Kurniawan",
  "Gita Sari",
  "Lestari Lestari",
  "Evan Dimas",
  "Eka Sarasvati",
  "Cinta Lestari",
  "Putri Ramadhani",
  "Maya Handayani",
  "Irfan Gunawan",
  "Wulan Gutawa",
  "Irfan Setiawan",
  "Ayu Marlina",
  "Putri Wahyuni",
  "Kevin Wijaya",
  "Ivan Gunawan",
  "Yoga Saputra",
  "Reza Pratama",
  "Ratih Celia",
  "Vina Ayunda",
  "Fitri Ramadhani",
  "Putra Saputra",
  "Tegar Gunawan",
  "Yoga Susilo",
  "Fauzi Santoso",
  "Andi Nugraha",
  "Ayu Sastro",
  "Vina Wahyuni",
  "Fajar Prasetyo",
  "Gilang Maulana",
  "Ratih Lestari",
  "Egi Melgiansyah",
  "Zaskia Susanti",
  "Nadeo Argawinata",
  "Siti Sastro",
  "Ratih Ayunda",
  "Bunga Andriana",
  "Budi Hidayat",
  "Deni Gunawan",
  "Keisya Levronka",
  "Rizky Kurniawan",
  "Vina Ramadhani",
  "Hendra Ramadhan",
  "Putra Santoso",
  "Lukman Prasetyo",
  "Maya Islan",
  "Wulan Wahyuni",
  "Budi Wijaya",
  "Sri Wahyuni",
  "Nico Ardian",
  "Oscar Hidayat",
  "Gita Sastro",
  "Raisa Andriana",
  "Lestari Handayani",
  "Putra Prasetyo",
  "Putri Susanti",
  "Tegar Ramadhan",
  "Putri Islan",
  "Wulan Andriana",
  "Ayu Sari",
  "Andritany Ardhiyasa",
  "Reza Maulana",
  "Zaskia Sari",
  "Deni Susilo",
  "Miko Saputra",
  "Rizky Gunawan",
  "Oki Wijaya",
  "Fitri Sarasvati",
  "Miko Setiawan",
  "Joko Saputra",
  "Gilang Akbar",
  "Zaskia Marlina",
  "Joko Kurniawan",
  "Deni Prasetyo",
  "Putra Nugraha",
  "Rizky Saputra",
  "Joko Ramadhan",
  "Siti Gutawa",
  "Zaskia Gotik",
  "Miko Prawira",
  "Fitri Islan",
  "Tegar Prasetyo",
  "Rina Handayani",
  "Agus Gunawan",
  "Kartika Andriana",
  "Yoga Prasetyo",
  "Aditya Hidayat",
  "Wulan Guritno",
  "Fajar Pratama",
  "Kartika Ayunda",
  "Joko Prasetyo",
  "Gilang Ramadhan",
  "Putra Setiawan",
  "Olla Susanti",
  "Budi Setiawan",
  "Lukman Kurniawan",
  "Zumi Zola",
  "Deni Nugraha",
  "Indah Gutawa",
  "Joko Maulana",
  "Marcelino Lefrandt",
  "Fitri Lestari",
  "Siti Celia",
  "Gilang Santoso",
  "Hendra Gunawan",
  "Bunga Sarasvati",
  "Candra Ramadhan",
  "Joko Wijaya",
  "Cinta Wahyuni",
  "Fajar Susilo",
  "Rina Sari",
  "Pevita Pearce",
  "Wulan Ayunda",
  "Tiara Handayani",
  "Gita Marlina",
  "Candra Akbar",
  "Oki Pratama",
  "Eva Celia",
  "Nadia Andriana",
  "Zaskia Islan",
  "Fitri Wahyuni",
  "Fitri Handayani",
  "Tegar Kurniawan",
  "Vina Sastro",
  "Dewi Perssik",
  "Gilang Pratama",
  "Miko Kurniawan",
  "Fajar Maulana",
  "Olla Ramlan",
  "Hendra Prasetyo",
  "Vina Handayani",
  "Gita Wahyuni",
  "Sri Susanti",
  "Maudy Ayunda",
  "Adhisty Zara",
  "Irfan Prasetyo",
  "Maya Wahyuni",
  "Irfan Ramadhan",
  "Nadia Sarasvati",
  "Fitri Sastro",
  "Siti Sarasvati",
  "Ahmad Fauzi",
  "Wulan Celia",
  "Yuni Andriana",
  "Irfan Saputra",
  "Siti Lestari",
  "Agus Ramadhan",
  "Rian Prasetyo",
  "Tegar Santoso",
  "Andi Setiawan",
  "Budi Kurniawan",
  "Surya Pratama",
  "Kartika Sastro",
  "Hani Handayani",
  "Siti Sungkar",
  "Maya Gutawa",
  "Olla Islan",
  "Agus Setiawan",
  "Yoga Maulana",
  "Naufal Santoso",
  "Ratih Susanti",
  "Ratih Sastro",
  "Tegar Setiawan",
  "Tiara Ayunda",
  "Olla Ramadhani",
  "Boaz Solossa",
  "Cinta Ayunda",
  "Deni Wijaya",
  "Fajar Ramadhan",
  "Eko Setiawan",
  "Wendi Cagur",
  "Nadia Wahyuni",
  "Yoga Setiawan",
  "Hani Sungkar",
  "Marc Klok",
  "Tegar Hakim",
  "Onadio Leonardo",
  "Qibil",
  "Andi Gunawan",
  "Vina Celia",
  "Eko Pratama",
  "Indah Wahyuni",
  "Siti Wahyuni",
  "Vina Lestari",
  "Budi Prasetyo",
  "Indah Lestari",
  "Gavin Kwan",
  "Nadin Amizah",
  "Wahyu Hidayat",
  "Rina Ramadhani",
  "Septian David",
  "Andi Ramadhan",
  "Putra Kurniawan",
  "Nadia Gutawa",
  "Aura Kasih",
  "Siti Badriah",
  "Marion Jola",
  "Rachel Vennya",
  "Indah Sungkar",
  "Miko Nugraha",
  "Indah Sarasvati",
  "Miko Santoso",
  "Xaverius",
  "Erwan Saputra",
  "Luna Maya",
  "Bayu Skak",
  "Kevin Sanjaya",
  "Agnez Mo",
  "Jessica Islan",
  "Pramoedya Ananta",
  "Oki Gunawan",
  "Kevin Ramadhan",
  "Tegar Susilo",
  "Awkarin",
  "Bunga Wahyuni",
  "Rizky Pratama",
  "Surya Hakim",
  "Kevin Setiawan",
  "Agus Nugraha",
  "Lukman Wijaya",
  "Sule",
  "Zaskia Sungkar",
  "Kevin Kurniawan",
  "Bunga Lestari",
  "Hani Wahyuni",
  "Hani Sastro",
  "Deni Pratama",
  "Rachmat Irianto",
  "Joko Hakim",
  "Wulan Ramadhani",
  "Hendra Maulana",
  "Bunga Ramadhani",
  "Yoga Kurniawan",
  "Gita Ramadhani",
  "Yuni Sari",
  "Fitriani",
  "Gilang Susilo",
  "Agus Kurniawan",
  "Vina Susanti",
  "Budi Nugraha",
  "Rian Wijaya",
  "Isyana Sarasvati",
  "Cinta Susanti",
  "Agus Wijaya",
  "Oki Akbar",
  "Candra Setiawan",
  "Indah Andriana",
  "Siti Ayunda",
  "Oki Ramadhan",
  "Indah Sari",
  "Aditya Susilo",
  "Ayu Susanti",
  "Gilang Saputra",
  "Miko Hidayat",
  "Wulan Lestari",
  "Anya Geraldine",
  "Vina Marlina",
  "Rian Kurniawan",
  "Lukman Pratama",
  "Candra Prasetyo",
  "Agus Prasetyo",
  "Rina Celia",
  "Jessica Sungkar",
  "Tiara Sungkar",
  "Julius Caesar",
  "Fajar Nugraha",
  "Dewi Andriana",
  "Budi Susilo",
  "Cinta Celia",
  "Zaskia Wahyuni",
  "Kevin Santoso",
  "Indah Celia",
  "Putri Marlina",
  "Wulan Sastro",
  "Surya Gunawan",
  "Yuni Susanti",
  "Naufal Prasetyo",
  "Tegar Pratama",
  "Kartika Sari",
  "Irfan Hakim",
  "Aditya Wijaya",
  "Ayu Sarasvati",
  "Rizky Aditya",
  "Ratih Wahyuni",
  "Bunga Sari",
  "Lyodra Ginting",
  "Naufal Setiawan",
  "Ayu Islan",
  "Yoga Hakim",
  "Rian Susilo",
  "Yuni Sastro",
  "Umar Faruq",
  "Surya Wijaya",
  "Tegar Saputra",
  "Oki Kurniawan",
  "Dewi Wahyuni",
  "Nadia Ramadhani",
  "Jessica Sari",
  "Olla Wahyuni",
  "Lestari Ramadhani",
  "Olla Sari",
  "Syahrian Abimanyu",
  "Andi Kurniawan",
  "Wulan Sarasvati",
  "Fauzi Hidayat",
  "Reza Gunawan",
  "Rian Gunawan",
  "Makan Konate",
  "Tiara Celia",
  "Miko Maulana",
  "Gita Gutawa",
  "Nadia Sastro",
  "Yoga Wijaya",
  "Deni Hidayat",
  "Lukman Hakim",
  "Naufal Akbar",
  "Rian Maulana",
  "Eka Lestari",
  "Lestari Sarasvati",
  "Reza Kurniawan",
  "Ruth Sahanaya",
  "Rizky Prasetyo",
  "Eka Marlina",
  "Gading Marten",
  "Miko Gunawan",
  "Surya Ramadhan",
  "Siti Ramadhani",
  "Eka Susanti",
  "Bima Sakti",
  "Cristian Gonzales",
  "Via Vallen",
  "Uus",
  "Gilang Wijaya",
  "Rizky Santoso",
  "Eko Prasetyo",
  "Ilham Akbar",
  "Aditya Prasetyo",
  "Andi Hidayat",
  "Indra Sjafri",
  "Ayu Wahyuni",
  "Dewi Islan",
  "Ferry Irawan",
  "Ratih Purwasih",
  "Rina Sungkar",
  "Eko Akbar",
  "Eka Wahyuni",
  "Krisdayanti",
  "Fajar Saputra",
  "Irfan Wijaya",
  "Oki Maulana",
  "Yayan Ruhian",
  "Rizky Hidayat",
  "Olla Sungkar",
  "Lestari Islan",
  "Jessica Marlina",
  "Fitri Marlina",
  "Haryanto",
  "Rizky Akbar",
  "Maya Ramadhani",
  "Kevin Susilo",
  "Sri Lestari",
  "Sri Marlina",
  "Irfan Susilo",
  "Eko Santoso",
  "Jessica Celia",
  "Joko Gunawan",
  "Budi Akbar",
  "Reza Rahadian",
  "Jessica Andriana",
  "Olla Celia",
  "Maya Sarasvati",
  "Siti Sari",
  "Yuni Shara",
  "Surya Nugraha",
  "Jessica Ayunda",
  "Putri Celia",
  "Miko Hakim",
  "Aditya Setiawan",
  "Eko Hakim",
  "Fajar Rahman",
  "Putra Hakim",
  "Vina Sungkar",
  "Miko Ramadhan",
  "Panji Pragiwaksono",
  "Budi Hakim",
  "Deni Ramadhan",
  "Reza Santoso",
  "Fajar Akbar",
  "Lestari Gutawa",
  "Danilla Riyadi",
  "Rina Susanti",
  "Agus Maulana",
  "Fajar Hidayat",
  "Putra Susilo",
  "Tukul Arwana",
  "Fajar Gunawan",
  "Leo Saputra",
  "Hendra Pratama",
  "Dewi Celia",
  "Egy Maulana",
  "Rian Santoso",
  "Yoga Nugraha",
  "Andi Santoso",
  "Sri Sungkar",
  "Wulan Sungkar",
  "Candra Kurniawan",
  "Dewi Sastro",
  "Agus Susilo",
  "Indah Ramadhani",
  "Eko Ramadhan",
  "Rina Lestari",
  "Nadia Islan",
  "Tegar Maulana",
  "Andi Susilo",
  "Aditya Nugraha",
  "Hani Ramadhani",
  "Siti Islan",
  "Lestari Ayunda",
  "Agus Saputra",
  "Wulan Susanti",
  "Putra Maulana",
  "Eko Susilo",
  "Reza Saputra",
  "Hendra Akbar",
  "Naufal Nugraha",
  "Cinta Sarasvati",
  "Gilang Kurniawan",
  "Fauzi Saputra",
  "Candra Gunawan",
  "Ayu Ramadhani",
  "Gita Ayunda",
  "Dimas Anggara",
  "Budi Saputra",
  "Kartika Celia",
  "Naufal Gunawan",
  "Putri Gutawa",
  "Gita Sarasvati",
  "Saddil Ramdani",
  "Surya Maulana",
  "Sri Andriana",
  "Cinta Andriana",
  "Lukman Maulana",
  "Sri Ramadhani",
  "Agus Santoso",
  "Lina Marlina",
  "Hani Celia",
  "Kevin Hidayat",
  "Gita Andriana",
  "Nabil Husein",
  "Putri Sastro",
  "Reza Akbar",
  "Lestari Wahyuni",
  "Rina Sarasvati",
  "Kiki Saputra",
  "Lestari Celia",
  "Kevin Saputra",
  "Fauzi Maulana",
  "Zaskia Gutawa",
  "Zacky Mirza",
  "Joko Susilo",
  "Hani Sarasvati",
  "Ziva Magnolya",
  "Fajar Santoso",
  "Kevin Akbar",
  "Ricky Fajrin",
  "Zaskia Sastro",
  "Lukman Saputra",
  "Naufal Saputra",
  "Jessica Wahyuni",
  "Kartika Sarasvati",
  "Gilang Gunawan",
  "Surya Setiawan",
  "Tegar Nugraha",
  "Fitri Susanti",
  "Candra Wijaya",
  "Deni Santoso",
  "Fitri Sari",
  "Fitri Gutawa",
  "Sri Sari",
  "Rina Marlina",
  "Muhammad Irfan",
  "Gita Handayani",
  "Hendra Wijaya",
  "Eko Kurniawan",
  "Zaskia Andriana",
  "Lukman Hidayat",
  "Hani Sari",
  "Bunga Islan",
  "Kartika Sungkar",
  "Rosa",
  "Eko Saputra",
  "Vina Andriana",
  "Ratih Handayani",
  "Zara Leola",
  "Dian Sastro",
  "Lukman Akbar",
  "Yura Yunita",
  "Yusuf Maulana",
  "Aditya Akbar",
  "Candra Pratama",
  "Naufal Hakim",
  "Agus Pratama",
  "Naufal Pratama",
  "Olla Sastro",
  "Candra Hakim",
  "Nia Ramadhani",
  "Sri Celia",
  "Naufal Maulana",
  "Rina Sastro",
  "Aditya Gunawan",
  "Ratih Sungkar",
  "Naufal Ramadhan",
  "Zaskia Ramadhani",
  "Sri Ayunda",
  "Sri Sastro",
  "Oki Hidayat",
  "Reza Setiawan",
  "Hani Gutawa",
  "Eka Gutawa",
  "Hendra Santoso",
  "Lukman Susilo",
  "Vina Panduwinata",
  "Andi Wijaya",
  "Yuni Ramadhani",
  "Irfan Akbar",
  "Putri Ayunda",
  "Oki Santoso",
  "Jessica Ramadhani",
  "Reza Nugraha",
  "Andi Saputra",
  "Willy Kurniawan",
  "Fauzi Pratama",
  "Tiara Andini",
  "Lukman Santoso",
  "Yoga Akbar",
  "Fauzi Kurniawan",
  "Putra Akbar",
  "Siti Andriana",
  "Joko Hidayat",
  "Amanda Manopo",
  "Olla Andriana",
  "Olla Gutawa",
  "Rian Saputra",
  "Gita Celia",
  "Aditya Santoso",
  "Gilang Setiawan",
  "Maya Lestari",
  "Bunga Sungkar",
  "Hani Andriana",
  "Budi Pratama",
  "Cinta Islan",
  "Maya Sungkar",
  "Dewi Sari",
  "Fajar Wijaya",
  "Reza Ramadhan",
  "Nissa Sabyan",
  "Irfan Bachdim",
  "Joko Santoso",
  "Zaskia Handayani",
  "Yuni Marlina",
  "Yoga Pratama",
  "Sri Sarasvati",
  "Fitri Celia",
  "Gilang Hakim",
  "Ucok Baba",
  "Cinta Laura",
  "Elkan Baggott",
  "Fauzi Susilo",
  "Siti Marlina",
  "Zaskia Sarasvati",
  "Rizky Wijaya",
  "Eka Celia",
  "Rian Setiawan",
  "Surya Prasetyo",
  "Kevin Gunawan",
  "Witan Sulaeman",
  "Deni Saputra",
  "Prilly Latuconsina",
  "Dewi Susanti",
  "Jessica Sarasvati",
  "Bunga Marlina",
  "Yuni Ayunda",
  "Rian Ramadhan",
  "Hendra Kurniawan",
  "Kartika Lestari",
  "Joko Pratama",
  "Maya Sastro",
  "Hendra Hidayat",
  "Nadia Ayunda",
  "Reza Hakim",
  "Kevin Pratama",
  "Tiara Lestari",
  "Cinta Marlina",
  "Lestari Sungkar",
  "Vina Sari",
  "Fauzi Prasetyo",
  "Ryuji Utomo",
  "Lukman Ramadhan",
  "Tuti Handayani",
  "Olla Sarasvati",
  "Anggun C Sasmi",
  "Oki Susilo",
  "Cita Citata",
  "Gilang Prasetyo",
  "Rian Pratama",
  "Yoga Ramadhan",
  "Ratih Marlina",
  "Putri Handayani",
  "Irfan Maulana",
  "Olla Handayani",
  "Indah Handayani",
  "Kevin Hakim",
  "Lukman Gunawan",
  "Yuni Handayani",
  "Naufal Wijaya",
  "Miko Prasetyo",
  "Irfan Pratama",
  "Kartika Gutawa",
  "Putra Pratama",
  "Rizky Ridho",
  "Nadia Sungkar",
  "Budi Gunawan",
  "Putri Sarasvati",
  "Ayu Sungkar",
  "Maya Celia",
  "Zaskia Celia",
  "Susi Susanti",
  "Dewi Sungkar",
  "Stefano Lilipaly",
  "Candra Maulana",
  "Fadly Faisal",
  "Surya Susilo",
  "Wulan Islan",
  "Ratih Islan",
  "Syahrul Gunawan",
  "Mahalini",
  "Cinta Sastro",
  "Ayu Lestari",
  "Fitri Sungkar",
  "Nadia Celia",
  "Kaesang Pangarep",
  "Naufal Rizqi",
  "Fajar Kurniawan",
  "Gita Lestari",
  "Wulan Sari",
  "Surya Santoso",
  "Oki Hakim",
  "Yoga Santoso",
  "Fauzi Akbar",
  "Pratama Arhan",
  "Mikha Tambayong",
  "Rizky Ramadhan",
  "Opick",
  "Mutia Ayu",
  "Zaskia Lestari",
  "Naufal Hidayat",
  "Cinta Handayani"
];

const selectedTemplate = computed(() => {
  if (selectedTemplateId.value) {
    const found = omrStore.savedTemplates.find(t => t.id === selectedTemplateId.value);
    if (found) return found;
    if (omrStore.activeTemplate?.id === selectedTemplateId.value) return omrStore.activeTemplate;
  }
  return omrStore.savedTemplates[0] || omrStore.activeTemplate;
});

const escapeXml = (unsafe: any): string => {
  if (unsafe === null || unsafe === undefined) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const renderCustomTextSvg = (block: any): string => {
  const w = block.cols || 150;
  const h = block.rows || 100;
  const rawText = block.prefillValue || 'Teks kosong';
  
  // Word wrapping inside SVG without using foreignObject (prevents canvas tainting)
  const maxCharsPerLine = Math.max(10, Math.floor((w - 24) / 7.2));
  const paragraphs = String(rawText).split('\n');
  const lines: string[] = [];
  
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }

  const maxLines = Math.max(1, Math.floor((h - 20) / 16));
  const displayLines = lines.slice(0, maxLines);
  
  const tspans = displayLines.map((line, idx) => 
    `<tspan x="12" y="${22 + idx * 16}">${escapeXml(line)}</tspan>`
  ).join('');

  return `
    <rect width="${w}" height="${h}" fill="none" stroke="#475569" stroke-width="2" />
    <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
    <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">${escapeXml(block.title)}</text>
    <text font-size="12" font-family="Inter, sans-serif" fill="#0f172a">
      ${tspans}
    </text>
  `;
};

const generateRandomNISN = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const generateScribble = (cx: number, cy: number, r: number, type: 'circle' | 'rect', isIdeal: boolean = false) => {
  const color = '#2b2b36';
  let paths = '';
  
  if (isIdeal) {
    if (type === 'circle') {
       paths += `<circle cx="${cx}" cy="${cy}" r="${r * 0.9}" fill="${color}" opacity="1" />`;
    } else {
       paths += `<rect x="${cx - r * 0.9}" y="${cy - r * 0.9}" width="${r * 1.8}" height="${r * 1.8}" rx="2" fill="${color}" opacity="1" />`;
    }
    return paths;
  }

  // Draw natural pencil fill
  if (type === 'circle') {
     paths += `<circle cx="${cx + (Math.random()*2-1)}" cy="${cy + (Math.random()*2-1)}" r="${r * 0.85}" fill="${color}" opacity="0.95" />`;
  } else {
     paths += `<rect x="${cx - r * 0.85 + (Math.random()*2-1)}" y="${cy - r * 0.85 + (Math.random()*2-1)}" width="${r * 1.7}" height="${r * 1.7}" rx="2" fill="${color}" opacity="0.95" />`;
  }
  
  for (let i=0; i<3; i++) {
    const x1 = cx - r + Math.random() * r * 2;
    const y1 = cy - r + Math.random() * r * 2;
    const x2 = cx - r + Math.random() * r * 2;
    const y2 = cy - r + Math.random() * r * 2;
    paths += `<path d="M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}" stroke="${color}" stroke-width="${Math.random()*1.5 + 1}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  }
  return paths;
};

const isIdentityOrTextBlock = (type: string, direction?: string): boolean => {
  if (direction === 'teks' || direction === 'handwritten') return true;
  return [
    'handwritten_identity',
    'identity_nisn',
    'identity_npsn',
    'identity_subject',
    'identity_test',
    'teks_kustom'
  ].includes(type);
};

const getSafeOptions = (block: TemplateBlock): string[] => {
  if (block.options && block.options.length > 0) {
    return block.options;
  }
  if (block.type === 'bs' || block.type === 'bs3') {
    return ['B', 'S'];
  }
  if (block.type === 'sts') {
    return ['S', 'TS'];
  }
  if (block.type === 'skala') {
    return ['1', '2', '3', '4', '5'];
  }
  return ['A', 'B', 'C', 'D'];
};

const generateAnswerKey = (template: OmrTemplate): Record<string | number, any> => {
  const answerKey: Record<string | number, any> = {};
  template.blocks.forEach(block => {
    if (!isIdentityOrTextBlock(block.type, block.direction)) {
      answerKey[block.id] = [];
      const rows = block.rows || 1;
      const opts = getSafeOptions(block);

      if (block.type === 'jodoh') {
        const shuffledOpts = [...opts].sort(() => 0.5 - Math.random());
        for (let r = 0; r < rows; r++) {
          answerKey[block.id].push([shuffledOpts[r % shuffledOpts.length]]);
        }
      } else {
        for (let r = 0; r < rows; r++) {
          if (block.type === 'kompleks') {
            const numAns = Math.min(opts.length, Math.floor(Math.random() * 2) + 1);
            const shuffledOpts = [...opts].sort(() => 0.5 - Math.random());
            answerKey[block.id].push(shuffledOpts.slice(0, numAns));
          } else if (block.type === 'bs3') {
            const ansArray = [
              opts[Math.floor(Math.random() * opts.length)],
              opts[Math.floor(Math.random() * opts.length)],
              opts[Math.floor(Math.random() * opts.length)]
            ];
            answerKey[block.id].push(ansArray);
          } else {
            const randomOpt = opts[Math.floor(Math.random() * opts.length)];
            answerKey[block.id].push([randomOpt]);
          }
        }
      }
    }
  });
  return answerKey;
};

const generateStudentAnswers = (template: OmrTemplate, answerKey: Record<string | number, any>): Record<string | number, any> => {
  const studentAnswers: Record<string | number, any> = {};
  template.blocks.forEach(block => {
    if (!isIdentityOrTextBlock(block.type, block.direction)) {
      studentAnswers[block.id] = [];
      const rows = block.rows || 1;
      const opts = getSafeOptions(block);
      const keyBlockAns = answerKey[block.id] || [];

      if (block.type === 'jodoh') {
        const rowCorrectness = Array.from({ length: rows }, () => Math.random() < 0.8);
        const studentChoices = new Array(rows);
        let remainingOpts = [...opts];

        for (let r = 0; r < rows; r++) {
          if (rowCorrectness[r] && keyBlockAns[r]) {
            studentChoices[r] = keyBlockAns[r][0];
            remainingOpts = remainingOpts.filter(o => o !== studentChoices[r]);
          }
        }

        remainingOpts = remainingOpts.sort(() => 0.5 - Math.random());
        let remainIdx = 0;

        for (let r = 0; r < rows; r++) {
          if (!rowCorrectness[r] || !studentChoices[r]) {
            studentChoices[r] = remainingOpts.length > 0 
              ? remainingOpts[remainIdx % remainingOpts.length] 
              : opts[Math.floor(Math.random() * opts.length)];
            remainIdx++;
          }
          studentAnswers[block.id].push([studentChoices[r] || opts[0]]);
        }
      } else {
        for (let r = 0; r < rows; r++) {
          if (block.type === 'kompleks') {
            if (Math.random() < 0.75 && keyBlockAns[r]) {
              studentAnswers[block.id].push(keyBlockAns[r]);
            } else {
              const numAns = Math.min(opts.length, Math.floor(Math.random() * 2) + 1);
              const shuffledOpts = [...opts].sort(() => 0.5 - Math.random());
              studentAnswers[block.id].push(shuffledOpts.slice(0, numAns));
            }
          } else if (block.type === 'bs3') {
            const studentAnsArray: string[] = [];
            for (let sub = 0; sub < 3; sub++) {
              if (Math.random() < 0.8 && keyBlockAns[r]?.[sub]) {
                studentAnsArray.push(keyBlockAns[r][sub]);
              } else {
                const randomOpt = opts[Math.floor(Math.random() * opts.length)];
                studentAnsArray.push(randomOpt);
              }
            }
            studentAnswers[block.id].push(studentAnsArray);
          } else {
            if (Math.random() < 0.8 && keyBlockAns[r]?.[0]) {
              studentAnswers[block.id].push(keyBlockAns[r]);
            } else {
              const randomOpt = opts[Math.floor(Math.random() * opts.length)];
              studentAnswers[block.id].push([randomOpt]);
            }
          }
        }
      }
    }
  });
  return studentAnswers;
};

const buildSvgString = (template: OmrTemplate, simData: any): string => {
  let blocksHtml = '';
  const isKey = !!simData.isKey;
  
  template.blocks.forEach((block: any) => {
    let blockContent = '';
    const isAns = simData.answers && simData.answers[block.id];
    
    if (block.type === 'handwritten_identity') {
      blockContent = `
        <rect width="820" height="220" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
        <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
        <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">${escapeXml(block.title)}</text>
        <text x="15" y="25" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Nama Lengkap:</text>
        <rect x="15" y="35" width="790" height="25" fill="none" stroke="#475569" stroke-width="1" />
        <text x="20" y="52" font-size="16" font-family="Inter, sans-serif" fill="#0f172a">${escapeXml(simData.name)}</text>
        
        <text x="15" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Kelas:</text>
        <rect x="15" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
        <text x="20" y="107" font-size="16" font-family="Inter, sans-serif" fill="#0f172a">${escapeXml(config.value.className)}</text>
        
        <text x="180" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">No. Peserta:</text>
        <rect x="180" y="90" width="150" height="25" fill="none" stroke="#475569" stroke-width="1" />
        <text x="185" y="107" font-size="16" font-family="Inter, sans-serif" fill="#0f172a">${escapeXml(simData.absen)}</text>
        
        <text x="345" y="80" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanggal Pelaksanaan Tes:</text>
        <rect x="345" y="90" width="460" height="25" fill="none" stroke="#475569" stroke-width="1" />

        <text x="15" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Pernyataan Kejujuran: Salin teks <tspan font-style="italic">"Saya mengerjakan tes dengan jujur."</tspan></text>
        <rect x="15" y="155" width="550" height="50" fill="none" stroke="#475569" stroke-width="1" />
        <text x="25" y="186" font-size="14" font-family="cursive, Inter, sans-serif" font-style="italic" fill="#0f172a">Saya mengerjakan tes dengan jujur.</text>

        <text x="580" y="145" font-size="12" font-weight="bold" font-family="Inter, sans-serif">Tanda Tangan:</text>
        <rect x="580" y="155" width="225" height="50" fill="none" stroke="#475569" stroke-width="1" />
        <path d="M 595 188 Q 610 162 625 182 T 655 178 T 685 188 T 725 172 T 775 182" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.85" />
      `;
    } else if (block.direction === 'vertical') {
      const cols = block.cols || 1;
      const rows = block.rows || 10;
      
      let prefill = '';
      if (block.type === 'identity_nisn') prefill = simData.nisn;
      else if (block.type === 'identity_npsn') prefill = block.prefillValue || '20301942';
      else if (block.type === 'identity_subject') prefill = (config.value.mapel || '01').padStart(cols, '0');
      else if (block.type === 'identity_test') prefill = (config.value.tes || '01').padStart(cols, '0');
      else prefill = (block.prefillValue || '').toString();

      prefill = prefill.padEnd(cols, ' ');

      let bgCols = '';
      for(let c=1; c<=cols; c++) {
        if ((c-1)%2===1) bgCols += `<rect x="${(c-1)*32 + 4}" y="0" width="32" height="${rows * 28 + 35}" fill="#f8fafc" />`;
      }

      let boxes = '';
      for(let c=1; c<=cols; c++) {
        const char = prefill[c-1] !== ' ' ? prefill[c-1] : '';
        boxes += `<rect x="${(c-1)*32 + 9}" y="5" width="24" height="24" fill="none" stroke="#475569" stroke-width="1.5" />
                  <text x="${(c-1)*32 + 21}" y="23" font-size="16" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif" fill="#0f172a">${escapeXml(char)}</text>`;
      }

      let circles = '';
      const opts = block.options && block.options.length > 0 ? block.options : ['0','1','2','3','4','5','6','7','8','9'];
      for(let r=1; r<=rows; r++) {
        for(let c=1; c<=cols; c++) {
          const optVal = opts[r-1] || '';
          const isFilled = prefill[c-1] === optVal;
          
          circles += `<circle cx="${(c-1)*32 + 21}" cy="${r*28 + 20}" r="10" fill="none" stroke="#475569" stroke-width="1.5" />
                      <text x="${(c-1)*32 + 21}" y="${r*28 + 24}" font-size="10" text-anchor="middle" font-family="Inter, sans-serif" fill="#475569">${escapeXml(optVal)}</text>`;
          
          if (isFilled) {
             const isIdealBubble = isKey || ['identity_npsn', 'identity_subject', 'identity_test'].includes(block.type);
             circles += generateScribble((c-1)*32 + 21, r*28 + 20, 10, 'circle', isIdealBubble);
          }
        }
      }

      blockContent = `
        ${bgCols}
        <rect width="${cols * 32 + 20}" height="${rows * 28 + 60}" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
        <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
        <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">${escapeXml(block.title)}</text>
        ${boxes}
        ${circles}
      `;
    } else if (block.direction === 'horizontal') {
      const rows = block.rows || 1;
      const opts = getSafeOptions(block);
      const totalRows = block.type === 'bs3' ? rows * 3 : rows;
      
      let bgRows = '';
      for(let r=1; r<=totalRows; r++) {
        if ((r-1)%2===1) bgRows += `<rect x="5" y="${(r-1)*30 + 5}" width="${opts.length * 35 + 40}" height="30" fill="#f8fafc" />`;
      }
      
      let optionsHtml = '';
      for(let r=1; r<=totalRows; r++) {
        if (block.type !== 'bs3' || (r-1)%3 === 0) {
          const num = (block.startNum || 1) + (block.type === 'bs3' ? Math.floor((r-1)/3) : (r - 1));
          optionsHtml += `<text x="10" y="${(r-1)*30 + 25}" font-size="12" font-weight="bold" font-family="Inter, sans-serif">${num}.</text>`;
        }
        
        let rowAns: string[] = [];
        if (isAns && simData.answers[block.id]) {
          if (block.type === 'bs3') {
            const qIdx = Math.floor((r-1)/3);
            const subIdx = (r-1)%3;
            if (simData.answers[block.id][qIdx] && simData.answers[block.id][qIdx][subIdx]) {
              rowAns = [simData.answers[block.id][qIdx][subIdx]];
            }
          } else {
            rowAns = simData.answers[block.id][r-1] || [];
          }
        }
        
        for(let oIdx=0; oIdx<opts.length; oIdx++) {
          const opt = opts[oIdx];
          const filled = rowAns && rowAns.includes(opt);
          if (block.type !== 'kompleks') {
            optionsHtml += `<circle cx="${oIdx*35 + 45}" cy="${(r-1)*30 + 20}" r="10" fill="none" stroke="#475569" stroke-width="1.5" />`;
            optionsHtml += `<text x="${oIdx*35 + 45}" y="${(r-1)*30 + 24}" font-size="${opt.length > 1 ? 8 : 10}" text-anchor="middle" font-family="Inter, sans-serif" fill="#475569">${escapeXml(opt)}</text>`;
            if (filled) {
              optionsHtml += generateScribble(oIdx*35 + 45, (r-1)*30 + 20, 10, 'circle', isKey);
            }
          } else {
            optionsHtml += `<rect x="${oIdx*35 + 35}" y="${(r-1)*30 + 10}" width="20" height="20" rx="3" fill="none" stroke="#475569" stroke-width="1.5" />`;
            optionsHtml += `<text x="${oIdx*35 + 45}" y="${(r-1)*30 + 24}" font-size="${opt.length > 1 ? 8 : 10}" text-anchor="middle" font-family="Inter, sans-serif" fill="#475569">${escapeXml(opt)}</text>`;
            if (filled) {
              optionsHtml += generateScribble(oIdx*35 + 45, (r-1)*30 + 20, 10, 'rect', isKey);
            }
          }
        }
      }

      blockContent = `
        ${bgRows}
        <rect width="${opts.length * 35 + 50}" height="${totalRows * 30 + 10}" fill="none" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="4,4" />
        <rect x="0" y="-19" width="7" height="7" fill="#0f172a" rx="1.5" />
        <text x="12" y="-13" font-size="11" font-weight="bold" fill="#334155" font-family="Inter, sans-serif">${escapeXml(block.title)}</text>
        ${optionsHtml}
      `;
    } else if (block.type === 'teks_kustom' || block.direction === 'teks') {
      blockContent = renderCustomTextSvg(block);
    } else {
      const w = block.cols || 150;
      const h = block.rows || 50;
      blockContent = `
        <rect width="${w}" height="${h}" fill="none" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3,3" />
        <text x="10" y="20" font-size="11" fill="#64748b" font-family="Inter, sans-serif">${escapeXml(block.title || 'Blok')}</text>
      `;
    }

    blocksHtml += `<g transform="translate(${block.x},${block.y})">${blockContent}</g>`;
  });

  return `
    <svg viewBox="0 0 1000 1414" width="1000" height="1414" xmlns="http://www.w3.org/2000/svg">
      <rect width="1000" height="1414" fill="#ffffff" />
      <text x="500" y="95" font-size="28" font-weight="bold" text-anchor="middle" font-family="Inter, sans-serif" fill="#0f172a">${escapeXml(template.name)}</text>
      
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
          ${Array.from({length:30}, (_,i)=>`<rect x="46" y="${46 + (i*41.5)}" width="8" height="4" rx="1" /><rect x="946" y="${46 + (i*41.5)}" width="8" height="4" rx="1" />`).join('')}
          ${Array.from({length:18}, (_,i)=>`<rect x="${46 + (i*46.3)}" y="46" width="4" height="8" rx="1" /><rect x="${46 + (i*46.3)}" y="1360" width="4" height="8" rx="1" />`).join('')}
        </g>
      </g>
      
      ${blocksHtml}
    </svg>
  `;
};

const drawSvgToCtx = (svgStr: string, ctx: CanvasRenderingContext2D, dx: number, dy: number, scale: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const DOMURL = window.URL || window.webkitURL || window;
    const url = DOMURL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0, 1000, 1414, dx, dy, 1000 * scale, 1414 * scale);
      DOMURL.revokeObjectURL(url);
      resolve();
    };
    img.onerror = () => {
      DOMURL.revokeObjectURL(url);
      reject(new Error("Gagal merender lembar SVG ke kanvas gambar."));
    };
    img.src = url;
  });
};

const svgToImage = (svgStrings: string[], format: string = 'A4'): Promise<Blob> => {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Konteks kanvas tidak tersedia'));

      if (format === 'F4') {
        canvas.width = 3300;
        canvas.height = 2150;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.setLineDash([20, 20]);
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(1650, 0);
        ctx.lineTo(1650, 2150);
        ctx.stroke();
        ctx.setLineDash([]); 

        if (svgStrings[0]) await drawSvgToCtx(svgStrings[0], ctx, 100, 50, 1.45);
        if (svgStrings[1]) await drawSvgToCtx(svgStrings[1], ctx, 1750, 50, 1.45);
      } else {
        canvas.width = 1000;
        canvas.height = 1414;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (svgStrings[0]) await drawSvgToCtx(svgStrings[0], ctx, 0, 0, 1);
      }

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal mengekspor kanvas ke format gambar JPEG'));
      }, 'image/jpeg', 0.95);
    } catch (err) {
      reject(err);
    }
  });
};

let previewSeed = ref(0);

const updatePreview = () => {
  const template = selectedTemplate.value;
  if (!template || !template.blocks || template.blocks.length === 0) {
    previewSvg.value = '<div class="pa-8 text-center text-grey">Pilih templat untuk melihat pratinjau.</div>';
    return;
  }

  const answerKey = generateAnswerKey(template);

  if (previewMode.value === 'key') {
    previewSvg.value = buildSvgString(template, {
      name: "KUNCI JAWABAN",
      absen: "00",
      nisn: "0000000000",
      answers: answerKey,
      isKey: true
    });
  } else {
    const studentIndex = previewSeed.value % banyumasNames.length;
    const studentAnswers = generateStudentAnswers(template, answerKey);
    previewSvg.value = buildSvgString(template, {
      name: banyumasNames[studentIndex],
      absen: (studentIndex + 1).toString().padStart(2, '0'),
      nisn: "20301942" + (studentIndex + 1).toString().padStart(2, '0'),
      answers: studentAnswers,
      isKey: false
    });
  }
};

const shufflePreview = () => {
  previewSeed.value = Math.floor(Math.random() * banyumasNames.length);
  updatePreview();
};

const generateSimulation = async () => {
  const template = selectedTemplate.value;
  if (!template || !template.blocks || template.blocks.length === 0) {
    omrStore.showToast("Pilih templat yang memiliki blok soal terlebih dahulu.", "warning");
    return;
  }

  const count = Math.max(2, Math.min(32, config.value.count));
  isGenerating.value = true;
  progressPercent.value = 0;
  progressText.value = 'Mempersiapkan data kunci jawaban dan siswa...';
  
  try {
    const zip = new JSZip();
    const imgFolder = zip.folder("Simulasi_LJK");
    if (!imgFolder) throw new Error("Gagal membuat folder di dalam zip");

    const answerKey = generateAnswerKey(template);
    const svgStrings: string[] = [];
    const filenames: string[] = [];

    // Lembar 1: Kunci Jawaban
    svgStrings.push(buildSvgString(template, { 
      name: "KUNCI JAWABAN", 
      absen: "00", 
      nisn: "0000000000", 
      answers: answerKey, 
      isKey: true 
    }));
    filenames.push("00_KUNCI_JAWABAN.jpg");

    // Lembar Siswa
    const npsnBlock = template.blocks.find(b => b.type === 'identity_npsn');
    const npsn = npsnBlock?.prefillValue || "20301942";
    const safeMapel = (config.value.mapel || '01').padStart(2, '0');
    const safeTes = (config.value.tes || '01').padStart(2, '0');

    for (let i = 0; i < count; i++) {
      const name = banyumasNames[i % banyumasNames.length];
      const absen = (i + 1).toString().padStart(2, '0');
      const nisn = generateRandomNISN();
      const filename = `${npsn}_${safeMapel}_${safeTes}_${nisn}.jpg`;

      const studentAnswers = generateStudentAnswers(template, answerKey);
      const simData = {
        name,
        absen,
        nisn,
        answers: studentAnswers,
        isKey: false
      };

      svgStrings.push(buildSvgString(template, simData));
      filenames.push(filename);
    }
    
    const totalBatches = config.value.format === 'F4' ? Math.ceil(svgStrings.length / 2) : svgStrings.length;
    let completedBatches = 0;

    if (config.value.format === 'F4') {
      for (let i = 0; i < svgStrings.length; i += 2) {
        const chunk = svgStrings.slice(i, i + 2);
        const chunkNames = filenames.slice(i, i + 2);
        progressText.value = `Merender lembar F4 ${Math.floor(i / 2) + 1} dari ${totalBatches}...`;
        progressPercent.value = Math.round((completedBatches / totalBatches) * 85);
        
        const imgBlob = await svgToImage(chunk, 'F4');
        const mergedName = chunkNames.length === 2 
          ? `${chunkNames[0].replace('.jpg', '')}_AND_${chunkNames[1]}` 
          : chunkNames[0];
        imgFolder.file(mergedName, imgBlob);
        completedBatches++;
      }
    } else {
      for (let i = 0; i < svgStrings.length; i++) {
        progressText.value = `Merender lembar ${i + 1} dari ${totalBatches} (${filenames[i]})...`;
        progressPercent.value = Math.round((completedBatches / totalBatches) * 85);
        
        const imgBlob = await svgToImage([svgStrings[i]], 'A4');
        imgFolder.file(filenames[i], imgBlob);
        completedBatches++;
      }
    }

    progressText.value = 'Mengompresi ke file ZIP...';
    progressPercent.value = 92;
    const content = await zip.generateAsync({ type: "blob" });
    
    progressText.value = 'Mengunduh file simulasi...';
    progressPercent.value = 100;
    saveAs(content, `Simulasi_LJK_${safeMapel}_${safeTes}.zip`);
    
    omrStore.showToast("Berhasil membuat file ZIP simulasi dengan " + filenames.length + " lembar LJK.", "success");
  } catch (error: any) {
    omrStore.showToast(`Kesalahan simulasi: ${error.message}`, "error");
  } finally {
    isGenerating.value = false;
  }
};

onMounted(async () => {
  await omrStore.loadTemplatesFromDB();
  if (omrStore.activeTemplate?.id) {
    selectedTemplateId.value = omrStore.activeTemplate.id;
  } else if (omrStore.savedTemplates.length > 0) {
    selectedTemplateId.value = omrStore.savedTemplates[0].id!;
  }
  updatePreview();
});

watch(selectedTemplateId, () => {
  updatePreview();
});

watch(previewMode, () => {
  updatePreview();
});

watch(() => config.value, () => {
  updatePreview();
}, { deep: true });
</script>
