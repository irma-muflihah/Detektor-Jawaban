/**
 * Layanan Deteksi & Penyelarasan Orientasi Citra LJK (Upright Portrait Normalization)
 * Mendeteksi orientasi landscape (90°, 270°) dan posisi terbalik (180°),
 * kemudian mentransformasikan lembar LJK menjadi potret tegak lurus (A4 1000x1414)
 * dengan judul/kop lembar LJK berada di bagian atas.
 */

export interface RectificationResult {
  rectifiedMat: any;
  canvas: HTMLCanvasElement;
  dataUrl: string;
  detectedRotation: 0 | 90 | 180 | 270;
  isLandscape: boolean;
  isFlipped: boolean;
}

/**
 * Menghitung jarak euclidean antara dua titik
 */
const dist = (p1: { x: number; y: number }, p2: { x: number; y: number }): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Menentukan urutan 4 titik (Top-Left, Top-Right, Bottom-Right, Bottom-Left)
 * dan memeriksa apakah orientasi kontur berada dalam posisi mendatar (landscape).
 */
function orderCornerPoints(pts: Array<{ x: number; y: number }>): {
  ordered: Array<{ x: number; y: number }>;
  isLandscape: boolean;
} {
  // Urutkan titik berdasarkan sumbu Y
  const sortedY = [...pts].sort((a, b) => a.y - b.y);
  const topPair = [sortedY[0], sortedY[1]].sort((a, b) => a.x - b.x);
  const botPair = [sortedY[2], sortedY[3]].sort((a, b) => a.x - b.x);

  let tl = topPair[0];
  let tr = topPair[1];
  let br = botPair[1];
  let bl = botPair[0];

  const topWidth = dist(tl, tr);
  const botWidth = dist(bl, br);
  const leftHeight = dist(tl, bl);
  const rightHeight = dist(tr, br);

  const avgWidth = (topWidth + botWidth) / 2;
  const avgHeight = (leftHeight + rightHeight) / 2;

  // Jika lebar rata-rata lebih panjang dari tinggi rata-rata, berarti LJK berada dalam orientasi landscape
  const isLandscape = avgWidth > avgHeight * 1.15;

  if (isLandscape) {
    // Pada orientasi mendatar, kita putar urutan titik 90 derajat searah jarum jam:
    // Sisi yang tadinya vertikal dipetakan menjadi lebar target (1000), dan sisi horizontal menjadi tinggi (1414)
    return {
      ordered: [bl, tl, tr, br],
      isLandscape: true,
    };
  }

  return {
    ordered: [tl, tr, br, bl],
    isLandscape: false,
  };
}

/**
 * Menghitung rasio kepadatan goresan / teks pada kuadran atas vs kuadran bawah
 * LJK standar selalu memiliki kop, judul, dan data identitas di 25% area atas.
 */
function isUpsideDownByDensity(threshMat: any, cv: any, width = 1000, height = 1414): boolean {
  try {
    // Area kop atas (Y: 2% - 18%)
    const topRoiRect = new cv.Rect(
      Math.round(width * 0.05),
      Math.round(height * 0.02),
      Math.round(width * 0.90),
      Math.round(height * 0.16)
    );
    const topRoi = threshMat.roi(topRoiRect);
    const topMean = cv.mean(topRoi)[0];
    topRoi.delete();

    // Area bawah (Y: 82% - 98%)
    const botRoiRect = new cv.Rect(
      Math.round(width * 0.05),
      Math.round(height * 0.82),
      Math.round(width * 0.90),
      Math.round(height * 0.16)
    );
    const botRoi = threshMat.roi(botRoiRect);
    const botMean = cv.mean(botRoi)[0];
    botRoi.delete();

    // Jika area bawah secara konsisten memiliki densitas teks hitam/putih lebih tinggi dari area atas,
    // maka lembar LJK berada dalam posisi terbalik 180 derajat.
    return botMean > topMean * 1.35;
  } catch (err) {
    console.warn('[ImageOrientation] Gagal menghitung densitas header:', err);
    return false;
  }
}

/**
 * Melakukan perataan perspektif (homography) dan koreksi orientasi otomatis ke Potret Tegak Lurus (1000x1414)
 */
export function rectifyAndOrientLjkSheet(
  srcMat: any,
  cv: any,
  targetW = 1000,
  targetH = 1414
): RectificationResult {
  let gray = new cv.Mat();
  let blur = new cv.Mat();
  let edges = new cv.Mat();
  let contours = new cv.MatVector();
  let hierarchy = new cv.Mat();
  let rectified = new cv.Mat();
  let thresh = new cv.Mat();

  let isLandscape = false;
  let isFlipped = false;
  let detectedRotation: 0 | 90 | 180 | 270 = 0;

  try {
    cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY, 0);
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
    cv.Canny(blur, edges, 50, 150);

    cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

    let maxArea = 0;
    let bestPoly: any = null;
    const minArea = srcMat.rows * srcMat.cols * 0.18;

    for (let i = 0; i < contours.size(); i++) {
      const cnt = contours.get(i);
      const area = cv.contourArea(cnt);
      if (area > minArea && area > maxArea) {
        const peri = cv.arcLength(cnt, true);
        const approx = new cv.Mat();
        cv.approxPolyDP(cnt, approx, 0.02 * peri, true);
        if (approx.rows === 4) {
          maxArea = area;
          if (bestPoly) bestPoly.delete();
          bestPoly = approx;
        } else {
          approx.delete();
        }
      }
      cnt.delete();
    }

    if (bestPoly) {
      const pts: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < 4; i++) {
        pts.push({ x: bestPoly.data32S[i * 2], y: bestPoly.data32S[i * 2 + 1] });
      }
      bestPoly.delete();

      const orderedCorners = orderCornerPoints(pts);
      isLandscape = orderedCorners.isLandscape;
      const sorted = orderedCorners.ordered;

      const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        sorted[0].x, sorted[0].y,
        sorted[1].x, sorted[1].y,
        sorted[2].x, sorted[2].y,
        sorted[3].x, sorted[3].y,
      ]);

      const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
        0, 0,
        targetW, 0,
        targetW, targetH,
        0, targetH,
      ]);

      const M = cv.getPerspectiveTransform(srcTri, dstTri);
      cv.warpPerspective(
        srcMat,
        rectified,
        M,
        new cv.Size(targetW, targetH),
        cv.INTER_LINEAR,
        cv.BORDER_CONSTANT,
        new cv.Scalar(255, 255, 255, 255)
      );

      srcTri.delete();
      dstTri.delete();
      M.delete();
    } else {
      // Jika poligon 4 sisi tidak terdeteksi, periksa orientasi matriks sumber
      if (srcMat.cols > srcMat.rows) {
        // Matriks gambar sumber adalah landscape
        isLandscape = true;
        let rotatedTemp = new cv.Mat();
        cv.rotate(srcMat, rotatedTemp, cv.ROTATE_90_CLOCKWISE);
        cv.resize(rotatedTemp, rectified, new cv.Size(targetW, targetH), 0, 0, cv.INTER_LINEAR);
        rotatedTemp.delete();
      } else {
        cv.resize(srcMat, rectified, new cv.Size(targetW, targetH), 0, 0, cv.INTER_LINEAR);
      }
    }

    // Periksa apakah hasil potret terbalik (180 derajat)
    let grayRect = new cv.Mat();
    cv.cvtColor(rectified, grayRect, cv.COLOR_RGBA2GRAY, 0);
    cv.threshold(grayRect, thresh, 0, 255, cv.THRESH_BINARY_INV + cv.THRESH_OTSU);
    grayRect.delete();

    if (isUpsideDownByDensity(thresh, cv, targetW, targetH)) {
      isFlipped = true;
      let flippedMat = new cv.Mat();
      cv.rotate(rectified, flippedMat, cv.ROTATE_180);
      rectified.delete();
      rectified = flippedMat;
    }

    // Tentukan label rotasi yang diterapkan
    if (isLandscape && isFlipped) detectedRotation = 270;
    else if (isLandscape) detectedRotation = 90;
    else if (isFlipped) detectedRotation = 180;
    else detectedRotation = 0;

    // Render ke HTML5 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    cv.imshow(canvas, rectified);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

    return {
      rectifiedMat: rectified,
      canvas,
      dataUrl,
      detectedRotation,
      isLandscape,
      isFlipped,
    };
  } finally {
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
    thresh.delete();
  }
}

/**
 * Mengubah elemen gambar/video apapun menjadi HTMLCanvasElement potret tegak lurus (1000x1414)
 * Siap untuk dikirim ke Gemini AI Vision, OpenCV, atau Tesseract OCR.
 */
export function normalizeSourceToUprightCanvas(
  source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
  cv: any
): { canvas: HTMLCanvasElement; dataUrl: string; detectedRotation: number } {
  const naturalW = (source as any).naturalWidth || (source as any).videoWidth || (source as any).width || 1280;
  const naturalH = (source as any).naturalHeight || (source as any).videoHeight || (source as any).height || 720;

  const rawCanvas = document.createElement('canvas');
  rawCanvas.width = naturalW;
  rawCanvas.height = naturalH;
  const rawCtx = rawCanvas.getContext('2d');
  if (!rawCtx) {
    throw new Error('Gagal mendapatkan konteks kanvas sumber.');
  }
  rawCtx.drawImage(source, 0, 0, naturalW, naturalH);

  let srcMat = cv.imread(rawCanvas);
  try {
    const res = rectifyAndOrientLjkSheet(srcMat, cv, 1000, 1414);
    res.rectifiedMat.delete(); // Matriks OpenCV tidak dibutuhkan lagi di memori
    return {
      canvas: res.canvas,
      dataUrl: res.dataUrl,
      detectedRotation: res.detectedRotation,
    };
  } finally {
    srcMat.delete();
  }
}
