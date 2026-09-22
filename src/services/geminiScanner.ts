import type { OmrTemplate } from '../db/database';

export interface GeminiOmrResultData {
  npsn: string;
  nisn: string;
  id_mapel: string;
  kode_tes: string;
  nama_siswa?: string;
  confidence_score: number;
  scan_notes: string;
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

export async function scanWithGemini(
  imageDataUrl: string,
  template?: OmrTemplate
): Promise<GeminiOmrScanResponse> {
  const response = await fetch('/api/gemini/omr-scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image: imageDataUrl,
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
    throw new Error(errorData.error || `Gagal menghubungi server Gemini (${response.status})`);
  }

  const result: GeminiOmrScanResponse = await response.json();
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Pemindaian Gemini tidak mengembalikan data yang valid.');
  }

  return result;
}

export async function checkGeminiHealth(): Promise<{ status: string; hasGeminiKey: boolean }> {
  try {
    const res = await fetch('/api/gemini/health');
    if (!res.ok) return { status: 'error', hasGeminiKey: false };
    return await res.json();
  } catch {
    return { status: 'offline', hasGeminiKey: false };
  }
}
