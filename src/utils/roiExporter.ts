import type { OmrTemplate, TemplateBlock } from '../db/database';

export interface BoundingBoxROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BubblePointROI {
  id: string;
  cx: number;
  cy: number;
  radius: number;
  value: string;
  shape: 'circle' | 'box';
  bounding_box: BoundingBoxROI;
  col_index?: number;
  row_index?: number;
  question_num?: number;
  sub_num?: number;
  is_prefilled?: boolean;
}

export interface HandwrittenFieldROI {
  key: string;
  label: string;
  bounding_box: BoundingBoxROI;
  expected_text?: string;
}

export interface DigitBoxROI {
  col_index: number;
  bounding_box: BoundingBoxROI;
  center: { cx: number; cy: number };
  prefill_char: string;
}

export interface QuestionItemROI {
  question_num: number;
  sub_index?: number;
  row_y_center: number;
  bubbles: BubblePointROI[];
}

export interface BlockExportROI {
  id: number | string;
  type: string;
  title: string;
  direction?: string;
  bounding_box: BoundingBoxROI;
  handwritten_fields?: HandwrittenFieldROI[];
  digit_boxes?: DigitBoxROI[];
  bubbles?: BubblePointROI[];
  questions?: QuestionItemROI[];
  custom_text?: string;
}

export interface OmrRoiJsonExport {
  schema_version: string;
  generated_at: string;
  generator: string;
  metadata: {
    template_id: string;
    template_name: string;
    updated_at: number;
    sheet_standard: string;
    orientation: string;
    canvas: {
      width: number;
      height: number;
      unit: string;
    };
    title_element: {
      text: string;
      x: number;
      y: number;
      font_size: number;
      text_anchor: string;
    };
  };
  optical_alignment: {
    fiducial_marks: Array<{
      position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
      outer_box: BoundingBoxROI;
      center_dot: { cx: number; cy: number; radius: number };
    }>;
    ticker_marks: {
      top_horizontal: BoundingBoxROI[];
      bottom_horizontal: BoundingBoxROI[];
      left_vertical: BoundingBoxROI[];
      right_vertical: BoundingBoxROI[];
      count: {
        horizontal_per_edge: number;
        vertical_per_edge: number;
        total: number;
      };
    };
  };
  summary: {
    total_blocks: number;
    total_bubbles: number;
    total_digit_boxes: number;
    total_handwritten_fields: number;
    question_count: number;
  };
  blocks: BlockExportROI[];
}

export function generateOmrRoiJson(template: OmrTemplate): OmrRoiJsonExport {
  let totalBubbles = 0;
  let totalDigitBoxes = 0;
  let totalHandwrittenFields = 0;
  let questionCount = 0;

  // 1. Optical Alignment - Fiducial Marks (4 corners)
  const fiducial_marks: OmrRoiJsonExport['optical_alignment']['fiducial_marks'] = [
    {
      position: 'top_left',
      outer_box: { x: 30, y: 30, width: 40, height: 40 },
      center_dot: { cx: 50, cy: 50, radius: 8 }
    },
    {
      position: 'top_right',
      outer_box: { x: 930, y: 30, width: 40, height: 40 },
      center_dot: { cx: 950, cy: 50, radius: 8 }
    },
    {
      position: 'bottom_left',
      outer_box: { x: 30, y: 1344, width: 40, height: 40 },
      center_dot: { cx: 50, cy: 1364, radius: 8 }
    },
    {
      position: 'bottom_right',
      outer_box: { x: 930, y: 1344, width: 40, height: 40 },
      center_dot: { cx: 950, cy: 1364, radius: 8 }
    }
  ];

  // 2. Optical Alignment - Timing Ticker Marks
  const top_horizontal: BoundingBoxROI[] = [];
  const bottom_horizontal: BoundingBoxROI[] = [];
  for (let i = 1; i <= 18; i++) {
    const x = Math.round((46 + (i * 46.3)) * 100) / 100;
    top_horizontal.push({ x, y: 46, width: 4, height: 8 });
    bottom_horizontal.push({ x, y: 1360, width: 4, height: 8 });
  }

  const left_vertical: BoundingBoxROI[] = [];
  const right_vertical: BoundingBoxROI[] = [];
  for (let i = 1; i <= 30; i++) {
    const y = Math.round((46 + (i * 41.5)) * 100) / 100;
    left_vertical.push({ x: 46, y, width: 8, height: 4 });
    right_vertical.push({ x: 946, y, width: 8, height: 4 });
  }

  // 3. Process Blocks
  const processedBlocks: BlockExportROI[] = (template.blocks || []).map((block: TemplateBlock) => {
    if (block.type === 'handwritten_identity') {
      const fields: HandwrittenFieldROI[] = [
        {
          key: 'nama_lengkap',
          label: 'Nama Lengkap',
          bounding_box: { x: block.x + 15, y: block.y + 28, width: 790, height: 24 }
        },
        {
          key: 'kelas',
          label: 'Kelas',
          bounding_box: { x: block.x + 15, y: block.y + 76, width: 150, height: 24 }
        },
        {
          key: 'no_peserta',
          label: 'No. Peserta',
          bounding_box: { x: block.x + 180, y: block.y + 76, width: 150, height: 24 }
        },
        {
          key: 'tanggal_pelaksanaan',
          label: 'Tanggal Pelaksanaan Tes',
          bounding_box: { x: block.x + 345, y: block.y + 76, width: 460, height: 24 }
        },
        {
          key: 'pernyataan_kejujuran',
          label: 'Pernyataan Kejujuran',
          expected_text: 'Saya mengerjakan tes dengan jujur.',
          bounding_box: { x: block.x + 15, y: block.y + 132, width: 550, height: 48 }
        },
        {
          key: 'tanda_tangan',
          label: 'Tanda Tangan',
          bounding_box: { x: block.x + 580, y: block.y + 132, width: 225, height: 48 }
        }
      ];

      totalHandwrittenFields += fields.length;

      return {
        id: block.id,
        type: block.type,
        title: block.title,
        direction: 'handwritten',
        bounding_box: { x: block.x, y: block.y, width: 820, height: 195 },
        handwritten_fields: fields
      };
    }

    if (block.direction === 'vertical') {
      const cols = block.cols || 1;
      const rows = block.rows || 10;
      const opts = block.options && block.options.length > 0 ? block.options : ['0','1','2','3','4','5','6','7','8','9'];
      const prefill = (block.prefillValue || '').toString();

      // Digit Boxes
      const digit_boxes: DigitBoxROI[] = [];
      for (let c = 1; c <= cols; c++) {
        digit_boxes.push({
          col_index: c,
          bounding_box: { x: block.x + (c - 1) * 32 + 9, y: block.y + 5, width: 24, height: 24 },
          center: { cx: block.x + (c - 1) * 32 + 21, cy: block.y + 17 },
          prefill_char: prefill[c - 1] || ''
        });
      }
      totalDigitBoxes += digit_boxes.length;

      // Bubbles
      const bubbles: BubblePointROI[] = [];
      for (let c = 1; c <= cols; c++) {
        for (let r = 1; r <= rows; r++) {
          const val = opts[r - 1] || `${r - 1}`;
          const cx = block.x + (c - 1) * 32 + 21;
          const cy = block.y + r * 28 + 20;
          bubbles.push({
            id: `col${c}_row${r}`,
            col_index: c,
            row_index: r,
            value: val,
            cx,
            cy,
            radius: 10,
            shape: 'circle',
            bounding_box: { x: cx - 10, y: cy - 10, width: 20, height: 20 },
            is_prefilled: prefill[c - 1] === val
          });
        }
      }
      totalBubbles += bubbles.length;

      return {
        id: block.id,
        type: block.type,
        title: block.title,
        direction: 'vertical',
        bounding_box: {
          x: block.x,
          y: block.y,
          width: cols * 32 + 20,
          height: rows * 28 + 60
        },
        digit_boxes,
        bubbles
      };
    }

    if (block.direction === 'horizontal') {
      const rows = block.rows || 1;
      const opts = block.options || ['A', 'B', 'C', 'D'];
      const isTriple = block.type === 'bs3' || block.type === 'yt3';
      const totalRows = isTriple ? rows * 3 : rows;
      const isComplex = block.type === 'kompleks';

      const questionsMap = new Map<string, QuestionItemROI>();
      const allBubbles: BubblePointROI[] = [];

      for (let r = 1; r <= totalRows; r++) {
        const qOffset = isTriple ? Math.floor((r - 1) / 3) : (r - 1);
        const qNum = (block.startNum || 1) + qOffset;
        const subIndex = isTriple ? ((r - 1) % 3) + 1 : undefined;
        const qKey = isTriple ? `q_${qNum}_s${subIndex}` : `q_${qNum}`;

        const cy = block.y + (r - 1) * 30 + 20;

        const rowBubbles: BubblePointROI[] = opts.map((opt, oIdx) => {
          const cx = block.x + oIdx * 35 + 45;
          const subIdStr = isTriple ? `_sub${(r - 1) % 3}` : '';
          const bId = `q${qNum}${subIdStr}_opt${oIdx}`;
          const bBox: BoundingBoxROI = isComplex
            ? { x: block.x + oIdx * 35 + 35, y: block.y + (r - 1) * 30 + 10, width: 20, height: 20 }
            : { x: cx - 10, y: cy - 10, width: 20, height: 20 };

          return {
            id: bId,
            question_num: qNum,
            sub_num: subIndex,
            value: opt,
            cx,
            cy,
            radius: 10,
            shape: isComplex ? 'box' : 'circle',
            bounding_box: bBox
          };
        });

        questionsMap.set(qKey, {
          question_num: qNum,
          sub_index: subIndex,
          row_y_center: cy,
          bubbles: rowBubbles
        });

        allBubbles.push(...rowBubbles);
      }

      totalBubbles += allBubbles.length;
      questionCount += rows;

      return {
        id: block.id,
        type: block.type,
        title: block.title,
        direction: 'horizontal',
        bounding_box: {
          x: block.x,
          y: block.y,
          width: opts.length * 35 + 50,
          height: totalRows * 30 + 10
        },
        questions: Array.from(questionsMap.values()),
        bubbles: allBubbles
      };
    }

    if (block.type === 'teks_kustom' || block.direction === 'teks') {
      const w = block.cols || 250;
      const h = block.rows || 95;
      return {
        id: block.id,
        type: 'teks_kustom',
        title: block.title,
        direction: 'teks',
        bounding_box: { x: block.x, y: block.y, width: w, height: h },
        custom_text: (block.prefillValue || '').toString()
      };
    }

    // Fallback block
    const w = block.cols || 150;
    const h = block.rows || 50;
    return {
      id: block.id,
      type: block.type,
      title: block.title,
      bounding_box: { x: block.x, y: block.y, width: w, height: h }
    };
  });

  return {
    schema_version: '2.0.0',
    generated_at: new Date().toISOString(),
    generator: 'DEJAWAB - Detektor Jawaban & Lembar Jawab Komputer Enterprise',
    metadata: {
      template_id: template.id,
      template_name: template.name,
      updated_at: template.updatedAt || Date.now(),
      sheet_standard: 'A4',
      orientation: 'portrait',
      canvas: {
        width: 1000,
        height: 1414,
        unit: 'pixels'
      },
      title_element: {
        text: template.name,
        x: 500,
        y: 95,
        font_size: 26,
        text_anchor: 'middle'
      }
    },
    optical_alignment: {
      fiducial_marks,
      ticker_marks: {
        top_horizontal,
        bottom_horizontal,
        left_vertical,
        right_vertical,
        count: {
          horizontal_per_edge: 18,
          vertical_per_edge: 30,
          total: 18 * 2 + 30 * 2
        }
      }
    },
    summary: {
      total_blocks: processedBlocks.length,
      total_bubbles: totalBubbles,
      total_digit_boxes: totalDigitBoxes,
      total_handwritten_fields: totalHandwrittenFields,
      question_count: questionCount
    },
    blocks: processedBlocks
  };
}

export function downloadJsonFile(data: unknown, filename: string): void {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
