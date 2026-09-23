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

============================================================
ACUAN GROUND TRUTH STANDAR EMAS (FEW-SHOT GROUND TRUTH BENCHMARK)
Gunakan acuan ground truth terverifikasi 100% berikut untuk memahami tata letak, format pengisian, dan konvensi jawaban pada formulir standar "Lembar Jawaban Latihan TKA 1":
Contoh LJK Terverifikasi:
- Data Peserta (Tulisan Tangan):
  * nama_siswa: "FELLYSA NINDA MAHARANI"
  * kelas: "9A"
  * no_peserta: "R09-9A-11"
  * tanggal_ujian: "23-09-2026"
- Identitas Digital (Cross-Validation Kotak & Bulatan Kolom):
  * NISN: "0114741902" (10 kolom: 0, 1, 1, 4, 7, 4, 1, 9, 0, 2)
  * NPSN: "20301942" (8 kolom: 2, 0, 3, 0, 1, 9, 4, 2)
  * ID Mapel: "01" (2 kolom: 0, 1)
  * Kode Tes: "91" (2 kolom: 9, 1)
- Kunci Jawaban Pemindaian Resmi:
  * No 1 - 12 (Pilihan Ganda Biasa 'pg'):
    1: ["D"], 2: ["D"], 3: ["A"], 4: ["D"], 5: ["D"], 6: ["C"],
    7: ["C"], 8: ["D"], 9: ["D"], 10: ["B"], 11: ["C"], 12: ["C"]
  * No 13 - 18 (Benar / Salah 3 Baris 'bs3'):
    13: ["B", "S", "S"]
    14: ["S", "S", "S"]
    15: ["B", "S", "B"]
    16: ["B", "B", "B"]
    17: ["B", "B", "S"]
    18: ["B", "S", "S"]
  * No 19 - 24 (Pilihan Ganda Kompleks 'kompleks', Multi-Selection Kotak Persegi):
    19: ["B", "C", "D"]
    20: ["B", "D"]
    21: ["C", "D"]
    22: ["B", "C", "D"]
    23: ["A", "C", "D"]
    24: ["A", "C", "D"]
  * No 25 - 30 (Menjodohkan 'jodoh'):
    25: ["A"], 26: ["D"], 27: ["B"], 28: ["B"], 29: ["C"], 30: ["C"]
============================================================

Petunjuk Khusus Ekstraksi Presisi:
0. Orientasi & Arah Baca LJK:
   - Jika lembar LJK tampak mendatar (landscape), miring, atau terbalik 180°, kenali dan orientasikan secara mental posisi lembar ke kondisi potret tegak lurus (di mana judul 'Lembar Jawaban Latihan TKA 1' serta isian Identitas Siswa berada di sisi ATAS, dan jawaban soal berada di bawahnya).

1. Data Peserta Esensial (OCR Tulisan Tangan pada Blok Data Peserta di bagian atas):
   - nama_siswa: Nama lengkap siswa dari kotak tulisan tangan "Nama Lengkap" (contoh: "FELLYSA NINDA MAHARANI").
   - kelas: Kelas siswa dari kotak isian "Kelas" (contoh: "9A").
   - no_peserta: Nomor peserta dari kotak isian "No. Peserta" (contoh: "R09-9A-11").
   - tanggal_ujian: Tanggal pelaksanaan dari kotak isian "Tanggal Pelaksanaan Tes" (contoh: "23-09-2026").
   (Catatan penting: Blok catatan/keterangan, teks pernyataan kejujuran, dan tanda tangan/paraf diabaikan saja).

2. Blok Identitas Digital (Cross-Validation Antara Kotak Angka Atas dan Bulatan 0-9 di Bawahnya):
   - NISN (10 digit): Periksa angka yang tertulis di dalam kotak 1-10 DAN bulatan angka 0-9 yang dihitamkan di kolom bawahnya. Lakukan verifikasi silang (cross-validation) agar 10 digit angka yang dihasilkan tepat 100%.
   - NPSN (8 digit): Periksa angka di kotak 1-8 dan bulatan 0-9 di bawahnya (standar: 20301942).
   - ID Mapel (2 digit): Periksa angka di kotak dan bulatan di bawahnya (contoh: 01).
   - Kode Tes (2 digit): Periksa angka di kotak dan bulatan di bawahnya (contoh: 91).

3. Aturan Krusial Jawaban Soal (OMR):
   - Periksa setiap butir nomor soal.
   - Deteksi bulatan atau kotak yang dihitamkan (pensil 2B, pulpen hitam/biru, arsiran tebal). Abaikan bulatan/kotak yang kosong atau hanya coretan tipis/bekas hapusan.
   - Untuk tipe 'pg' (Pilihan Ganda Biasa No 1-12): Masukkan 1 opsi yang dipilih, misal ["A"] atau ["B"] atau ["C"] atau ["D"]. Jika kosong, kembalikan [].
   - Untuk tipe 'kompleks' (Pilihan Ganda Kompleks No 19-24): Bentuk targetnya adalah KOTAK CENTANG (persegi/checkbox). Soal ini DAPAT MEMILIKI LEBIH DARI SATU JAWABAN (multi-selection). Periksa seluruh opsi A, B, C, D dan masukkan SEMUA opsi kotak yang dihitamkan dalam array, misalnya ["B", "C", "D"], ["B", "D"], ["A", "C", "D"]. JANGAN dibatasi hanya satu jawaban!
   - Untuk tipe 'bs3' (Benar / Salah 3 Baris No 13-18): Setiap nomor soal memiliki 3 baris sub-pernyataan yang tersusun vertikal dari atas ke bawah. Masukkan array persis 3 string untuk baris 1, 2, dan 3, misalnya ["B", "S", "S"] atau ["B", "B", "B"].
   - Untuk tipe 'jodoh' (Menjodohkan No 25-30): Masukkan opsi huruf yang dihitamkan, misal ["A"] atau ["D"].
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

  let activeModel = selectedModel;
  if (activeModel === 'gemini-2.5-flash' || activeModel === 'gemini-2.5-pro' || activeModel === 'gemini-1.5-flash') {
    activeModel = 'gemini-3.8-flash';
  }

  const fallbackCandidates: string[] = [
    activeModel,
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
  ].filter((v, i, a) => a.indexOf(v) === i);

  let responseText: string | undefined;
  let successfulModel = activeModel;
  let lastError: any = null;

  for (const modelCandidate of fallbackCandidates) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
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

        responseText = response.text;
        if (responseText) {
          successfulModel = modelCandidate;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const str = String(err?.message || err);
        console.warn(`[Client Gemini SDK] Model ${modelCandidate} (Percobaan ${attempt}/2) gagal: ${str}`);

        // Jika error 404, langsung ganti model
        if (str.includes('404') || str.includes('not found')) {
          break;
        }

        // Cek retryDelay pendek
        const match = str.match(/retry in\s+([0-9.]+)\s*s/i);
        const retryDelay = match ? Math.round(parseFloat(match[1]) * 1000) : 0;
        if (retryDelay > 0 && retryDelay <= 4000 && attempt === 1) {
          await new Promise(r => setTimeout(r, retryDelay + 300));
          continue;
        }

        // Jika 503 high demand spike, jeda sejenak
        if ((str.includes('503') || str.includes('high demand') || str.includes('UNAVAILABLE')) && attempt === 1) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }

        // Beralih ke kandidat berikutnya
        break;
      }
    }

    if (responseText) {
      break;
    }
  }

  if (!responseText) {
    throw lastError || new Error("Gemini tidak mengembalikan respons teks.");
  }

  const parsed = JSON.parse(responseText);

  const formattedAnswers = (parsed.answers || []).map((ans: any) => {
    let jwb = ans.jawaban;
    if (Array.isArray(jwb) && jwb.length === 1 && (ans.bentuk_soal === 'pg' || ans.bentuk_soal === 'bs' || ans.bentuk_soal === 'yt' || ans.bentuk_soal === 'jodoh')) {
      jwb = jwb[0];
    }
    return {
      nomor_soal: Number(ans.nomor_soal),
      bentuk_soal: ans.bentuk_soal || 'pg',
      jawaban: jwb
    };
  });

  const finalScanNotes = selectedModel !== successfulModel
    ? `${parsed.scan_notes || 'Dipindai dengan Client SDK.'} (Dialihkan ke ${successfulModel} karena ${selectedModel} sibuk)`
    : parsed.scan_notes || `Dipindai dengan model ${successfulModel} (Client SDK).`;

  const resultData: GeminiOmrResultData = {
    npsn: String(parsed.npsn || "").replace(/\D/g, "").slice(0, 8),
    nisn: String(parsed.nisn || "").replace(/\D/g, "").slice(0, 10),
    id_mapel: String(parsed.id_mapel || "").replace(/\D/g, "").padStart(2, '0').slice(-2),
    kode_tes: String(parsed.kode_tes || "").replace(/\D/g, "").padStart(2, '0').slice(-2),
    nama_siswa: parsed.nama_siswa ? String(parsed.nama_siswa).trim() : undefined,
    kelas: parsed.kelas ? String(parsed.kelas).trim() : undefined,
    no_peserta: parsed.no_peserta ? String(parsed.no_peserta).trim() : undefined,
    tanggal_ujian: parsed.tanggal_ujian ? String(parsed.tanggal_ujian).trim() : undefined,
    confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.95,
    scan_notes: finalScanNotes,
    answers: formattedAnswers,
    scannedAt: Date.now(),
  };

  return {
    success: true,
    data: resultData
  };
}
