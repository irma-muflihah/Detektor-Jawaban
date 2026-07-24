# 📝 Detektor Jawaban - Web OMR LJK Scanner

**Detektor Jawaban** adalah aplikasi web pemindai Lembar Jawaban Komputer (LJK) berbasis *Optical Mark Recognition* (OMR) dan *Computer Vision* yang dirancang untuk memudahkan guru dan pendidik dalam memeriksa hasil ujian siswa secara otomatis, akurat, dan serba cepat hanya menggunakan kamera smartphone atau webcam.

![Detektor Jawaban Banner](https://img.shields.io/badge/Pengembang-Irma%20Muflihah%2C%20S.Pd.-blue?style=for-the-badge)
![SMPN 2 Kemranjen](https://img.shields.io/badge/Instansi-SMPN%202%20Kemranjen-emerald?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)

---

## 👩‍🏫 Pengembang Proyek

* **Nama:** Irma Muflihah, S.Pd.
* **Peran:** Guru Matematika
* **Instansi:** SMP Negeri 2 Kemranjen, Kabupaten Banyumas
* **Tujuan Proyek:** Mengembangkan inovasi teknologi digital pembelajaran guna mempercepat efisiensi koreksi ujian sekolah, analisis butir soal matematika, serta rekapitulasi nilai berbasis KKM.

---

## ✨ Fitur Utama

### 📷 1. Pemindaian LJK Real-time (Camera & Upload)
* Buka kamera langsung dari smartphone atau browser laptop tanpa menginstal aplikasi tambahan.
* Fitur pengingat orientasi (*viewfinder grid*) untuk presisi pemindaian bulatan LJK.
* Opsi unggah foto LJK dari galeri perangkat.
* Mode pengujian demo (*Sample LJK*) untuk mencoba sistem tanpa perlu mencetak kertas terlebih dahulu.

### 🔑 2. Kelola Kunci Jawaban & Standar KKM
* Mendukung hingga **10 - 50 soal** per lembar ujian.
* Format pilihan ganda 4 opsi (A-D) maupun 5 opsi (A-E).
* Pembuatan kunci jawaban interaktif dengan fitur *Auto-Fill* (Acak, All A, All B, dll).
* Penentuan KKM (Kriteria Ketuntasan Minimal) dan bobot poin per soal secara fleksibel.

### 🔍 3. Koreksi & Verifikasi Hasil Instan
* Penilaian otomatis secara *real-time* disertai rincian jumlah benar, salah, dan kosong.
* Penanda status kelulusan (LULUS / REMIDIAL) secara otomatis berdasarkan KKM.
* Fitur koreksi manual cepat jika terdapat kebingungan pengisian oleh siswa.

### 📊 4. Analisis Butir Soal (Item Analysis) & Statistik
* Perhitungan otomatis rata-rata kelas, nilai tertinggi, dan nilai terendah.
* **Analisis Tingkat Kesukaran Soal** (Difficulty Index) yang memetakan soal ke dalam kategori *Mudah*, *Sedang*, atau *Sukar*.
* Distribusi sebaran jawaban (*distractor analysis*) untuk evaluasi mutu soal bagi guru.

### 📊 5. Ekspor Rekap Nilai ke CSV / Excel
* Unduh rekapitulasi nilai lengkap siswa dalam bentuk format file `.csv` yang siap dibuka di Microsoft Excel atau Google Sheets.
* Menyajikan data NIS, Nama Siswa, Kelas, Nilai Akhir, Status KKM, serta rincian Benar/Salah/Kosong.

### 🖨️ 6. Generator & Cetak LJK Fisik (Print/PDF)
* Template LJK siap cetak yang dapat disesuaikan (Nama Sekolah, Judul Ujian, Mata Pelajaran).
* Dilengkapi *Fiducial Calibration Markers* pada sudut lembar LJK untuk membantu deteksi kamera.

---

## 🛠️ Teknologi yang Digunakan

* **Frontend Framework:** React 18 (Vite)
* **Bahasa Pemrograman:** TypeScript
* **Styling:** Tailwind CSS (Bold Typography Dark Theme)
* **Pengolahan Citra / Camera API:** HTML5 Canvas API & WebRTC MediaDevices
* **Iconography:** Lucide React
* **Penyimpanan Data:** Web LocalStorage (Offline Persistence)

---

## 🚀 Cara Menjalankan Proyek Secara Lokal

1. **Clone Repositori ini:**
   ```bash
   git clone https://github.com/username/detektor-jawaban.git
   cd detektor-jawaban
   ```

2. **Instal Dependensi:**
   ```bash
   npm install
   ```

3. **Jalankan Development Server:**
   ```bash
   npm run dev
   ```
   Buka browser di alamat `http://localhost:3000`.

4. **Build untuk Produksi:**
   ```bash
   npm run build
   ```

---

## 📱 Panduan Penggunaan Singkat

1. **Buat Ujian Baru:** Buka tab `Kelola Ujian`, atur judul ujian, mata pelajaran, KKM, serta isi kunci jawaban.
2. **Cetak Lembar LJK:** Gunakan tab `Cetak LJK` untuk mengunduh PDF atau mencetak lembar LJK untuk dibagikan ke siswa.
3. **Pindai LJK:** Masuk ke tab `Pindai LJK`, arahkan kamera smartphone ke lembar jawaban siswa hingga bulatan terdeteksi, lalu simpan hasil.
4. **Lihat Analisis & Ekspor:** Buka tab `Hasil & Analisis` untuk melihat peringkat siswa, grafik tingkat kesukaran soal, dan unduh rekap nilai CSV.

---

## 📄 Lisensi & Hak Cipta

© 2026 **Irma Muflihah, S.Pd.** (SMPN 2 Kemranjen). Dibuat untuk tujuan pendidikan dan kemajuan pembelajaran Indonesia.
