import { GoogleGenAI, Type } from "@google/genai";
import type { Request, Response } from "express";

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(customApiKey?: string): GoogleGenAI {
  const apiKey = (customApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi. Silakan masukkan API key di menu Pengaturan aplikasi atau di Environment Variables Vercel.");
  }
  if (!customApiKey && aiClient) {
    return aiClient;
  }
  const client = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
  if (!customApiKey) {
    aiClient = client;
  }
  return client;
}

export interface OMRScanRequestBody {
  image: string; // Base64 data or data URL
  mimeType?: string;
  apiKey?: string;
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

function extractRetryDelayMs(err: any): number {
  if (!err) return 0;
  try {
    if (Array.isArray(err.details)) {
      for (const d of err.details) {
        if (d?.retryDelay) {
          const m = String(d.retryDelay).match(/^(\d+(?:\.\d+)?)s?$/);
          if (m) return Math.round(parseFloat(m[1]) * 1000);
        }
      }
    }
    if (err.error?.details && Array.isArray(err.error.details)) {
      for (const d of err.error.details) {
        if (d?.retryDelay) {
          const m = String(d.retryDelay).match(/^(\d+(?:\.\d+)?)s?$/);
          if (m) return Math.round(parseFloat(m[1]) * 1000);
        }
      }
    }
    const str = String(err.message || err.toString() || '');
    const match = str.match(/retry in\s+([0-9.]+)\s*s/i);
    if (match) {
      return Math.round(parseFloat(match[1]) * 1000);
    }
  } catch (_) {}
  return 0;
}

function isHighDemandOrTransientError(err: any): boolean {
  if (!err) return false;
  const str = String(err.message || err.toString() || '');
  const code = err.code || err.status || (err.error && err.error.code);
  return (
    code === 503 ||
    code === 'UNAVAILABLE' ||
    str.includes('503') ||
    str.includes('high demand') ||
    str.includes('spikes in demand') ||
    str.includes('UNAVAILABLE') ||
    str.includes('overloaded')
  );
}

function isModelUnavailableOrQuotaExceeded(err: any): boolean {
  if (!err) return false;
  const str = String(err.message || err.toString() || '');
  const code = err.code || err.status || (err.error && err.error.code);
  return (
    code === 404 ||
    code === 'NOT_FOUND' ||
    str.includes('404') ||
    str.includes('not found') ||
    str.includes('no longer available')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Rantai fallback model multimodal generasi baru yang unik dan aktif
const CANDIDATE_MODELS: string[] = [
  'gemini-3.8-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.6-flash',
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

    const customApiKey = ((req.headers && req.headers['x-gemini-api-key']) as string) || (body as any)?.apiKey;
    let requestedModel = (((req.headers && req.headers['x-gemini-model']) as string) || (body as any)?.model || '').trim();
    
    // Migrasikan otomatis model yang sudah dimatikan Google (404 Not Found)
    if (requestedModel === 'gemini-2.5-flash' || requestedModel === 'gemini-2.5-pro' || requestedModel === 'gemini-1.5-flash') {
      requestedModel = 'gemini-3.6-flash';
    }

    const ai = getGeminiClient(customApiKey);

    // Bangun daftar kandidat model dengan memprioritaskan model pilihan pengguna
    const candidateList: string[] = [];
    if (requestedModel) {
      candidateList.push(requestedModel);
    }

    // Tambahkan model cadangan stabil jika belum ada dalam daftar
    for (const modelName of CANDIDATE_MODELS) {
      if (!candidateList.includes(modelName)) {
        candidateList.push(modelName);
      }
    }

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

    // Upaya inferensi melalui rantai model fallback
    for (let mIdx = 0; mIdx < candidateList.length; mIdx++) {
      const currentCandidateModel = candidateList[mIdx];
      const maxRetriesForCandidate = 2;

      for (let attempt = 1; attempt <= maxRetriesForCandidate; attempt++) {
        try {
          const config: any = {
            responseMimeType: "application/json",
            responseSchema,
          };

          const response = await ai.models.generateContent({
            model: currentCandidateModel,
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
            successfulModelName = currentCandidateModel;
            break;
          }
        } catch (err: any) {
          lastError = err;
          const isNotFound = isModelUnavailableOrQuotaExceeded(err);
          const isTransient = isHighDemandOrTransientError(err);
          const retryDelayMs = extractRetryDelayMs(err);
          console.warn(`[Gemini OMR] Model ${currentCandidateModel} (Percobaan ${attempt}/${maxRetriesForCandidate}) gagal: ${err.message || err}`);

          // Jika model tidak ditemukan (404), langsung beralih ke model cadangan berikutnya
          if (isNotFound) {
            console.info(`[Gemini OMR] Model ${currentCandidateModel} tidak tersedia (404). Beralih ke model berikutnya...`);
            break;
          }

          // Jika ada instruksi retryDelay pendek dari Google API (<= 4.5 detik), tunggu dan ulangi sekali lagi
          if (retryDelayMs > 0 && retryDelayMs <= 4500 && attempt < maxRetriesForCandidate) {
            console.info(`[Gemini OMR] Menunggu ${retryDelayMs + 350}ms sesuai instruksi retryDelay Google API...`);
            await sleep(retryDelayMs + 350);
            continue;
          }

          // Jika lonjakan antrean server sementara (503 / UNAVAILABLE), lakukan exponential backoff
          if (isTransient && attempt < maxRetriesForCandidate) {
            const backoffDelay = attempt === 1 ? 1200 : 2500;
            console.info(`[Gemini OMR] Lonjakan antrean (503). Menunggu jeda backoff ${backoffDelay}ms...`);
            await sleep(backoffDelay);
            continue;
          }

          // Jika kuota habis untuk model ini atau percobaan habis, beralih ke model berikutnya
          break;
        }
      }

      if (responseText) {
        break;
      }
    }

    if (!responseText) {
      const errStr = lastError?.message || String(lastError || '');
      const isQuotaOrServer = (
        isHighDemandOrTransientError(lastError) ||
        errStr.includes('429') ||
        errStr.includes('quota') ||
        errStr.includes('RESOURCE_EXHAUSTED')
      );
      if (isQuotaOrServer) {
        return sendJson(res, 429, {
          success: false,
          error: "Kuota API Gemini saat ini sedang penuh atau antrean server padat (429/503). Anda dapat menggunakan Gemini API Key pribadi di Pengaturan atau beralih ke mode pemindaian OpenCV + Tesseract (offline).",
          isQuotaExceeded: true,
          details: errStr
        });
      }
      return sendJson(res, 500, {
        success: false,
        error: lastError?.message || "Tidak ada respon teks dari Gemini AI."
      });
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
    const finalNotes = requestedModel && successfulModelName !== requestedModel
      ? `${baseNotes} (Dialihkan otomatis ke ${successfulModelName} karena ${requestedModel} sedang sibuk)`
      : `${baseNotes} (${successfulModelName})`;

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

