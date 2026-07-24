import { OptionType } from '../types';

/**
 * Generates a realistic LJK (Lembar Jawaban Komputer) sample image as a data URL
 * so users can test scanning immediately without needing a physical sheet!
 */
export function generateSampleLjkDataUrl(
  studentName: string,
  studentId: string,
  className: string,
  totalQuestions: number = 20,
  optionCount: number = 5,
  answersOverride?: Record<number, OptionType | ''>
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 1100;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - Off-white paper texture
  ctx.fillStyle = '#f8f9fa';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & Padding
  ctx.strokeStyle = '#222222';
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Corner Fiducial Alignment Markers (Black Squares for OMR calibration)
  const markerSize = 28;
  ctx.fillStyle = '#000000';
  ctx.fillRect(35, 35, markerSize, markerSize); // Top-Left
  ctx.fillRect(canvas.width - 35 - markerSize, 35, markerSize, markerSize); // Top-Right
  ctx.fillRect(35, canvas.height - 35 - markerSize, markerSize, markerSize); // Bottom-Left
  ctx.fillRect(canvas.width - 35 - markerSize, canvas.height - 35 - markerSize, markerSize, markerSize); // Bottom-Right

  // Header Title
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LEMBAR JAWABAN KOMPUTER (LJK)', canvas.width / 2, 65);

  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('SMPN 2 KEMRANJEN', canvas.width / 2, 88);

  ctx.beginPath();
  ctx.moveTo(40, 105);
  ctx.lineTo(canvas.width - 40, 105);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Student Info Box
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1f2937';
  ctx.font = 'bold 13px Arial, sans-serif';

  // Drawn written info text
  ctx.fillText(`NAMA SISWA  : ${studentName.toUpperCase()}`, 50, 135);
  ctx.fillText(`NO. UJIAN/NIS: ${studentId}`, 50, 160);
  ctx.fillText(`KELAS       : ${className.toUpperCase()}`, 50, 185);

  // Instructions
  ctx.fillStyle = '#374151';
  ctx.font = 'italic 11px Arial, sans-serif';
  ctx.fillText('Petunjuk: Hitamkan bulatan menggunakan pensil 2B pada satu opsi pilihan.', 50, 210);

  ctx.beginPath();
  ctx.moveTo(40, 225);
  ctx.lineTo(canvas.width - 40, 225);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Default answer pattern if override not specified
  const options: OptionType[] = optionCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  const defaultAnswers: Record<number, OptionType> = {
    1: 'A', 2: 'C', 3: 'B', 4: 'D', 5: 'E',
    6: 'A', 7: 'B', 8: 'C', 9: 'E', 10: 'D',
    11: 'B', 12: 'A', 13: 'C', 14: 'D', 15: 'E',
    16: 'A', 17: 'B', 18: 'C', 19: 'D', 20: 'E'
  };

  const finalAnswers = answersOverride || defaultAnswers;

  // Answer Grid Rendering
  const startY = 250;
  const colWidth = 340;
  const questionsPerCol = 10;
  const totalCols = Math.ceil(totalQuestions / questionsPerCol);

  for (let col = 0; col < totalCols; col++) {
    const startQ = col * questionsPerCol + 1;
    const endQ = Math.min((col + 1) * questionsPerCol, totalQuestions);
    const colX = 50 + col * colWidth;

    // Header Column
    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(colX, startY, 320, 25);
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(colX, startY, 320, 25);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText(`NO.  OPSI JAWABAN (${options.join(' ')})`, colX + 10, startY + 17);

    for (let q = startQ; q <= endQ; q++) {
      const qIndexInCol = q - startQ;
      const rowY = startY + 30 + qIndexInCol * 36;

      // Draw question number
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.fillText(`${q < 10 ? '0' + q : q}.`, colX + 10, rowY + 18);

      // Draw options A, B, C, D, E bubbles
      options.forEach((opt, optIndex) => {
        const bubbleX = colX + 60 + optIndex * 48;
        const bubbleY = rowY + 12;
        const radius = 11;

        const isFilled = finalAnswers[q] === opt;

        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, radius, 0, Math.PI * 2);

        if (isFilled) {
          // Dark filled graphite bubble with realistic pencil shading texture
          ctx.fillStyle = '#18181b';
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // White option letter inside filled bubble
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, bubbleX, bubbleY + 4);
          ctx.textAlign = 'left';
        } else {
          // Empty bubble circle
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.strokeStyle = '#4b5563';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Dark option letter inside empty bubble
          ctx.fillStyle = '#4b5563';
          ctx.font = '11px Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(opt, bubbleX, bubbleY + 4);
          ctx.textAlign = 'left';
        }
      });
    }
  }

  // Footer Note
  ctx.fillStyle = '#6b7280';
  ctx.font = '10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('eLjeka OMR Digital Sheet - Generasi Otomatis Ujian Sekolah', canvas.width / 2, canvas.height - 50);

  return canvas.toDataURL('image/jpeg', 0.9);
}
