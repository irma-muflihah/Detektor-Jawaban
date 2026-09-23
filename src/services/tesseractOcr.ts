import { createWorker, type Worker } from 'tesseract.js';
import type { NormalizedFieldROI } from '../db/database';

let ocrWorker: Worker | null = null;
let initPromise: Promise<Worker> | null = null;

/**
 * Mengambil atau menginisialisasi Tesseract Worker secara lazy-loading
 */
async function getWorker(): Promise<Worker> {
  if (ocrWorker) return ocrWorker;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      const worker = await createWorker('eng+ind', 1, {
        logger: () => {}, // Heningkan log konsol verbose
      });
      ocrWorker = worker;
      return worker;
    } catch (err) {
      // Fallback ke bahasa Inggris jika ind gagal dimuat
      console.warn('Gagal memuat korpus eng+ind, beralih ke eng:', err);
      const worker = await createWorker('eng', 1);
      ocrWorker = worker;
      return worker;
    }
  })();

  return initPromise;
}

/**
 * Prapemrosesan citra potongan tulisan tangan:
 * Grayscale + Peningkatan Kontras + Thresholding adaptif untuk ketajaman goresan tinta/pensil
 */
function preprocessCrop(
  sourceCanvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): HTMLCanvasElement {
  const cropCanvas = document.createElement('canvas');
  // Upscale sedikit (x2) untuk meningkatkan akurasi Tesseract pada karakter kecil
  const scale = 2;
  cropCanvas.width = Math.max(10, Math.round(width * scale));
  cropCanvas.height = Math.max(10, Math.round(height * scale));

  const ctx = cropCanvas.getContext('2d');
  if (!ctx) return cropCanvas;

  // Render crop dengan penajaman
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(
    sourceCanvas,
    Math.max(0, Math.round(x)),
    Math.max(0, Math.round(y)),
    Math.max(1, Math.round(width)),
    Math.max(1, Math.round(height)),
    0,
    0,
    cropCanvas.width,
    cropCanvas.height
  );

  const imgData = ctx.getImageData(0, 0, cropCanvas.width, cropCanvas.height);
  const data = imgData.data;

  // Grayscale & Adaptive contrast stretch
  let minLum = 255;
  let maxLum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    data[i] = lum;
    data[i + 1] = lum;
    data[i + 2] = lum;
    if (lum < minLum) minLum = lum;
    if (lum > maxLum) maxLum = lum;
  }

  // Normalisasi kontras jika rentang luminansi cukup
  const range = maxLum - minLum;
  if (range > 30) {
    for (let i = 0; i < data.length; i += 4) {
      const stretched = Math.min(255, Math.max(0, Math.round(((data[i] - minLum) / range) * 255)));
      // Binarize / High-pass contrast
      const binarized = stretched < 145 ? 0 : 255;
      data[i] = binarized;
      data[i + 1] = binarized;
      data[i + 2] = binarized;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return cropCanvas;
}

/**
 * Ekstraksi OCR tulisan tangan khusus 4 data esensial:
 * - Nama Siswa
 * - Kelas
 * - Nomor Peserta
 * - Tanggal Ujian
 * (Tanda tangan, catatan, dan pernyataan kejujuran sengaja diabaikan)
 */
export async function recognizeEssentialHandwriting(
  sheetCanvas: HTMLCanvasElement,
  fields?: NormalizedFieldROI[]
): Promise<{
  nama_siswa: string;
  kelas: string;
  no_peserta: string;
  tanggal_ujian: string;
}> {
  const result = {
    nama_siswa: '',
    kelas: '',
    no_peserta: '',
    tanggal_ujian: ''
  };

  // Gunakan field default jika tidak disuplai
  const actualFields: NormalizedFieldROI[] = (fields && fields.length > 0)
    ? fields
    : [
        {
          key: 'nama_lengkap',
          label: 'Nama Lengkap',
          normX: 150 / 1000,
          normY: 108 / 1414,
          normWidth: 790 / 1000,
          normHeight: 28 / 1414
        },
        {
          key: 'kelas',
          label: 'Kelas',
          normX: 150 / 1000,
          normY: 156 / 1414,
          normWidth: 150 / 1000,
          normHeight: 28 / 1414
        },
        {
          key: 'no_peserta',
          label: 'No. Peserta',
          normX: 315 / 1000,
          normY: 156 / 1414,
          normWidth: 150 / 1000,
          normHeight: 28 / 1414
        },
        {
          key: 'tanggal_pelaksanaan',
          label: 'Tanggal Pelaksanaan',
          normX: 480 / 1000,
          normY: 156 / 1414,
          normWidth: 460 / 1000,
          normHeight: 28 / 1414
        }
      ];

  try {
    const worker = await getWorker();
    const sheetW = sheetCanvas.width;
    const sheetH = sheetCanvas.height;

    for (const field of actualFields) {
      const cropX = field.normX * sheetW;
      const cropY = field.normY * sheetH;
      const cropW = field.normWidth * sheetW;
      const cropH = field.normHeight * sheetH;

      const preprocessedCanvas = preprocessCrop(sheetCanvas, cropX, cropY, cropW, cropH);

      // Parameter whitelist karakter per jenis field
      let whitelist = '';
      if (field.key === 'nama_lengkap') {
        whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz .,\'-';
      } else if (field.key === 'kelas' || field.key === 'no_peserta') {
        whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 -/';
      } else if (field.key === 'tanggal_pelaksanaan') {
        whitelist = '0123456789 -/ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
      }

      await worker.setParameters({
        tessedit_char_whitelist: whitelist || undefined,
        tessedit_pageseg_mode: '7' as any, // Single text line
      });

      const res = await worker.recognize(preprocessedCanvas);
      const cleanText = (res.data.text || '').replace(/[\r\n\t]/g, ' ').trim();

      if (field.key === 'nama_lengkap') {
        result.nama_siswa = cleanText;
      } else if (field.key === 'kelas') {
        result.kelas = cleanText;
      } else if (field.key === 'no_peserta') {
        result.no_peserta = cleanText;
      } else if (field.key === 'tanggal_pelaksanaan') {
        result.tanggal_ujian = cleanText;
      }
    }
  } catch (err) {
    console.warn('[Tesseract OCR] Gagal memproses OCR tulisan tangan esensial:', err);
  }

  return result;
}

/**
 * Membersihkan worker Tesseract jika komponen di-unmount
 */
export async function terminateOcrWorker(): Promise<void> {
  if (ocrWorker) {
    try {
      await ocrWorker.terminate();
    } catch (_) {}
    ocrWorker = null;
    initPromise = null;
  }
}
