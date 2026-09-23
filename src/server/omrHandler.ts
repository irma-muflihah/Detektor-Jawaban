import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
import type { Request, Response } from "express";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi. Silakan tambahkan API key di menu Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface OMRScanRequestBody {
  image: string; // Base64 data or data URL
  mimeType?: string;
  template?: {
    id?: string;
    name?: string;
    blocks?: Array<{
      type: string;
      title: string;
      direction?: string;
      cols?: number;
      rows?: number;
      options?: string[];
      startNum?: number;
      prefillValue?: any;
    }>;
  };
}

function sendJson(res: any, statusCode: number, data: any) {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    return res.status(statusCode).json(data);
  }
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function getRequestBody(req: any): Promise<any> {
  if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
    return req.body;
  }
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: any) => {
      data += chunk;
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(new Error("Format JSON body tidak valid."));
      }
    });
    req.on('error', reject);
  });
}

function isHighDemandOrTransientError(err: any): boolean {
  if (!err) return false;
  const str = String(err.message || err.toString() || '');
  const code = err.code || err.status || (err.error && err.error.code);
  return (
    code === 503 ||
    code === 429 ||
    code === 'UNAVAILABLE' ||
    str.includes('503') ||
    str.includes('429') ||
    str.includes('high demand') ||
    str.includes('spikes in demand') ||
    str.includes('UNAVAILABLE') ||
    str.includes('RESOURCE_EXHAUSTED') ||
    str.includes('overloaded')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface ModelCandidate {
  name: string;
  thinkingLevel?: ThinkingLevel;
}

// Fallback chain in case of temporary high demand spikes (503 UNAVAILABLE)
const CANDIDATE_MODELS: ModelCandidate[] = [
  { name: 'gemini-3.8-flash', thinkingLevel: ThinkingLevel.LOW },
  { name: 'gemini-3.1-pro-preview', thinkingLevel: ThinkingLevel.LOW },
  { name: 'gemini-3.1-flash-lite', thinkingLevel: ThinkingLevel.MINIMAL },
  { name: 'gemini-flash-latest' },
];

export async function handleOmrScan(req: Request | any, res: Response | any) {
  try {
    const body = await getRequestBody(req);
    const { image, mimeType: providedMime, template } = (body || {}) as OMRScanRequestBody;

    if (!image) {
      return sendJson(res, 400, {
        success: false,
        error: "Gambar LJK wajib disertakan (format base64)."
      });
    }

    // Extract base64 payload & detect MIME
    let base64Data = image;
    let mimeType = providedMime || "image/jpeg";

    if (image.startsWith("data:")) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const ai = getGeminiClient();

    // Prepare template description context for Gemini
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
        npsn: {
          type: Type.STRING,
          description: "Nomor Pokok Sekolah Nasional (8 digit angka)",
        },
        nisn: {
          type: Type.STRING,
          description: "Nomor Induk Siswa Nasional (10 digit angka)",
        },
        id_mapel: {
          type: Type.STRING,
          description: "ID Mapel (2 digit angka)",
        },
        kode_tes: {
          type: Type.STRING,
          description: "Kode Tes (2 digit angka)",
        },
        nama_siswa: {
          type: Type.STRING,
          description: "Nama lengkap siswa dari tulisan tangan",
        },
        kelas: {
          type: Type.STRING,
          description: "Kelas siswa dari tulisan tangan (misal: '8C')",
        },
        no_peserta: {
          type: Type.STRING,
          description: "Nomor peserta ujian dari tulisan tangan (misal: '01-8C-14')",
        },
        tanggal_ujian: {
          type: Type.STRING,
          description: "Tanggal pelaksanaan ujian dari tulisan tangan (misal: '23 - September - 2026')",
        },
        pernyataan_kejujuran: {
          type: Type.STRING,
          description: "Isi kalimat tulisan tangan pada kotak pernyataan kejujuran",
        },
        tanda_tangan_terisi: {
          type: Type.BOOLEAN,
          description: "Apakah kotak tanda tangan terisi goresan tanda tangan/paraf (true/false)",
        },
        confidence_score: {
          type: Type.NUMBER,
          description: "Skor keyakinan pemindaian antara 0.0 sampai 1.0",
        },
        scan_notes: {
          type: Type.STRING,
          description: "Catatan hasil pemindaian dan evaluasi visual LJK",
        },
        answers: {
          type: Type.ARRAY,
          description: "Daftar jawaban per butir soal",
          items: {
            type: Type.OBJECT,
            properties: {
              nomor_soal: {
                type: Type.INTEGER,
                description: "Nomor soal",
              },
              bentuk_soal: {
                type: Type.STRING,
                description: "Bentuk soal: pg, kompleks, bs, bs3, yt, yt3, skala, atau jodoh",
              },
              jawaban: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Daftar opsi yang dihitamkan (misal ['A'] atau ['A','B'] atau ['B','S','S'])",
              },
            },
            required: ["nomor_soal", "bentuk_soal", "jawaban"],
          },
        },
      },
      required: ["npsn", "nisn", "id_mapel", "kode_tes", "answers"],
    };

    let lastError: any = null;
    let responseText: string | undefined;
    let successfulModelName: string = '';

    // Attempt generation through fallback models with backoff
    for (let mIdx = 0; mIdx < CANDIDATE_MODELS.length; mIdx++) {
      const candidate = CANDIDATE_MODELS[mIdx];
      const maxRetriesForCandidate = 2;

      for (let attempt = 1; attempt <= maxRetriesForCandidate; attempt++) {
        try {
          const config: any = {
            responseMimeType: "application/json",
            responseSchema,
          };

          if (candidate.thinkingLevel) {
            config.thinkingConfig = { thinkingLevel: candidate.thinkingLevel };
          }

          const response = await ai.models.generateContent({
            model: candidate.name,
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
            config,
          });

          responseText = response.text;
          if (responseText) {
            successfulModelName = candidate.name;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isTransient = isHighDemandOrTransientError(err);
          console.warn(`[Gemini OMR] Model ${candidate.name} (Percobaan ${attempt}/${maxRetriesForCandidate}) gagal: ${err.message || err}`);

          if (isTransient && attempt < maxRetriesForCandidate) {
            // Brief jittered pause before retrying
            await sleep(800 * attempt + Math.floor(Math.random() * 400));
          } else {
            // Move immediately to next fallback candidate
            break;
          }
        }
      }

      if (responseText) {
        break;
      }
    }

    if (!responseText) {
      if (lastError && isHighDemandOrTransientError(lastError)) {
        throw new Error(
          "Layanan Gemini AI sedang mengalami lonjakan antrean server sementara (503 Service Unavailable). " +
          "Sistem telah mencoba beralih ke model cadangan. Silakan coba beberapa saat lagi atau gunakan mode pemindaian OpenCV lokal."
        );
      }
      throw lastError || new Error("Tidak ada respon teks dari Gemini AI.");
    }

    // Strip markdown formatting if returned
    let cleanJsonStr = responseText.trim();
    if (cleanJsonStr.startsWith("```")) {
      cleanJsonStr = cleanJsonStr.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '').trim();
    }

    const parsedData = JSON.parse(cleanJsonStr);

    // Format answers so they integrate directly with DEJAWAB's database structure
    const formattedAnswers = (parsedData.answers || []).map((ans: any) => {
      const bType = ans.bentuk_soal || 'pg';
      let formattedJawaban: any = ans.jawaban;

      if (bType === 'kompleks' || bType === 'bs3' || bType === 'yt3') {
        formattedJawaban = Array.isArray(ans.jawaban) ? ans.jawaban : [];
      } else {
        // Single choice: if array with elements, take first, else '-'
        if (Array.isArray(ans.jawaban) && ans.jawaban.length > 0) {
          formattedJawaban = ans.jawaban[0];
        } else if (typeof ans.jawaban === 'string' && ans.jawaban.trim()) {
          formattedJawaban = ans.jawaban.trim();
        } else {
          formattedJawaban = '-';
        }
      }

      return {
        nomor_soal: Number(ans.nomor_soal),
        bentuk_soal: bType,
        jawaban: formattedJawaban,
      };
    });

    // Sanitization of identity fields: clean any unwanted spaces
    const cleanNpsn = (parsedData.npsn || "").replace(/\D/g, "") || (template?.blocks?.find(b => b.type === 'identity_npsn')?.prefillValue || "20301942");
    const cleanNisn = (parsedData.nisn || "").replace(/\D/g, "") || "0000000000";
    const cleanMapel = (parsedData.id_mapel || "").replace(/\D/g, "").padStart(2, "0").slice(0, 2) || "01";
    const cleanTes = (parsedData.kode_tes || "").replace(/\D/g, "").padStart(2, "0").slice(0, 2) || "01";

    const baseNotes = parsedData.scan_notes || "Dipindai oleh Gemini AI Vision";
    const finalNotes = successfulModelName !== 'gemini-3.8-flash' 
      ? `${baseNotes} (Model: ${successfulModelName})`
      : baseNotes;

    return sendJson(res, 200, {
      success: true,
      data: {
        npsn: cleanNpsn,
        nisn: cleanNisn,
        id_mapel: cleanMapel,
        kode_tes: cleanTes,
        nama_siswa: parsedData.nama_siswa || "",
        kelas: parsedData.kelas || "",
        no_peserta: parsedData.no_peserta || "",
        tanggal_ujian: parsedData.tanggal_ujian || "",
        pernyataan_kejujuran: parsedData.pernyataan_kejujuran || "",
        tanda_tangan_terisi: Boolean(parsedData.tanda_tangan_terisi),
        confidence_score: parsedData.confidence_score ?? 0.95,
        scan_notes: finalNotes,
        answers: formattedAnswers,
        scannedAt: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("Gemini OMR scan error:", error);
    const statusCode = isHighDemandOrTransientError(error) ? 503 : 500;
    return sendJson(res, statusCode, {
      success: false,
      error: error.message || "Terjadi kesalahan saat memproses LJK dengan Gemini AI.",
    });
  }
}

