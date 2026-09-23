# DEJAWAB (Detektor Jawaban) v2.0.0

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](package.json)
[![Vue](https://img.shields.io/badge/Vue-3.4+-emerald.svg)](https://vuejs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20GenAI-SDK%20v2.23-orange.svg)](https://ai.google.dev/)
[![Vuetify](https://img.shields.io/badge/Vuetify-3.6+-blue.svg)](https://vuetifyjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**DEJAWAB** adalah platform web modern untuk perancangan (desain generatif), pencetakan presisi, dan pemindaian otomatis **Lembar Jawab Komputer (LJK)** sekolah dan asesmen di Indonesia. 

Versi **2.0.0** merupakan lompatan arsitektural besar (*major release*) yang memperkenalkan **Dual-Engine Scanning**: perpaduan antara mesin optik berbasis **Computer Vision (OpenCV.js WASM)** dan **Google Gemini Multimodal AI Vision** dengan kebebasan pemilihan model tanpa *vendor locking*.

---

## 🚀 Fitur Unggulan Versi 2.0.0

### 1. Dual-Engine Pemindaian LJK
*   **Google Gemini Multimodal Vision AI (Engine Utama):**
    *   Mengekstrak tulisan tangan peserta (*Nama Lengkap*, *Kelas*, *No. Peserta*, *Tanggal Pelaksanaan*, *Pernyataan Kejujuran*, dan status *Tanda Tangan/Paraf*).
    *   Validasi silang ganda (*cross-validation*) antara kotak angka tulisan tangan dan bulatan 0-9 untuk **NISN 10 digit**, **NPSN 8 digit**, **ID Mapel 2 digit**, dan **Kode Tes 2 digit**.
    *   Mendukung beragam format soal: Pilihan Ganda biasa (PG), Pilihan Ganda Kompleks multi-centang (PGK), Benar/Salah (BS / BS 3 baris), Ya/Tidak (YT / YT 3 baris), Menjodohkan, dan Skala Likert.
    *   Tahan terhadap kemiringan kamera, distorsi perspektif, kondisi pencahayaan minim, arsiran tipis, hingga kertas agak kusut.
*   **OpenCV.js Computer Vision (Engine Luring / Offline):**
    *   Pemindaian berbasis WebAssembly langsung di peramban tanpa memerlukan koneksi internet atau kuota API.

### 2. Fleksibilitas Model Gemini Tanpa Kunci (*Zero Vendor Locking*)
Pengguna memiliki kebebasan penuh memilih model Gemini sesuai kebutuhan akurasi dan kecepatan melalui dialog **Pengaturan AI**:
*   **Gemini 3.8 Flash** *(Default & Rekomendasi)*: Kecepatan tinggi, efisien kuota token, dan akurasi OCR/OMR tinggi.
*   **Gemini 3.1 Pro (Preview)** *(Advanced AI)*: Penalaran mendalam (*deep reasoning*) untuk LJK dengan tulisan tangan sulit atau lembar arsiran pensil tipis.
*   **Gemini 2.5 Pro**: Akurasi analitik tingkat lanjut untuk evaluasi optik kompleks.
*   **Gemini 2.5 Flash**: Pilihan stabil dengan performa cepat.
*   **Gemini 3.1 Flash Lite**: Latensi terendah, optimal untuk pemindaian massal berkas (*batch scan*).
*   **Model Kustom (Ketik Sendiri)**: Pengguna bebas memasukkan nama model Gemini resmi lainnya dari Google AI Studio.
*   **Pengujian Koneksi Interaktif**: Tombol uji koneksi *real-time* untuk memastikan validitas API Key dan ketersediaan model yang dipilih.

### 3. Arsitektur Kompatibilitas Multi-Platform (Cloud Run & Vercel)
*   **Google Cloud Run / Express Server:** Menggunakan server backend proxy (`server.ts`) dengan Express 5 dan port dinamis `$PORT`.
*   **Vercel Static & Serverless (`https://detektor-jawaban.vercel.app`):**
    *   Mendukung *fallback* pemrosesan langsung di peramban (*Client SDK direct scan*) menggunakan pustaka `@google/genai` bila backend proxy tidak tersedia.
    *   Penyimpanan API Key dan preferensi model secara aman di `localStorage` peramban pengguna.

### 4. Perancang & Pencetak LJK Vektor Presisi Tinggi
*   Penyusunan tata letak dinamis berbasis *drag & drop* / blok modular.
*   Ekspor ke format PDF vektor resolusi tinggi siap cetak (A4) tanpa penurunan kualitas grafis bulatan hitam dan *marker alignment*.

### 5. Manajemen Kunci Jawaban & Analisis Butir Soal
*   Koreksi otomatis instan berbobot skor per butir soal.
*   Analisis daya beda, tingkat kesukaran, dan sebaran opsi jawaban.
*   Ekspor data hasil penilaian ke Excel / CSV / PDF.

---

## 🛠️ Stack Teknologi

| Komponen | Teknologi |
| :--- | :--- |
| **Framework Utama** | Vue 3 (Composition API, `<script setup>`), TypeScript |
| **Pustaka Antarmuka (UI)** | Vuetify 3 (Material Design), `@mdi/font` |
| **Kecerdasan Buatan (AI)** | `@google/genai` TypeScript SDK (Gemini 3.8 Flash / 3.1 Pro / 2.5) |
| **Computer Vision (Lokal)** | OpenCV.js (WebAssembly) |
| **Database Lokal** | Dexie.js (IndexedDB) untuk penyimpanan luring |
| **Visualisasi & Grafik** | Chart.js & Vue-Chartjs |
| **Dokumen & Ekspor** | jsPDF, jsPDF-AutoTable, JSZip, FileSaver |
| **Build & Bundler** | Vite 5, Vue-TSC |
| **Server Backend** | Express 5 (Node.js ESM) |

---

## 📦 Menjalankan Proyek Secara Lokal

### Prasyarat
*   Node.js versi 20+ atau Node.js versi 22+
*   NPM atau Bun

### Langkah Instalasi
1. Kloning repositori:
   ```bash
   git clone https://github.com/<username>/dejawab.git
   cd dejawab
   ```

2. Instal dependensi:
   ```bash
   npm install
   ```

3. (Opsional) Siapkan file konfigurasi lingkungan:
   ```bash
   cp .env.example .env
   # Masukkan GEMINI_API_KEY=AIzaSy... jika ingin menggunakan API key pada backend server
   ```

4. Jalankan server pengembangan Vite:
   ```bash
   npm run dev
   ```
   Aplikasi akan terbuka pada `http://localhost:3000`.

---

## 🚀 Panduan Build & Deployment

### Build Produksi
```bash
npm run build
```
Hasil build akan dihasilkan pada direktori `dist/`.

### Deployment ke Vercel (`detektor-jawaban.vercel.app`)
Proyek ini sudah dilengkapi dengan konfigurasi `vercel.json` dan `/api/index.ts`:
```bash
npm run deploy
```
*Catatan untuk pengguna Vercel:* Anda dapat langsung memasukkan Gemini API Key dan memilih model pada menu **Pengaturan (ikon ⚙️)** di aplikasi web tanpa perlu mengatur Environment Variables di server Vercel.

---

## 🏷️ Riwayat Rilis (Changelog)

### Versi 2.0.0
*   **Major Architecture Upgrade:** Integrasi Google Gemini Multimodal Vision AI (`@google/genai`) sebagai mesin pemindai LJK utama.
*   **Dukungan Multi-Model Dinamis:** Pilihan model fleksibel (Gemini 3.8 Flash, Gemini 3.1 Pro, Gemini 2.5 Pro, Flash Lite, dan Model Kustom).
*   **Dukungan Penuh Vercel:** Fitur input Gemini API Key peramban (*client-side SDK fallback*) untuk deployment statis/serverless di Vercel.
*   **OCR Tulisan Tangan Peserta:** Ekstraksi otomatis Nama, Kelas, No. Peserta, Tanggal Ujian, Pernyataan Kejujuran, dan Tanda Tangan.
*   **Cross-Validation OMR:** Sinkronisasi kotak angka dan bulatan 0-9 untuk NISN, NPSN, Mapel, dan Kode Tes.
*   **Perbaikan Express 5 Routing:** Perbaikan kompatibilitas rute SPA fallback dengan `path-to-regexp` v8 dan port dinamis Cloud Run.

---

## 📄 Lisensi
Didistribusikan di bawah lisensi MIT. Lihat berkas `LICENSE` untuk informasi lebih lanjut.
