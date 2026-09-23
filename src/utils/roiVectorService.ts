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

export interface CalibrationMetadata {
  modelName?: string;
  imageWidth?: number;
  imageHeight?: number;
  notes?: string;
  isUserVerified?: boolean;
  studentName?: string;
  nisn?: string;
  calibratedBubbleCount?: number;
}

/**
 * Menambahkan sampel kalibrasi baru yang HANYA dipanggil ketika pengguna
 * mengonfirmasi bahwa hasil pemindaian adalah SEMPURNA.
 */
export async function recordCalibrationSample(
  templateId: string,
  calibratedVectorRois: NormalizedBubbleROI[],
  metadata?: CalibrationMetadata
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
    confidence: 0.98,
    metadata: {
      ...metadata,
      isUserVerified: true,
      verifiedAt: Date.now()
    },
    createdAt: Date.now()
  };

  await db.templateRois.put(sampleRecord);

  // Hitung ulang ROI Resultan gabungan dari baseline dan sampel-sampel yang diverifikasi sempurna
  await computeResultantRoi(templateId);

  return sampleRecord;
}

/**
 * Menghapus satu sampel kalibrasi spesifik dari database dan menghitung ulang resultan
 */
export async function deleteCalibrationSample(templateId: string, sampleId: string): Promise<void> {
  await db.templateRois.delete(sampleId);
  await computeResultantRoi(templateId);
}

/**
 * Menghitung nilai median centroid (resultan vektor) dari baseline dan seluruh sampel sempurna
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
    confidence: Math.min(1.0, 0.90 + samples.length * 0.02),
    metadata: {
      notes: `Resultan dihitung dari ${samples.length} sampel kalibrasi sempurna pengguna + baseline`,
      sampleCount: samples.length
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
 * Mereset data kalibrasi templat dan mengembalikan ke baseline murni
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
        notes: 'Resultant direset ke baseline murni'
      },
      createdAt: Date.now()
    });
  }
}

/**
 * Mengkalibrasi posisi ROI vektor berdasarkan citra fisik dan hasil yang telah diverifikasi sempurna oleh pengguna.
 * Menghitung pergeseran (offset) dan skala aktual yang terjadi pada kamera fisik secara presisi dan terproteksi dari outlier.
 */
export function calibrateVectorRoisFromScan(
  baselineRois: NormalizedBubbleROI[],
  canvas: HTMLCanvasElement,
  confirmedResult: {
    nisn?: string;
    npsn?: string;
    id_mapel?: string;
    kode_tes?: string;
    answers?: Array<{ nomor_soal: number; bentuk_soal?: string; jawaban: string | string[] }>;
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

  // 1. Kumpulkan set ID bulatan yang dikonfirmasi terisi secara presisi berdasarkan tipe blok
  const confirmedBubbleIds = new Set<string>();

  baselineRois.forEach(b => {
    // A. Identitas vertikal
    if (b.blockType === 'identity_npsn' && confirmedResult.npsn) {
      const match = b.id.match(/_col(\d+)_row(\d+)/);
      if (match) {
        const colIdx = parseInt(match[1], 10) - 1;
        if (colIdx >= 0 && colIdx < confirmedResult.npsn.length && b.value === confirmedResult.npsn[colIdx]) {
          confirmedBubbleIds.add(b.id);
        }
      }
    } else if (b.blockType === 'identity_nisn' && confirmedResult.nisn) {
      const match = b.id.match(/_col(\d+)_row(\d+)/);
      if (match) {
        const colIdx = parseInt(match[1], 10) - 1;
        if (colIdx >= 0 && colIdx < confirmedResult.nisn.length && b.value === confirmedResult.nisn[colIdx]) {
          confirmedBubbleIds.add(b.id);
        }
      }
    } else if (b.blockType === 'identity_subject' && confirmedResult.id_mapel) {
      const match = b.id.match(/_col(\d+)_row(\d+)/);
      if (match) {
        const colIdx = parseInt(match[1], 10) - 1;
        if (colIdx >= 0 && colIdx < confirmedResult.id_mapel.length && b.value === confirmedResult.id_mapel[colIdx]) {
          confirmedBubbleIds.add(b.id);
        }
      }
    } else if (b.blockType === 'identity_test' && confirmedResult.kode_tes) {
      const match = b.id.match(/_col(\d+)_row(\d+)/);
      if (match) {
        const colIdx = parseInt(match[1], 10) - 1;
        if (colIdx >= 0 && colIdx < confirmedResult.kode_tes.length && b.value === confirmedResult.kode_tes[colIdx]) {
          confirmedBubbleIds.add(b.id);
        }
      }
    // B. Jawaban soal (PG, Kompleks, BS3, YT3, Jodoh)
    } else if (confirmedResult.answers && Array.isArray(confirmedResult.answers)) {
      confirmedResult.answers.forEach(ans => {
        const qNum = ans.nomor_soal;
        // Gunakan regex presisi agar nomor soal tidak salah cocok (misal 1 vs 10 atau 12)
        const qRegex = new RegExp(`_q${qNum}(?:_sub(\\d+))?_opt(\\d+)`);
        const qMatch = b.id.match(qRegex);
        if (qMatch) {
          if (b.blockType === 'bs3' || b.blockType === 'yt3') {
            const subIdx = qMatch[1] !== undefined ? parseInt(qMatch[1], 10) : -1;
            if (subIdx >= 0 && Array.isArray(ans.jawaban)) {
              if (ans.jawaban[subIdx] && ans.jawaban[subIdx] === b.value) {
                confirmedBubbleIds.add(b.id);
              }
            }
          } else if (b.blockType === 'kompleks') {
            const ansArr = Array.isArray(ans.jawaban) ? ans.jawaban : [ans.jawaban];
            if (ansArr.includes(b.value)) {
              confirmedBubbleIds.add(b.id);
            }
          } else {
            const expected = Array.isArray(ans.jawaban) ? ans.jawaban[0] : ans.jawaban;
            if (expected && expected !== '-' && b.value === expected) {
              confirmedBubbleIds.add(b.id);
            }
          }
        }
      });
    }
  });

  // 2. Hitung pergeseran (offset) nyata pada citra kertas fisik
  const blockOffsets: Record<string, { dxList: number[]; dyList: number[] }> = {};
  const globalDxList: number[] = [];
  const globalDyList: number[] = [];

  // Ambang batas deviasi maksimum yang diizinkan (maks 2.5% dari lebar/tinggi lembar)
  const MAX_ALLOWED_DEV_X = W * 0.025;
  const MAX_ALLOWED_DEV_Y = H * 0.025;

  baselineRois.forEach(b => {
    if (!confirmedBubbleIds.has(b.id)) return;

    const px = Math.round(b.normX * W);
    const py = Math.round(b.normY * H);
    const pr = Math.max(4, Math.round(b.normR * W));

    // Jendela pencarian lokal
    const searchWindow = Math.min(22, Math.max(12, Math.round(pr * 1.6)));
    const sampleR = Math.max(2, Math.round(pr * 0.45));
    let maxDarkness = 0;
    let bestX = px;
    let bestY = py;

    for (let dy = -searchWindow; dy <= searchWindow; dy += 2) {
      for (let dx = -searchWindow; dx <= searchWindow; dx += 2) {
        const curX = px + dx;
        const curY = py + dy;

        let darkSum = 0;
        let count = 0;

        for (let sy = -sampleR; sy <= sampleR; sy += 2) {
          for (let sx = -sampleR; sx <= sampleR; sx += 2) {
            if (sx * sx + sy * sy <= sampleR * sampleR) {
              const nx = curX + sx;
              const ny = curY + sy;
              if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
                const idx = (ny * W + nx) * 4;
                const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
                darkSum += (255 - lum);
                count++;
              }
            }
          }
        }

        const avgDark = count > 0 ? darkSum / count : 0;
        if (avgDark > maxDarkness) {
          maxDarkness = avgDark;
          bestX = curX;
          bestY = curY;
        }
      }
    }

    // Hanya terima deteksi jika kontras hitam bulatan cukup kuat (darkness > 75) dan pergeseran wajar
    const devX = bestX - px;
    const devY = bestY - py;
    if (maxDarkness > 75 && Math.abs(devX) <= MAX_ALLOWED_DEV_X && Math.abs(devY) <= MAX_ALLOWED_DEV_Y) {
      const dxNorm = devX / W;
      const dyNorm = devY / H;
      const blkKey = String(b.blockId);

      if (!blockOffsets[blkKey]) {
        blockOffsets[blkKey] = { dxList: [], dyList: [] };
      }
      blockOffsets[blkKey].dxList.push(dxNorm);
      blockOffsets[blkKey].dyList.push(dyNorm);

      globalDxList.push(dxNorm);
      globalDyList.push(dyNorm);
    }
  });

  const getMedian = (list: number[]): number => {
    if (list.length === 0) return 0;
    const sorted = [...list].sort((a, b) => a - b);
    const half = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[half] : (sorted[half - 1] + sorted[half]) / 2;
  };

  const globalMedianDx = getMedian(globalDxList);
  const globalMedianDy = getMedian(globalDyList);

  // 3. Terapkan kalibrasi ke semua bulatan templat dengan interpolasi per-blok yang aman
  return baselineRois.map(b => {
    const blkKey = String(b.blockId);
    const blkOffset = blockOffsets[blkKey];

    let applyDx = globalMedianDx;
    let applyDy = globalMedianDy;

    // Jika dalam blok tersebut terdapat setidaknya 2 sampel bulatan terdeteksi, gunakan median blok
    if (blkOffset && blkOffset.dxList.length >= 2) {
      applyDx = getMedian(blkOffset.dxList);
      applyDy = getMedian(blkOffset.dyList);
    } else if (blkOffset && blkOffset.dxList.length === 1) {
      // Jika hanya 1 bulatan, campur dengan median global agar tidak bias
      applyDx = (blkOffset.dxList[0] + globalMedianDx) / 2;
      applyDy = (blkOffset.dyList[0] + globalMedianDy) / 2;
    }

    // Batasi pergeseran maksimal 2% dari kanvas agar posisi tidak keluar jalur
    const clampedDx = Math.max(-0.02, Math.min(0.02, applyDx));
    const clampedDy = Math.max(-0.02, Math.min(0.02, applyDy));

    return {
      ...b,
      normX: Math.max(0.01, Math.min(0.99, b.normX + clampedDx)),
      normY: Math.max(0.01, Math.min(0.99, b.normY + clampedDy))
    };
  });
}
