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
  'gemini-3.1-pro-preview',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
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

