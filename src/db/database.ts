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
  template_id?: string;
  is_calibrated?: boolean;
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
    isUserVerified?: boolean;
    verifiedAt?: number;
    studentName?: string;
    nisn?: string;
    sampleCount?: number;
    calibratedBubbleCount?: number;
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
 * Membersihkan data ground truth benchmark acuan dari tabel scanResults.
 */
export async function cleanupGroundTruthData(): Promise<void> {
  try {
    const all = await db.scanResults.toArray();
    const gtKeys = all
      .filter(r => r.is_ground_truth || r.nisn === '0114741902')
      .map(r => [r.npsn, r.id_mapel, r.kode_tes, r.nisn] as [string, string, string, string]);

    if (gtKeys.length > 0) {
      await db.scanResults.bulkDelete(gtKeys);
      console.info(`[DB] Berhasil menghapus ${gtKeys.length} data ground truth acuan.`);
    }
  } catch (err) {
    console.warn('[DB] Gagal membersihkan data ground truth:', err);
  }
}

