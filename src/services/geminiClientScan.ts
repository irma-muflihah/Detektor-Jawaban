import { GoogleGenAI, Type } from "@google/genai";
import type { OmrTemplate } from "../db/database";
import type { GeminiOmrResultData, GeminiOmrScanResponse } from "./geminiScanner";
import { getStoredModel, DEFAULT_GEMINI_MODEL } from "./geminiKeyService";

export async function scanDirectlyWithGeminiSdk(
  imageDataUrl: string,
  template: OmrTemplate | undefined,
  apiKey: string,
  modelName?: string
): Promise<GeminiOmrScanResponse> {
  if (!apiKey) {
    throw new Error("Gemini API Key belum dimasukkan.");
  }

  const selectedModel = (modelName || getStoredModel() || DEFAULT_GEMINI_MODEL).trim();

  let mimeType = "image/jpeg";
  let base64Data = imageDataUrl;

  if (imageDataUrl.startsWith("data:")) {
    const match = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'dejawab-browser-client',
      },
    },
  });

  let templateContext = "";
  if (template) {
    templateContext = `
Konfigurasi Templat LJK:
Nama Templat: ${template.name || 'Lembar Jawaban'}
Blok Identitas & Soal yang Diharapkan:
${JSON.stringify(
  template.blocks?.map(b => ({
    tipe: b.type,
    judul: b.title,
    arah: b.direction,
    kolom: b.cols,
    baris: b.rows,
    opsi: b.options,
    nomor_mulai: b.startNum,
    nilai_awal: b.prefillValue
  })),
  null,
  2
)}`;
  }

  const promptText = `Anda adalah asisten AI spesialis Optical Mark Recognition (OMR) dan Optical Character Recognition (OCR) presisi tinggi untuk Lembar Jawab Komputer (LJK) Indonesia.
Tugas Anda: Pindai gambar LJK terlampir dan ekstrak seluruh data peserta (tulisan tangan), identitas digital (kotak angka dan bulatan hitam), serta jawaban soal yang dihitamkan dengan sangat akurat.

${templateContext}

Petunjuk Khusus Ekstraksi:
1. Data Peserta (OCR Tulisan Tangan pada Blok Data Peserta di bagian atas):
   - nama_siswa: Nama lengkap siswa dari kotak tulisan tangan "Nama Lengkap" (contoh: "Kanza Aditya").
   - kelas: Kelas siswa dari kotak isian "Kelas" (contoh: "8C").
   - no_peserta: Nomor peserta dari kotak isian "No. Peserta" (contoh: "01-8C-14").
   - tanggal_ujian: Tanggal pelaksanaan dari kotak isian "Tanggal Pelaksanaan Tes" (contoh: "23 - September - 2026").
   - pernyataan_kejujuran: Kalimat pernyataan yang disalin/ditulis siswa pada kotak "Pernyataan Kejujuran" (contoh: "Saya mengerjakan tes dengan jujur").
   - tanda_tangan_terisi: Nilai boolean (true jika ada goresan tanda tangan / paraf pada kotak "Tanda Tangan", false jika kosong).

2. Blok Identitas Digital (Cross-Validation Antara Kotak Angka Atas dan Bulatan 0-9 di Bawahnya):
   - NISN (10 digit): Periksa angka yang tertulis di dalam kotak 1-10 DAN bulatan angka 0-9 yang dihitamkan di kolom bawahnya. Lakukan verifikasi silang (cross-validation) agar 10 digit angka yang dihasilkan tepat 100%.
   - NPSN (8 digit): Periksa angka di kotak 1-8 dan bulatan 0-9 di bawahnya.
   - ID Mapel (2 digit): Periksa angka di kotak dan bulatan di bawahnya.
   - Kode Tes (2 digit): Periksa angka di kotak dan bulatan di bawahnya.

3. Jawaban Soal (OMR):
   - Periksa setiap butir nomor soal.
   - Deteksi bulatan atau kotak yang dihitamkan (pensil 2B, pulpen hitam/biru, arsiran tebal). Abaikan bulatan/kotak yang kosong atau hanya coretan tipis/bekas hapusan.
   - Untuk tipe 'pg' (Pilihan Ganda Biasa): masukkan 1 opsi yang dipilih, misal ["A"] atau ["B"] atau ["C"] atau ["D"]. Jika kosong, kembalikan [].
   - Untuk tipe 'kompleks' (Pilihan Ganda Kompleks): Bentuknya berupa KOTAK CENTANG (checkboxes). Soal ini dapat memiliki LEBIH DARI SATU jawaban (multi-selection). Masukkan SEMUA opsi kotak yang dihitamkan dalam array, misalnya ["A", "B"] atau ["A", "C", "D"] atau ["B"].
   - Untuk tipe 'bs3' (Benar / Salah 3 Baris) atau 'yt3' (Ya / Tidak 3 Baris): Setiap nomor soal memiliki 3 baris sub-pernyataan. Masukkan array persis 3 string untuk baris 1, 2, dan 3, misalnya ["B", "S", "S"] atau ["Y", "T", "Y"].
   - Untuk tipe 'bs' (1 set) atau 'yt' (1 set): masukkan 1 opsi, misal ["B"] atau ["Y"].
   - Untuk tipe 'jodoh' (Menjodohkan) atau 'skala': masukkan opsi huruf/angka yang dihitamkan.
   - Jika butir soal tidak dijawab sama sekali, kembalikan array kosong [].

4. Evaluasi Kualitas & Keyakinan:
   - Kembalikan confidence_score (0.0 - 1.0) dan scan_notes catatan singkat mengenai kualitas citra, ketebalan pengisian, dan kejelasan tulisan tangan.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      npsn: { type: Type.STRING, description: "Nomor Pokok Sekolah Nasional (8 digit angka)" },
      nisn: { type: Type.STRING, description: "Nomor Induk Siswa Nasional (10 digit angka)" },
      id_mapel: { type: Type.STRING, description: "ID Mapel (2 digit angka)" },
      kode_tes: { type: Type.STRING, description: "Kode Tes (2 digit angka)" },
      nama_siswa: { type: Type.STRING, description: "Nama lengkap siswa dari tulisan tangan" },
      kelas: { type: Type.STRING, description: "Kelas siswa dari tulisan tangan" },
      no_peserta: { type: Type.STRING, description: "Nomor peserta ujian dari tulisan tangan" },
      tanggal_ujian: { type: Type.STRING, description: "Tanggal pelaksanaan ujian dari tulisan tangan" },
      pernyataan_kejujuran: { type: Type.STRING, description: "Isi kalimat tulisan tangan pernyataan kejujuran" },
      tanda_tangan_terisi: { type: Type.BOOLEAN, description: "Apakah kotak tanda tangan terisi paraf/tanda tangan" },
      confidence_score: { type: Type.NUMBER, description: "Skor keyakinan pemindaian antara 0.0 sampai 1.0" },
      scan_notes: { type: Type.STRING, description: "Catatan hasil pemindaian dan evaluasi visual LJK" },
      answers: {
        type: Type.ARRAY,
        description: "Daftar jawaban per butir soal",
        items: {
          type: Type.OBJECT,
          properties: {
            nomor_soal: { type: Type.INTEGER, description: "Nomor soal" },
            bentuk_soal: { type: Type.STRING, description: "Bentuk soal: pg, kompleks, bs, bs3, yt, yt3, skala, atau jodoh" },
            jawaban: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Array jawaban yang dihitamkan"
            }
          },
          required: ["nomor_soal", "jawaban"]
        }
      }
    },
    required: ["npsn", "nisn", "id_mapel", "kode_tes", "answers"]
  };

  const response = await ai.models.generateContent({
    model: selectedModel,
    contents: {
      parts: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: promptText,
        },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const responseText = response.text;
  if (!responseText) {
    throw new Error("Gemini tidak mengembalikan respons teks.");
  }

  const parsed = JSON.parse(responseText);

  const formattedAnswers = (parsed.answers || []).map((ans: any) => {
    let jwb = ans.jawaban;
    if (Array.isArray(jwb) && jwb.length === 1 && (ans.bentuk_soal === 'pg' || ans.bentuk_soal === 'bs' || ans.bentuk_soal === 'yt')) {
      jwb = jwb[0];
    }
    return {
      nomor_soal: Number(ans.nomor_soal),
      bentuk_soal: ans.bentuk_soal || 'pg',
      jawaban: jwb
    };
  });

  const resultData: GeminiOmrResultData = {
    npsn: String(parsed.npsn || "").replace(/\D/g, "").slice(0, 8),
    nisn: String(parsed.nisn || "").replace(/\D/g, "").slice(0, 10),
    id_mapel: String(parsed.id_mapel || "").replace(/\D/g, "").padStart(2, '0').slice(-2),
    kode_tes: String(parsed.kode_tes || "").replace(/\D/g, "").padStart(2, '0').slice(-2),
    nama_siswa: parsed.nama_siswa ? String(parsed.nama_siswa).trim() : undefined,
    kelas: parsed.kelas ? String(parsed.kelas).trim() : undefined,
    no_peserta: parsed.no_peserta ? String(parsed.no_peserta).trim() : undefined,
    tanggal_ujian: parsed.tanggal_ujian ? String(parsed.tanggal_ujian).trim() : undefined,
    pernyataan_kejujuran: parsed.pernyataan_kejujuran ? String(parsed.pernyataan_kejujuran).trim() : undefined,
    tanda_tangan_terisi: typeof parsed.tanda_tangan_terisi === 'boolean' ? parsed.tanda_tangan_terisi : undefined,
    confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.95,
    scan_notes: parsed.scan_notes || `Dipindai dengan model ${selectedModel} (Client SDK).`,
    answers: formattedAnswers,
    scannedAt: Date.now(),
  };

  return {
    success: true,
    data: resultData
  };
}
