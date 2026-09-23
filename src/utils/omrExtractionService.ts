/**
 * Layanan Ekstraksi OMR Presisi Tinggi Berbasis OpenCV & Registrasi Fiducial
 * 
 * Arsitektur:
 * 1. Fiducial Registration: Menyelaraskan 4 penanda sudut konsentris LJK ke koordinat kanvas acuan (50,50), (950,50), (50,1364), (950,1364).
 * 2. Core Sampling: Pengukuran densitas biner HANYA pada inti dalam bulatan (r_core = 0.46 * r).
 *    Mencegah kontaminasi garis batas lingkaran, kotak centang, serta garis pembatas kisi tabel.
 * 3. Relative Multi-Choice Scoring: Komparasi kontras antar opsi dalam satu baris/kolom.
 */

import type { NormalizedBubbleROI } from '../db/database';

export interface EvaluatedAnswer {
  nomor_soal: number;
  bentuk_soal: string;
  jawaban: string | string[];
  confidence?: number;
}

export interface OmrExtractionResult {
  npsn: string;
  id_mapel: string;
  kode_tes: string;
  nisn: string;
  answers: EvaluatedAnswer[];
  contrastScore: number;
  detectedMarksCount: number;
}

/**
 * Mencari posisi pusat (centroid) penanda fiducial konsentris pada 4 sudut lembar LJK.
 * Koordinat acuan templat A4 (1000 x 1414):
 * - Top-Left: (50, 50)
 * - Top-Right: (950, 50)
 * - Bottom-Left: (50, 1364)
 * - Bottom-Right: (950, 1364)
 */
export function refineFiducialRegistration(
  threshMat: any,
  cv: any,
  sheetW = 1000,
  sheetH = 1414
): { isRegistered: boolean; transformMatrix?: any } {
  try {
    const corners = [
      { name: 'TL', rx: 15, ry: 15, rw: 75, rh: 75, targetX: 50, targetY: 50 },
      { name: 'TR', rx: sheetW - 90, ry: 15, rw: 75, rh: 75, targetX: 950, targetY: 50 },
      { name: 'BR', rx: sheetW - 90, ry: sheetH - 90, rw: 75, rh: 75, targetX: 950, targetY: 1364 },
      { name: 'BL', rx: 15, ry: sheetH - 90, rw: 75, rh: 75, targetX: 50, targetY: 1364 }
    ];

    const detectedPoints: Array<{ x: number; y: number }> = [];

    for (const c of corners) {
      const rect = new cv.Rect(c.rx, c.ry, c.rw, c.rh);
      const roi = threshMat.roi(rect);
      const m = cv.moments(roi, true);
      roi.delete();

      // Penanda fiducial 40x40 memiliki massa piksel hitam yang cukup besar (m00 > 150)
      if (m.m00 > 150) {
        const localX = m.m10 / m.m00;
        const localY = m.m01 / m.m00;
        detectedPoints.push({
          x: c.rx + localX,
          y: c.ry + localY
        });
      } else {
        // Jika tidak terdeteksi, gunakan titik target acuan
        detectedPoints.push({ x: c.targetX, y: c.targetY });
      }
    }

    // Jika setidaknya 3 dari 4 penanda terdeteksi dengan pergeseran wajar (< 35px)
    let validShiftCount = 0;
    for (let i = 0; i < 4; i++) {
      const dx = Math.abs(detectedPoints[i].x - corners[i].targetX);
      const dy = Math.abs(detectedPoints[i].y - corners[i].targetY);
      if (dx < 35 && dy < 35) {
        validShiftCount++;
      }
    }

    if (validShiftCount >= 3) {
      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        detectedPoints[0].x, detectedPoints[0].y,
        detectedPoints[1].x, detectedPoints[1].y,
        detectedPoints[2].x, detectedPoints[2].y,
        detectedPoints[3].x, detectedPoints[3].y
      ]);

      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        50, 50,
        950, 50,
        950, 1364,
        50, 1364
      ]);

      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      srcTri.delete();
      dstTri.delete();

      return { isRegistered: true, transformMatrix: M };
    }
  } catch (err) {
    console.warn('[Fiducial Registration] Gagal menghitung homografi fiducial:', err);
  }

  return { isRegistered: false };
}

/**
 * Mengukur densitas kegelapan bulatan murni pada inti dalamnya (Core Sampling).
 * Radius sampling ditetapkan sebesar 46% dari radius bulatan (r_core = 0.46 * r),
 * sehingga sama sekali tidak mengenai garis tepi bulatan pensil atau garis batas kotak centang.
 */
export function sampleBubbleCoreIntensity(
  threshMat: any,
  cv: any,
  cx: number,
  cy: number,
  r: number,
  sheetW: number,
  sheetH: number,
  isBox: boolean = false
): number {
  // Untuk bulatan lingkaran: coreRadius = 46% * r
  // Untuk kotak centang persegi (kompleks): batas dalam kotak sekitar 65% dari r (lebar sampling ~13x13)
  const coreRadius = isBox ? Math.max(3, Math.round(r * 0.65)) : Math.max(2, Math.round(r * 0.46));

  const x1 = Math.max(0, cx - coreRadius);
  const y1 = Math.max(0, cy - coreRadius);
  const x2 = Math.min(sheetW - 1, cx + coreRadius);
  const y2 = Math.min(sheetH - 1, cy + coreRadius);

  const w = x2 - x1;
  const h = y2 - y1;

  if (w <= 0 || h <= 0) return 0;

  const rect = new cv.Rect(x1, y1, w, h);
  const roi = threshMat.roi(rect);
  const mean = cv.mean(roi);
  roi.delete();

  return mean[0];
}

/**
 * Ekstraksi OMR lengkap menggunakan Core Sampling & Relative Separation Scoring
 */
export function extractOmrWithRelativeScoring(
  threshMat: any,
  _grayMat: any,
  cv: any,
  vectorRois: NormalizedBubbleROI[],
  sheetW: number,
  sheetH: number,
  template: any
): OmrExtractionResult {
  let npsn = '';
  let id_mapel = '';
  let kode_tes = '';
  let nisn = '';
  const answers: EvaluatedAnswer[] = [];

  let totalContrastSeparation = 0;
  let evaluatedItemsCount = 0;
  let detectedMarksCount = 0;

  (template.blocks || []).forEach((block: any) => {
    if (!block.bubbles || block.bubbles.length === 0) return;

    // ==========================================
    // A. BLOK IDENTITAS VERTIKAL (NPSN, NISN, MAPEL, KODE TES)
    // ==========================================
    if (block.direction === 'vertical') {
      const cols = block.cols || 0;
      const rows = block.rows || 10;
      let resultString = '';

      for (let c = 1; c <= cols; c++) {
        let maxIntensity = -1;
        let secondIntensity = -1;
        let selectedValue = '';
        let colSum = 0;

        for (let r = 1; r <= rows; r++) {
          const bubbleId = `${block.id}_col${c}_row${r}`;
          const vBubble = vectorRois.find(b => b.id === bubbleId);

          if (vBubble) {
            const cx = Math.round(vBubble.normX * sheetW);
            const cy = Math.round(vBubble.normY * sheetH);
            const br = Math.max(4, Math.round(vBubble.normR * sheetW));

            const intensity = sampleBubbleCoreIntensity(threshMat, cv, cx, cy, br, sheetW, sheetH);
            colSum += intensity;

            if (intensity > maxIntensity) {
              secondIntensity = maxIntensity;
              maxIntensity = intensity;
              selectedValue = vBubble.value;
            } else if (intensity > secondIntensity) {
              secondIntensity = intensity;
            }
          }
        }

        const avgOther = rows > 1 ? (colSum - maxIntensity) / (rows - 1) : 0;
        const contrastRatio = avgOther > 1 ? maxIntensity / avgOther : (maxIntensity > 30 ? 3 : 1);
        const separation = Math.max(0, maxIntensity - secondIntensity);

        totalContrastSeparation += separation / 255.0;
        evaluatedItemsCount++;

        // Kriteria Keterisian Kolom Angka (0-9):
        // Intensitas inti >= 35 DAN unggul minimal 16 poin dari baris kedua ATAU rasio kontras >= 1.6x
        if (maxIntensity >= 35 && (separation >= 16 || contrastRatio >= 1.6)) {
          resultString += selectedValue;
          detectedMarksCount++;
        } else {
          resultString += '0';
        }
      }

      if (block.type === 'identity_npsn') npsn = resultString;
      else if (block.type === 'identity_subject') id_mapel = resultString;
      else if (block.type === 'identity_test') kode_tes = resultString;
      else if (block.type === 'identity_nisn') nisn = resultString;

    // ==========================================
    // B. BLOK SOAL HORIZONTAL (PG, PGK, BS3, YT3, JODOH)
    // ==========================================
    } else if (block.direction === 'horizontal') {
      const rows = block.rows || 1;
      const opts = block.options || [];
      const isTriple = block.type === 'bs3' || block.type === 'yt3';
      const totalRows = isTriple ? rows * 3 : rows;
      const tripleAnswers: Record<number, string[]> = {};

      for (let r = 1; r <= totalRows; r++) {
        const qNum = (block.startNum || 0) + (isTriple ? Math.floor((r - 1) / 3) : r - 1);
        const subIndex = isTriple ? (r - 1) % 3 : 0;

        let maxIntensity = -1;
        let secondIntensity = -1;
        let selectedValue = '';
        let rowSum = 0;
        const optionScores: Array<{ opt: string; intensity: number }> = [];

        opts.forEach((_opt: string, oIdx: number) => {
          const subId = isTriple ? `_sub${subIndex}` : '';
          const bubbleId = `${block.id}_q${qNum}${subId}_opt${oIdx}`;
          const vBubble = vectorRois.find(b => b.id === bubbleId);

          if (vBubble) {
            const cx = Math.round(vBubble.normX * sheetW);
            const cy = Math.round(vBubble.normY * sheetH);
            const br = Math.max(4, Math.round(vBubble.normR * sheetW));

            const isBox = Boolean(vBubble.isBox || block.type === 'kompleks');
            const intensity = sampleBubbleCoreIntensity(threshMat, cv, cx, cy, br, sheetW, sheetH, isBox);
            rowSum += intensity;
            optionScores.push({ opt: vBubble.value, intensity });

            if (intensity > maxIntensity) {
              secondIntensity = maxIntensity;
              maxIntensity = intensity;
              selectedValue = vBubble.value;
            } else if (intensity > secondIntensity) {
              secondIntensity = intensity;
            }
          }
        });

        const avgOther = opts.length > 1 ? (rowSum - maxIntensity) / (opts.length - 1) : 0;
        const contrastRatio = avgOther > 1 ? maxIntensity / avgOther : (maxIntensity > 30 ? 3 : 1);
        const separation = Math.max(0, maxIntensity - secondIntensity);

        totalContrastSeparation += separation / 255.0;
        evaluatedItemsCount++;

        // 1. Pilihan Ganda Kompleks (Kotak Centang Mandiri)
        if (block.type === 'kompleks') {
          const selectedBoxes: string[] = [];
          
          // Cari batas intensitas terendah pada baris kotak ini sebagai baseline huruf cetak
          const rowIntensities = optionScores.map(item => item.intensity);
          const minIntensity = rowIntensities.length > 0 ? Math.min(...rowIntensities) : 0;

          // Baseline huruf cetak kosong di dalam kotak bernilai 25-65.
          // Kotak dinyatakan benar-benar diarsir pensil/pulpen pekat jika:
          // 1. Intensitas absolut sangat tinggi (>= 115)
          // 2. ATAU intensitas >= 85 DAN melampaui baseline kosong setidaknya 1.7x + 20
          const dynamicThreshold = Math.max(105, minIntensity * 1.7 + 20);

          optionScores.forEach(item => {
            const isMarked = (item.intensity >= 115) || 
                             (item.intensity >= 85 && item.intensity >= dynamicThreshold);
            if (isMarked) {
              selectedBoxes.push(item.opt);
            }
          });

          if (selectedBoxes.length > 0) detectedMarksCount += selectedBoxes.length;

          answers.push({
            nomor_soal: qNum,
            bentuk_soal: block.type,
            jawaban: selectedBoxes
          });

        // 2. Soal Bertingkat (BS3 / YT3: 3 Baris per Butir Soal)
        } else if (isTriple) {
          if (!tripleAnswers[qNum]) tripleAnswers[qNum] = [];
          const isFilled = maxIntensity >= 32 && (separation >= 14 || contrastRatio >= 1.5);
          const finalVal = isFilled ? selectedValue : '-';
          if (isFilled) detectedMarksCount++;
          tripleAnswers[qNum].push(finalVal);

        // 3. Pilihan Ganda Tunggal (PG Biasa, BS, YT, atau Jodoh)
        } else {
          const isFilled = maxIntensity >= 35 && (separation >= 16 || contrastRatio >= 1.5);
          const finalVal = isFilled ? selectedValue : '-';
          if (isFilled) detectedMarksCount++;

          answers.push({
            nomor_soal: qNum,
            bentuk_soal: block.type,
            jawaban: finalVal
          });
        }
      }

      // Kumpulkan hasil BS3 / YT3 ke array jawaban utama
      if (isTriple) {
        for (const [qn, ansArr] of Object.entries(tripleAnswers)) {
          answers.push({
            nomor_soal: Number(qn),
            bentuk_soal: block.type,
            jawaban: ansArr
          });
        }
      }
    }
  });

  const contrastScore = evaluatedItemsCount > 0 ? totalContrastSeparation / evaluatedItemsCount : 0.5;

  return {
    npsn,
    id_mapel,
    kode_tes,
    nisn,
    answers,
    contrastScore,
    detectedMarksCount
  };
}
