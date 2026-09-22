# DEJAWAB - Detektor Jawaban

DEJAWAB (Detektor Jawaban) adalah aplikasi web modern untuk merancang (generate) dan memindai Lembar Jawab Komputer (LJK) menggunakan teknologi AI di browser. 
Aplikasi ini dibangun dengan framework **Vue 3**, **Vuetify 3**, dan **Dexie.js** untuk penyimpanan lokal yang persisten.

## Fitur Utama
- 🎨 **LJK Generator (Desainer)**: Buat template LJK custom dengan berbagai tipe blok soal (PG, PG Kompleks, Benar/Salah, Menjodohkan, dll) dan data identitas peserta.
- 💾 **State Management & Offline Storage**: Desain template disimpan secara lokal menggunakan IndexedDB (via Dexie.js) sehingga dapat bekerja secara luring.
- 🖨️ **Ekspor PDF Berkualitas Tinggi**: Ekspor desain LJK langsung ke format PDF vektor yang presisi dan tajam, tanpa dependensi server (Zero-Dependency PDF Print).
- 🧠 **Modul Pemindaian AI (Segera Hadir)**: Pemindaian cerdas dan cepat menggunakan OpenCV berbasis browser.
- 📱 **Desain Responsif**: Antarmuka yang ergonomis, profesional, dan kompatibel dengan berbagai ukuran layar, termasuk perangkat seluler.

## Teknologi
- **Frontend Framework**: Vue 3 (Composition API) + Vite
- **UI Component Library**: Vuetify 3
- **State Management**: Pinia
- **Database Lokal**: Dexie.js (IndexedDB wrapper)
- **Computer Vision**: OpenCV.js (WebAssembly)

## Mulai Pengembangan (Development)
Untuk menjalankan proyek ini secara lokal:
1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan server pengembangan lokal (Vite):
   ```bash
   npm run dev
   ```

## Deployment
Proyek ini dapat di-build untuk deployment ke layanan hosting web statis.
- **Perintah Build**: `npm run build`
- **Direktori Output**: `dist/`

## Kontribusi
Silakan beri masukan (issues) atau pull request untuk membantu kami mengembangkan aplikasi ini.
