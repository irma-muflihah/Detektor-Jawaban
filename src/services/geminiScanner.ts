import type { OmrTemplate } from '../db/database';
import { getStoredApiKey, getStoredModel } from './geminiKeyService';
import { scanDirectlyWithGeminiSdk } from './geminiClientScan';

export interface GeminiOmrResultData {
  npsn: string;
  nisn: string;
  id_mapel: string;
  kode_tes: string;
  nama_siswa?: string;
  kelas?: string;
  no_peserta?: string;
  tanggal_ujian?: string;
  confidence_score: number;
  scan_notes?: string;
  engine?: string;
  answers: Array<{
    nomor_soal: number;
    bentuk_soal: string;
    jawaban: string | string[];
  }>;
  scannedAt: number;
}

export interface GeminiOmrScanResponse {
  success: boolean;
  data?: GeminiOmrResultData;
  error?: string;
}

/**
 * Mengompres dan membatasi dimensi gambar agar transfer payload cepat dan terhindar dari 503 Gateway Timeouts.
 */
async function optimizeImageForAi(dataUrl: string, maxDimension = 1600): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:image')) return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width <= maxDimension && height <= maxDimension && dataUrl.length < 800_000) {
        return resolve(dataUrl);
      }
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.90));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function scanWithGemini(
  imageDataUrl: string,
  template?: OmrTemplate,
  overrideModel?: string
): Promise<GeminiOmrScanResponse> {
  const customApiKey = getStoredApiKey();
  const selectedModel = (overrideModel || getStoredModel()).trim();
  const optimizedDataUrl = await optimizeImageForAi(imageDataUrl);

  // 1. Coba terlebih dahulu melalui Proxy Backend (/api/gemini/omr-scan)
  let proxyFailed = false;
  let proxyErrorMessage = '';

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (customApiKey) {
      headers['x-gemini-api-key'] = customApiKey;
    }
    if (selectedModel) {
      headers['x-gemini-model'] = selectedModel;
    }

    const response = await fetch('/api/gemini/omr-scan', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        image: optimizedDataUrl,
        apiKey: customApiKey || undefined,
        model: selectedModel || undefined,
        template: template ? {
          id: template.id,
          name: template.name,
          blocks: template.blocks?.map(b => ({
            type: b.type,
            title: b.title,
            direction: b.direction,
            cols: b.cols,
            rows: b.rows,
            options: b.options,
            startNum: b.startNum,
            prefillValue: b.prefillValue
          }))
        } : undefined
      }),
    });

    // Periksa apakah server mengembalikan respon HTML (indikasi SPA fallback pada hosting statis Vercel)
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      proxyFailed = true;
      proxyErrorMessage = 'Proxy backend tidak tersedia (hosting statis).';
    } else if (response.ok) {
      const result: GeminiOmrScanResponse = await response.json();
      if (result.success && result.data) {
        return result;
      }
      throw new Error(result.error || 'Pemindaian Gemini tidak mengembalikan data yang valid.');
    } else {
      const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
      proxyErrorMessage = errorData.error || `HTTP ${response.status}`;
      // Jika error 404 (route tidak ada pada Vercel), izinkan fallback client-side
      if (response.status === 404) {
        proxyFailed = true;
      } else if (!customApiKey) {
        throw new Error(proxyErrorMessage);
      } else {
        proxyFailed = true;
      }
    }
  } catch (err: any) {
    proxyFailed = true;
    proxyErrorMessage = err.message || String(err);
  }

  // 2. Jika proxy server tidak tersedia atau gagal (misalnya pada Vercel static tanpa serverless),
  // dan pengguna telah memasukkan API Key di Pengaturan, jalankan pemindaian langsung di peramban
  if (proxyFailed && customApiKey) {
    console.info(`[Gemini Scanner] Menjalankan pemindaian langsung via Client SDK dengan model ${selectedModel}...`);
    try {
      return await scanDirectlyWithGeminiSdk(imageDataUrl, template, customApiKey, selectedModel);
    } catch (clientErr: any) {
      throw new Error(`Pemindaian langsung (${selectedModel}) gagal: ${clientErr.message || clientErr}`);
    }
  }

  // 3. Jika gagal dan belum ada API Key
  if (proxyFailed) {
    if (!customApiKey) {
      throw new Error(
        `Layanan Gemini belum siap: ${proxyErrorMessage}. ` +
        `Silakan buka menu Pengaturan (ikon gerigi) untuk memasukkan Gemini API Key Anda agar pemindaian dapat berjalan pada Vercel.`
      );
    }
    throw new Error(proxyErrorMessage || 'Gagal memindai dengan Gemini.');
  }

  throw new Error('Gagal menghubungi layanan Gemini.');
}

export async function checkGeminiHealth(): Promise<{ status: string; hasGeminiKey: boolean; source?: string }> {
  const customApiKey = getStoredApiKey();

  // Jika pengguna memiliki API key lokal, langsung anggap aktif
  if (customApiKey) {
    return { status: 'ok', hasGeminiKey: true, source: 'client' };
  }

  try {
    const res = await fetch('/api/gemini/health');
    if (!res.ok) return { status: 'error', hasGeminiKey: false };
    const data = await res.json();
    return {
      status: data.status || 'ok',
      hasGeminiKey: Boolean(data.hasGeminiKey),
      source: data.source || 'server'
    };
  } catch {
    return { status: 'offline', hasGeminiKey: false };
  }
}

