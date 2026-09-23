import {
  db,
  type OmrTemplate,
  type TemplateBlock,
  type NormalizedBubbleROI,
  type NormalizedFieldROI,
  type TemplateRoiRecord
} from '../db/database';

const CANVAS_WIDTH = 1000;
const CANVAS_HEIGHT = 1414;

/**
 * Ekstraksi ROI vektor ternormalisasi (skala 0.0 - 1.0) dari templat LJK.
 */
export function extractVectorRoisFromTemplate(
  template: OmrTemplate,
  canvasWidth = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT
): { vectorRois: NormalizedBubbleROI[]; handwrittenFields: NormalizedFieldROI[] } {
  const vectorRois: NormalizedBubbleROI[] = [];
  const handwrittenFields: NormalizedFieldROI[] = [];

  (template.blocks || []).forEach((block: TemplateBlock) => {
    // 1. Tangani blok identitas tulisan tangan khusus field esensial
    if (block.type === 'handwritten_identity') {
      handwrittenFields.push(
        {
          key: 'nama_lengkap',
          label: 'Nama Lengkap',
          normX: (block.x + 15) / canvasWidth,
          normY: (block.y + 28) / canvasHeight,
          normWidth: 790 / canvasWidth,
          normHeight: 28 / canvasHeight
        },
        {
          key: 'kelas',
          label: 'Kelas',
          normX: (block.x + 15) / canvasWidth,
          normY: (block.y + 76) / canvasHeight,
          normWidth: 150 / canvasWidth,
          normHeight: 28 / canvasHeight
        },
        {
          key: 'no_peserta',
          label: 'No. Peserta',
          normX: (block.x + 180) / canvasWidth,
          normY: (block.y + 76) / canvasHeight,
          normWidth: 150 / canvasWidth,
          normHeight: 28 / canvasHeight
        },
        {
          key: 'tanggal_pelaksanaan',
          label: 'Tanggal Pelaksanaan',
          normX: (block.x + 345) / canvasWidth,
          normY: (block.y + 76) / canvasHeight,
          normWidth: 460 / canvasWidth,
          normHeight: 28 / canvasHeight
        }
      );
      // Pernyataan kejujuran, catatan, dan tanda tangan sengaja diabaikan sesuai spesifikasi
      return;
    }

    // 2. Tangani bulatan-bulatan jawaban dan kode identitas
    if (block.bubbles && block.bubbles.length > 0) {
      block.bubbles.forEach(b => {
        vectorRois.push({
          id: `${block.id}_${b.id}`,
          normX: b.cx / canvasWidth,
          normY: b.cy / canvasHeight,
          normR: b.r / canvasWidth,
          value: b.value,
          isBox: Boolean(b.isBox),
          blockId: block.id,
          blockType: block.type
        });
      });
    }
  });

  return { vectorRois, handwrittenFields };
}

/**
 * Menyimpan data Baseline Vector ROI saat templat disimpan di perancang
 */
export async function saveBaselineRoi(template: OmrTemplate): Promise<TemplateRoiRecord> {
  const { vectorRois, handwrittenFields } = extractVectorRoisFromTemplate(template);
  const baselineRecord: TemplateRoiRecord = {
    id: `${template.id}_baseline`,
    templateId: template.id,
    type: 'baseline',
    vectorRois,
    handwrittenFields,
    sampleCount: 1,
    confidence: 1.0,
    metadata: {
      notes: 'ROI Baseline presisi dari perancang LJK'
    },
    createdAt: Date.now()
  };

  await db.templateRois.put(baselineRecord);

  // Jika belum ada resultant, buat resultant awal dari baseline
  const existingResultant = await db.templateRois.get(`${template.id}_resultant`);
  if (!existingResultant) {
    const initialResultant: TemplateRoiRecord = {
      ...baselineRecord,
      id: `${template.id}_resultant`,
      type: 'resultant',
      sampleCount: 1,
      metadata: {
        notes: 'Resultant awal (disinkronisasi dari baseline)'
      }
    };
    await db.templateRois.put(initialResultant);
  }

  return baselineRecord;
}

/**
 * Menambahkan sampel kalibrasi baru hasil pemindaian sukses dari Gemini AI
 */
export async function recordCalibrationSample(
  templateId: string,
  calibratedVectorRois: NormalizedBubbleROI[],
  metadata?: { modelName?: string; imageWidth?: number; imageHeight?: number; notes?: string }
): Promise<TemplateRoiRecord> {
  const sampleId = `${templateId}_sample_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  // Ambil data handwritten fields dari baseline templat jika ada
  const baseline = await db.templateRois.get(`${templateId}_baseline`);
  
  const sampleRecord: TemplateRoiRecord = {
    id: sampleId,
    templateId,
    type: 'ai_calibrated',
    vectorRois: calibratedVectorRois,
    handwrittenFields: baseline?.handwrittenFields,
    sampleCount: 1,
    confidence: 0.95,
    metadata,
    createdAt: Date.now()
  };

  await db.templateRois.put(sampleRecord);

  // Hitung ulang ROI Resultan gabungan
  await computeResultantRoi(templateId);

  return sampleRecord;
}

/**
 * Menghitung nilai median centroid (resultan vektor) dari baseline dan seluruh sampel AI
 */
export async function computeResultantRoi(templateId: string): Promise<TemplateRoiRecord | null> {
  const baseline = await db.templateRois.get(`${templateId}_baseline`);
  const samples = await db.templateRois
    .where('templateId')
    .equals(templateId)
    .filter(r => r.type === 'ai_calibrated')
    .toArray();

  if (!baseline && samples.length === 0) {
    return null;
  }

  const allRecords = baseline ? [baseline, ...samples] : samples;
  const bubbleMap: Record<string, { normX: number[]; normY: number[]; normR: number[]; value: string; isBox?: boolean; blockId: string | number; blockType: string }> = {};

  allRecords.forEach(record => {
    record.vectorRois.forEach(b => {
      if (!bubbleMap[b.id]) {
        bubbleMap[b.id] = {
          normX: [],
          normY: [],
          normR: [],
          value: b.value,
          isBox: b.isBox,
          blockId: b.blockId,
          blockType: b.blockType
        };
      }
      bubbleMap[b.id].normX.push(b.normX);
      bubbleMap[b.id].normY.push(b.normY);
      bubbleMap[b.id].normR.push(b.normR);
    });
  });

  const median = (values: number[]): number => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const half = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[half];
    }
    return (sorted[half - 1] + sorted[half]) / 2.0;
  };

  const resultantVectorRois: NormalizedBubbleROI[] = Object.keys(bubbleMap).map(id => {
    const item = bubbleMap[id];
    return {
      id,
      normX: median(item.normX),
      normY: median(item.normY),
      normR: median(item.normR),
      value: item.value,
      isBox: item.isBox,
      blockId: item.blockId,
      blockType: item.blockType
    };
  });

  const resultantRecord: TemplateRoiRecord = {
    id: `${templateId}_resultant`,
    templateId,
    type: 'resultant',
    vectorRois: resultantVectorRois,
    handwrittenFields: baseline?.handwrittenFields,
    sampleCount: samples.length + (baseline ? 1 : 0),
    confidence: Math.min(1.0, 0.85 + samples.length * 0.03),
    metadata: {
      notes: `Resultan dihitung dari ${samples.length} sampel AI kalibrasi + baseline`
    },
    createdAt: Date.now()
  };

  await db.templateRois.put(resultantRecord);
  return resultantRecord;
}

/**
 * Mengambil koleksi ROI untuk proses pemindaian OpenCV
 */
export async function getTemplateRoisForScanning(templateId: string): Promise<{
  resultant: TemplateRoiRecord | null;
  samples: TemplateRoiRecord[];
  baseline: TemplateRoiRecord | null;
  totalSamples: number;
}> {
  const baseline = await db.templateRois.get(`${templateId}_baseline`);
  const resultant = await db.templateRois.get(`${templateId}_resultant`);
  const samples = await db.templateRois
    .where('templateId')
    .equals(templateId)
    .filter(r => r.type === 'ai_calibrated')
    .reverse()
    .sortBy('createdAt');

  return {
    resultant: resultant || baseline || null,
    samples,
    baseline: baseline || null,
    totalSamples: samples.length
  };
}

/**
 * Mereset data kalibrasi AI templat dan mengembalikan ke baseline murni
 */
export async function resetTemplateCalibration(templateId: string): Promise<void> {
  const records = await db.templateRois
    .where('templateId')
    .equals(templateId)
    .toArray();

  const toDelete = records.filter(r => r.type === 'ai_calibrated' || r.type === 'resultant').map(r => r.id);
  if (toDelete.length > 0) {
    await db.templateRois.bulkDelete(toDelete);
  }

  // Bangkitkan ulang resultant dari baseline jika ada
  const baseline = await db.templateRois.get(`${templateId}_baseline`);
  if (baseline) {
    await db.templateRois.put({
      ...baseline,
      id: `${templateId}_resultant`,
      type: 'resultant',
      sampleCount: 1,
      metadata: {
        notes: 'Resultant direset ke baseline'
      },
      createdAt: Date.now()
    });
  }
}

/**
 * Mengkalibrasi posisi ROI vektor berdasarkan citra riil dan hasil deteksi ground-truth Gemini.
 * Menghitung pergeseran (offset) dan skala aktual yang terjadi pada kamera fisik.
 */
export function calibrateVectorRoisFromScan(
  baselineRois: NormalizedBubbleROI[],
  canvas: HTMLCanvasElement,
  groundTruth: {
    nisn?: string;
    npsn?: string;
    id_mapel?: string;
    kode_tes?: string;
    answers?: Array<{ nomor_soal: number; jawaban: string | string[] }>;
  }
): NormalizedBubbleROI[] {
  const ctx = canvas.getContext('2d');
  if (!ctx || baselineRois.length === 0) {
    return baselineRois;
  }

  const W = canvas.width;
  const H = canvas.height;
  const imgData = ctx.getImageData(0, 0, W, H);
  const data = imgData.data;

  // Kumpulkan set ID bulatan yang dikonfirmasi terisi oleh Gemini
  const confirmedBubbleIds = new Set<string>();

  // 1. Identitas vertikal
  if (groundTruth.npsn) {
    for (let c = 0; c < groundTruth.npsn.length; c++) {
      const char = groundTruth.npsn[c];
      const r = parseInt(char, 10) + 1; // row 1-10
      confirmedBubbleIds.add(`col${c + 1}_row${r}`);
    }
  }
  if (groundTruth.nisn) {
    for (let c = 0; c < groundTruth.nisn.length; c++) {
      const char = groundTruth.nisn[c];
      const r = parseInt(char, 10) + 1;
      confirmedBubbleIds.add(`col${c + 1}_row${r}`);
    }
  }

  // 2. Jawaban soal
  if (groundTruth.answers && Array.isArray(groundTruth.answers)) {
    groundTruth.answers.forEach(ans => {
      const qNum = ans.nomor_soal;
      const jwb = Array.isArray(ans.jawaban) ? ans.jawaban : [ans.jawaban];
      jwb.forEach(opt => {
        if (!opt) return;
        const oIdx = opt.charCodeAt(0) - 65; // A=0, B=1, ...
        if (oIdx >= 0 && oIdx <= 5) {
          confirmedBubbleIds.add(`q${qNum}_opt${oIdx}`);
        }
      });
    });
  }

  // Hitung offset rata-rata per blok
  const blockOffsets: Record<string, { totalDx: number; totalDy: number; count: number }> = {};

  baselineRois.forEach(b => {
    const isTarget = Array.from(confirmedBubbleIds).some(id => b.id.includes(id));
    if (!isTarget) return;

    const px = Math.round(b.normX * W);
    const py = Math.round(b.normY * H);
    const pr = Math.max(4, Math.round(b.normR * W));

    // Jendela pencarian lokal +-1.5 radius
    const searchWindow = Math.round(pr * 1.5);
    let minLuminance = 255;
    let bestX = px;
    let bestY = py;

    for (let dy = -searchWindow; dy <= searchWindow; dy += 2) {
      for (let dx = -searchWindow; dx <= searchWindow; dx += 2) {
        const nx = px + dx;
        const ny = py + dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
          const idx = (ny * W + nx) * 4;
          const lum = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]);
          if (lum < minLuminance) {
            minLuminance = lum;
            bestX = nx;
            bestY = ny;
          }
        }
      }
    }

    // Jika menemukan titik gelap yang signifikan
    if (minLuminance < 140) {
      const dx = (bestX - px) / W;
      const dy = (bestY - py) / H;
      const blkKey = String(b.blockId);
      if (!blockOffsets[blkKey]) {
        blockOffsets[blkKey] = { totalDx: 0, totalDy: 0, count: 0 };
      }
      blockOffsets[blkKey].totalDx += dx;
      blockOffsets[blkKey].totalDy += dy;
      blockOffsets[blkKey].count += 1;
    }
  });

  // Terapkan kalibrasi ke semua bulatan
  return baselineRois.map(b => {
    const blkKey = String(b.blockId);
    const offset = blockOffsets[blkKey];
    if (offset && offset.count > 0) {
      const avgDx = offset.totalDx / offset.count;
      const avgDy = offset.totalDy / offset.count;
      return {
        ...b,
        normX: Math.max(0.01, Math.min(0.99, b.normX + avgDx)),
        normY: Math.max(0.01, Math.min(0.99, b.normY + avgDy))
      };
    }
    return b;
  });
}

