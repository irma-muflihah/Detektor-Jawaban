import Dexie, { type Table } from 'dexie';

export interface BubbleROI {
  id: string;
  cx: number;
  cy: number;
  r: number;
  value: string;
  isBox?: boolean;
}

export interface TemplateBlock {
  id: number | string;
  x: number;
  y: number;
  type: string;
  title: string;
  direction?: string;
  cols?: number;
  rows?: number;
  options?: string[];
  prefillValue?: string | string[];
  startNum?: number;
  bubbles?: BubbleROI[];
}

export interface OmrTemplate {
  id: string;
  name: string;
  updatedAt: number;
  blocks: TemplateBlock[];
  autoLayout?: boolean;
}

export interface ScanResult {
  npsn: string;
  id_mapel: string;
  kode_tes: string;
  nisn: string;
  answers: any[];
  scannedAt: number;
  nama_siswa?: string;
  kelas?: string;
  no_peserta?: string;
  tanggal_ujian?: string;
  confidence_score?: number;
  scan_notes?: string;
  engine?: string;
  image_url?: string;
  is_ground_truth?: boolean;
}

export interface ScoreResult {
  npsn: string;
  id_mapel: string;
  kode_tes: string;
  nisn: string;
  nilai: number;
  itemScores: { [key: number]: number };
  scoredAt: number;
  isKey?: boolean;
}

// Normalized Vector ROI types for resolution-independent scaling
export interface NormalizedBubbleROI {
  id: string;
  normX: number; // 0.0 to 1.0 (cx / sheetWidth)
  normY: number; // 0.0 to 1.0 (cy / sheetHeight)
  normR: number; // radius / sheetWidth
  value: string;
  isBox?: boolean;
  blockId: string | number;
  blockType: string;
}

export interface NormalizedFieldROI {
  key: 'nama_lengkap' | 'kelas' | 'no_peserta' | 'tanggal_pelaksanaan';
  label: string;
  normX: number; // x / sheetWidth
  normY: number; // y / sheetHeight
  normWidth: number; // width / sheetWidth
  normHeight: number; // height / sheetHeight
}

export interface TemplateRoiRecord {
  id: string;
  templateId: string;
  type: 'baseline' | 'ai_calibrated' | 'resultant';
  vectorRois: NormalizedBubbleROI[];
  handwrittenFields?: NormalizedFieldROI[];
  sampleCount?: number;
  confidence?: number;
  metadata?: {
    modelName?: string;
    imageWidth?: number;
    imageHeight?: number;
    notes?: string;
  };
  createdAt: number;
}

export class OMREnterpriseDB extends Dexie {
  templates!: Table<OmrTemplate, string>;
  scanResults!: Table<ScanResult, [string, string, string, string]>;
  scoreResults!: Table<ScoreResult, [string, string, string, string]>;
  templateRois!: Table<TemplateRoiRecord, string>;

  constructor() {
    super('OMREnterpriseDB');
    this.version(4).stores({
      templates: 'id, name, updatedAt',
      scanResults: '[npsn+id_mapel+kode_tes+nisn], scannedAt',
      scoreResults: '[npsn+id_mapel+kode_tes+nisn], scoredAt',
      templateRois: 'id, templateId, type, createdAt'
    });
  }
}

export const db = new OMREnterpriseDB();

/**
 * Data Ground Truth Resmi hasil pemindaian Gemini Pro 3.1
 * Digunakan sebagai standar emas akurasi dan tolok ukur (few-shot benchmark)
 */
export const GROUND_TRUTH_SCAN_RESULT: ScanResult = {
  npsn: "20301942",
  id_mapel: "01",
  kode_tes: "91",
  nisn: "0114741902",
  nama_siswa: "FELLYSA NINDA MAHARANI",
  kelas: "9A",
  no_peserta: "R09-9A-11",
  tanggal_ujian: "23-09-2026",
  scannedAt: new Date("2026-09-23T14:00:00.000Z").getTime(),
  engine: "gemini",
  scan_notes: "Ground Truth Standar Emas (Gemini Pro 3.1)",
  confidence_score: 1.0,
  is_ground_truth: true,
  answers: [
    { nomor_soal: 1, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 2, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 3, bentuk_soal: "pg", jawaban: "A" },
    { nomor_soal: 4, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 5, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 6, bentuk_soal: "pg", jawaban: "C" },
    { nomor_soal: 7, bentuk_soal: "pg", jawaban: "C" },
    { nomor_soal: 8, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 9, bentuk_soal: "pg", jawaban: "D" },
    { nomor_soal: 10, bentuk_soal: "pg", jawaban: "B" },
    { nomor_soal: 11, bentuk_soal: "pg", jawaban: "C" },
    { nomor_soal: 12, bentuk_soal: "pg", jawaban: "C" },
    { nomor_soal: 13, bentuk_soal: "bs3", jawaban: ["B", "S", "S"] },
    { nomor_soal: 14, bentuk_soal: "bs3", jawaban: ["S", "S", "S"] },
    { nomor_soal: 15, bentuk_soal: "bs3", jawaban: ["B", "S", "B"] },
    { nomor_soal: 16, bentuk_soal: "bs3", jawaban: ["B", "B", "B"] },
    { nomor_soal: 17, bentuk_soal: "bs3", jawaban: ["B", "B", "S"] },
    { nomor_soal: 18, bentuk_soal: "bs3", jawaban: ["B", "S", "S"] },
    { nomor_soal: 19, bentuk_soal: "kompleks", jawaban: ["B", "C", "D"] },
    { nomor_soal: 20, bentuk_soal: "kompleks", jawaban: ["B", "D"] },
    { nomor_soal: 21, bentuk_soal: "kompleks", jawaban: ["C", "D"] },
    { nomor_soal: 22, bentuk_soal: "kompleks", jawaban: ["B", "C", "D"] },
    { nomor_soal: 23, bentuk_soal: "kompleks", jawaban: ["A", "C", "D"] },
    { nomor_soal: 24, bentuk_soal: "kompleks", jawaban: ["A", "C", "D"] },
    { nomor_soal: 25, bentuk_soal: "jodoh", jawaban: "A" },
    { nomor_soal: 26, bentuk_soal: "jodoh", jawaban: "D" },
    { nomor_soal: 27, bentuk_soal: "jodoh", jawaban: "B" },
    { nomor_soal: 28, bentuk_soal: "jodoh", jawaban: "B" },
    { nomor_soal: 29, bentuk_soal: "jodoh", jawaban: "C" },
    { nomor_soal: 30, bentuk_soal: "jodoh", jawaban: "C" }
  ]
};

/**
 * Menyimpan data Ground Truth ke dalam tabel scanResults jika belum ada atau memperbaruinya.
 */
export async function seedGroundTruthIfMissing(force = false): Promise<void> {
  try {
    const existing = await db.scanResults.get([
      GROUND_TRUTH_SCAN_RESULT.npsn,
      GROUND_TRUTH_SCAN_RESULT.id_mapel,
      GROUND_TRUTH_SCAN_RESULT.kode_tes,
      GROUND_TRUTH_SCAN_RESULT.nisn
    ]);

    if (!existing || force) {
      await db.scanResults.put(GROUND_TRUTH_SCAN_RESULT);
      console.info('[DB] Ground truth berhasil disimpan ke basis data hasil scan.');
    }
  } catch (err) {
    console.warn('[DB] Gagal menyemai Ground Truth:', err);
  }
}

