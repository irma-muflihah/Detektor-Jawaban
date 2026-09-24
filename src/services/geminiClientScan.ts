import { GoogleGenAI, Type } from "@google/genai";
import type { OmrTemplate } from "../db/database";
import type { GeminiOmrResultData, GeminiOmrScanResponse } from "./geminiScanner";
import { getStoredModel, DEFAULT_GEMINI_MODEL } from "./geminiKeyService";

function buildDetailedRoiContext(template?: OmrTemplate): string {
  if (!template) return "";

  const blocksInfo = (template.blocks || []).map((b) => {
    let detail = `- Blok [${b.title || b.type}] (Tipe: ${b.type}, ID: ${b.id}):\n`;
    if (b.type === 'handwritten_identity') {
      detail += `  * Area: Bagian atas LJK (y ≈ 135 - 330px)\n`;
      detail += `  * Isian: Kotak Nama Siswa, Kelas, No. Peserta, Tanggal Ujian, Pernyataan Kejujuran, Tanda Tangan.`;
    } else if (b.type === 'identity_nisn') {
      detail += `  * Area: Kolom identitas kiri (x ≈ 90px, y ≈ 400 - 740px)\n`;
      detail += `  * Struktur: 10 kolom digit (0-9). Kotak angka di atas, bulatan hitam vertikal 0-9 di bawahnya.`;
    } else if (b.type === 'identity_npsn') {
      detail += `  * Area: Kolom identitas tengah (x ≈ 442px, y ≈ 400 - 740px)\n`;
      detail += `  * Struktur: 8 kolom digit (0-9). Nilai standar NPSN (SMPN 2 Kemranjen): "20301942".`;
    } else if (b.type === 'identity_subject') {
      detail += `  * Area: Kolom ID Mapel (x ≈ 725px, y ≈ 400 - 740px), 2 kolom digit (0-9).`;
    } else if (b.type === 'identity_test') {
      detail += `  * Area: Kolom Kode Tes (x ≈ 820px, y ≈ 400 - 740px), 2 kolom digit (0-9).`;
    } else if (b.type === 'biasa') {
      const endNum = (b.startNum || 1) + (b.rows || 1) - 1;
      detail += `  * Area: Kolom kiri lembar (x ≈ 90px, y ≈ 785 - 1155px)\n`;
      detail += `  * Butir Soal: No. ${b.startNum || 1} sampai No. ${endNum} (Pilihan Ganda Bulat 4 opsi: A, B, C, D).\n`;
      detail += `  * Format Jawaban: 1 huruf terpilih per butir soal, contoh ["A"] atau ["C"]. Kosong jika tidak dijawab.`;
    } else if (b.type === 'bs3') {
      const endNum = (b.startNum || 1) + (b.rows || 1) - 1;
      detail += `  * Area: Kolom tengah lembar (x ≈ 320px atau x ≈ 495px, y ≈ 785 - 1065px)\n`;
      detail += `  * Butir Soal: No. ${b.startNum || 1} sampai No. ${endNum} (Benar / Salah 3 Baris Pernyataan per butir).\n`;
      detail += `  * Format Jawaban: Tepat 3 string dalam array per nomor soal, misalnya ["B", "S", "B"].`;
    } else if (b.type === 'kompleks') {
      const endNum = (b.startNum || 1) + (b.rows || 1) - 1;
      detail += `  * Area: Kolom kanan lembar (x ≈ 700px, y ≈ 785 - 975px)\n`;
      detail += `  * Butir Soal: No. ${b.startNum || 1} sampai No. ${endNum} (Pilihan Ganda Kompleks - KOTAK CENTANG PERSEGI A, B, C, D).\n`;
      detail += `  * ATURAN KRUSIAL KOTAK: Huruf bawaan di dalam kotak putih adalah KOSONG. Hanya kotak yang DIHITAMKAN/DIARSIR PEKAT pensil yang menjadi jawaban, contoh ["A", "D"] atau ["B"]. Jangan pernah menjawab semua ["A","B","C","D"] kecuali seluruh kotak benar-benar hitam pekat!`;
    } else if (b.type === 'jodoh') {
      const endNum = (b.startNum || 1) + (b.rows || 1) - 1;
      detail += `  * Area: Bagian bawah lembar (x ≈ 90px atau x ≈ 320px, y ≈ 1194 - 1294px)\n`;
      detail += `  * Butir Soal: No. ${b.startNum || 1} sampai No. ${endNum} (Menjodohkan 4 opsi A, B, C, D).`;
    } else if (b.type === 'teks_kustom') {
      detail += `  * Area: Kanan bawah (x ≈ 565px, y ≈ 1194 - 1309px), kotak catatan petunjuk pelaksanaan ujian.`;
    }
    return detail;
  }).join('\n');

  return `
SPESIFIKASI DETEKSI ROI & TATA LETAK LJK (Lembar Jawaban Latihan TKA 1):
Nama Lembar: ${template.name || 'Lembar Jawaban Latihan TKA 1'}
Dimensi Kanvas Acuan: 1000 x 1414 piksel (Rasio Standar A4 / F4)
Fiducial Penanda 4 Sudut: Kiri Atas (50, 50), Kanan Atas (950, 50), Kiri Bawah (50, 1364), Kanan Bawah (950, 1364).

PANDUAN ROI PER BLOK ELEMEN:
${blocksInfo}
`;
}

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

  const templateContext = buildDetailedRoiContext(template);

  const promptText = `Anda adalah asisten AI spesialis Optical Mark Recognition (OMR) dan Optical Character Recognition (OCR) presisi tinggi untuk Lembar Jawab Komputer (LJK) Indonesia.
Tugas Anda: Pindai gambar LJK terlampir dan ekstrak seluruh data peserta (tulisan tangan), identitas digital (kotak angka dan bulatan hitam), serta jawaban soal yang dihitamkan dengan sangat akurat dan objektif sesuai citra aktual.

${templateContext}

Petunjuk Khusus Ekstraksi Presisi:
0. Orientasi & Arah Baca LJK:
   - Jika lembar LJK tampak mendatar (landscape), miring, atau terbalik 180°, kenali dan orientasikan posisi lembar ke kondisi potret tegak lurus (di mana judul/identitas siswa berada di sisi ATAS, dan jawaban soal berada di bawahnya).

1. Data Peserta Esensial (OCR Tulisan Tangan pada Blok Data Peserta di bagian atas):
   - nama_siswa: Nama lengkap siswa dari kotak tulisan tangan "Nama Lengkap" atau "Nama Siswa".
   - kelas: Kelas siswa dari kotak isian "Kelas".
   - no_peserta: Nomor peserta dari kotak isian "No. Peserta".
   - tanggal_ujian: Tanggal pelaksanaan dari kotak isian tanggal tes.
   (Catatan: Teks pernyataan kejujuran dan tanda tangan/paraf diabaikan).

2. Blok Identitas Digital (Cross-Validation Antara Kotak Angka Atas dan Bulatan 0-9 di Bawahnya):
   - NISN: Periksa angka yang tertulis di dalam kotak DAN bulatan angka 0-9 yang dihitamkan di kolom bawahnya secara silang untuk akurasi 100%.
   - NPSN: Periksa angka di kotak dan bulatan 0-9 di bawahnya.
   - ID Mapel: Periksa angka di kotak dan bulatan di bawahnya.
   - Kode Tes: Periksa angka di kotak dan bulatan di bawahnya.

3. Aturan Jawaban Soal (OMR):
   - Periksa setiap butir nomor soal yang ada pada lembar LJK secara visual objektif dan teliti.
   - Deteksi bulatan atau kotak yang DIHITAMKAN/DIARSIR TEBAL menggunakan pensil atau pulpen hitam.
   - PENTING: Abaikan bulatan atau kotak yang KOSONG (berlatar belakang kertas putih bersih) atau bekas hapusan tipis.

   ★ ATURAN KHUSUS & KRUSIAL UNTUK TIPE 'kompleks' (PILIHAN GANDA KOMPLEKS - KOTAK PERSEGI):
   - Pada lembar cetak LJK fisik asli, SETIAP kotak centang yang KOSONG memiliki cetakan huruf A, B, C, atau D di bagian dalamnya dengan LATAR BELAKANG PUTIH BERSIH.
   - PERINGATAN: Huruf cetak bawaan di dalam kotak putih adalah KOTAK KOSONG (TIDAK DIPILIH). JANGAN SEKALI-KALI menganggap kotak berlatar putih sebagai jawaban terpilih!
   - Kotak dinyatakan DIJAWAB/DIPILIH HANYA JIKA kotak tersebut diarsir/dihitamkan PEKAT dengan pensil atau pulpen sehingga latarnya menjadi hitam pekat atau hurufnya tertutup arsir hitam.
   - Bandingkan kontras visual antar-kotak pada baris nomor soal yang sama:
     * Jika hanya kotak D yang dihitamkan pensil pekat, sedangkan kotak A, B, C berlatar putih bersih dengan huruf cetak biasa -> jawaban HANYA ["D"], BUKAN ["A", "B", "C", "D"].
     * Jika kotak A dan B dihitamkan pensil pekat, sedangkan kotak C dan D berlatar putih bersih -> jawaban HANYA ["A", "B"], BUKAN ["A", "B", "C", "D"].
     * Jika hanya kotak A yang dihitamkan pensil pekat -> jawaban HANYA ["A"].
     * DILARANG KERAS mengembalikan semua opsi ["A", "B", "C", "D"] kecuali jika keempat kotak tersebut benar-benar dihitamkan pekat oleh peserta ujian!

   - Untuk tipe 'pg' (Pilihan Ganda Biasa): Berbentuk bulatan lingkaran. Masukkan 1 opsi huruf yang dihitamkan, misal ["A"] atau ["B"] atau ["C"] atau ["D"]. Jika kosong, kembalikan [].
   - Untuk tipe 'bs3' (Benar / Salah 3 Baris): Memiliki 3 baris sub-pernyataan dari atas ke bawah. Masukkan array persis 3 string untuk baris 1, 2, dan 3, misalnya ["B", "S", "S"] atau ["B", "B", "B"].
   - Untuk tipe 'jodoh' (Menjodohkan): Masukkan opsi huruf yang dihitamkan, misal ["A"] atau ["D"].
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
    'gemini-3.1-pro-preview',
    'gemini-3.1-flash-lite',
    'gemini-flash-latest',
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
