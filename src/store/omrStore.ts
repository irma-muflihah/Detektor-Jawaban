import { defineStore } from 'pinia';
import { db, type OmrTemplate, type TemplateBlock, type BubbleROI } from '../db/database';
import { saveBaselineRoi } from '../utils/roiVectorService';
import { importOmrTemplateFromJson } from '../utils/roiExporter';
import { ref } from 'vue';

export const useOmrStore = defineStore('omr', () => {
  const computeBlockBubbles = (block: TemplateBlock): BubbleROI[] => {
    const bubbles: BubbleROI[] = [];
    if (block.direction === 'vertical') {
      const cols = block.cols || 0;
      const rows = block.rows || 10;
      const opts = block.options || [];
      for (let c = 1; c <= cols; c++) {
        for (let r = 1; r <= rows; r++) {
          bubbles.push({
            id: `col${c}_row${r}`,
            cx: block.x + (c - 1) * 32 + 21,
            cy: block.y + r * 28 + 20,
            r: 10,
            value: opts[r - 1] || `${r - 1}`
          });
        }
      }
    } else if (block.direction === 'horizontal') {
      const rows = block.rows || 1;
      const opts = block.options || [];
      const isTriple = block.type === 'bs3' || block.type === 'yt3';
      const totalRows = isTriple ? rows * 3 : rows;
      for (let r = 1; r <= totalRows; r++) {
        const qNum = (block.startNum || 0) + (isTriple ? Math.floor((r - 1) / 3) : r - 1);
        opts.forEach((opt, oIdx) => {
          const subId = isTriple ? `_sub${(r - 1) % 3}` : '';
          const bubbleId = `q${qNum}${subId}_opt${oIdx}`;
          if (block.type === 'kompleks') {
            bubbles.push({
              id: bubbleId,
              cx: block.x + oIdx * 35 + 45, // center of 20x20 rect at x=35
              cy: block.y + (r - 1) * 30 + 20, // center of 20x20 rect at y=10
              r: 10,
              value: opt,
              isBox: true
            });
          } else {
            bubbles.push({
              id: bubbleId,
              cx: block.x + oIdx * 35 + 45,
              cy: block.y + (r - 1) * 30 + 20,
              r: 10,
              value: opt
            });
          }
        });
      }
    }
    return bubbles;
  };

  // Templat Default LJK Standar Sesuai Spesifikasi JSON ROI: Lembar Jawaban Latihan TKA 1
  const createDefaultTemplate = (): OmrTemplate => {
    const tpl: OmrTemplate = {
      id: 'tpl_latihan_tka',
      name: 'Lembar Jawaban Latihan TKA 1',
      updatedAt: 1790211690344,
      autoLayout: false,
      blocks: [
        // 1. Data Peserta (Mulai pada y=150 sesuai spesifikasi JSON ROI)
        {
          id: 1,
          x: 90,
          y: 150,
          type: 'handwritten_identity',
          title: 'Data Peserta',
          direction: 'handwritten',
          cols: 0,
          rows: 0,
          options: [],
          prefillValue: ''
        },
        // 2. NISN (10 kolom pada y=400)
        {
          id: 2,
          x: 90,
          y: 400,
          type: 'identity_nisn',
          title: 'NISN',
          direction: 'vertical',
          cols: 10,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: ''
        },
        // 3. NPSN (8 kolom pada y=400, prefilled: '20301942')
        {
          id: 3,
          x: 442,
          y: 400,
          type: 'identity_npsn',
          title: 'NPSN',
          direction: 'vertical',
          cols: 8,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: '20301942'
        },
        // 4. ID Mapel (2 kolom pada y=400)
        {
          id: 4,
          x: 725,
          y: 400,
          type: 'identity_subject',
          title: 'ID Mapel',
          direction: 'vertical',
          cols: 2,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: ''
        },
        // 5. Kode Tes (2 kolom pada y=400)
        {
          id: 5,
          x: 820,
          y: 400,
          type: 'identity_test',
          title: 'Kode Tes',
          direction: 'vertical',
          cols: 2,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: ''
        },
        // 6. Pilihan Ganda (PG Biasa: No. 1 - 12 pada y=785)
        {
          id: 6,
          x: 90,
          y: 785,
          type: 'biasa',
          title: 'PG Biasa',
          direction: 'horizontal',
          rows: 12,
          options: ['A', 'B', 'C', 'D'],
          startNum: 1
        },
        // 7. Benar / Salah (3 Baris) (BS 3 set: No. 13 - 15 pada y=785)
        {
          id: 7,
          x: 320,
          y: 785,
          type: 'bs3',
          title: 'BS (3 set)',
          direction: 'horizontal',
          rows: 3,
          options: ['B', 'S'],
          startNum: 13
        },
        // 8. Benar / Salah (3 Baris) (BS 3 set: No. 16 - 18 pada y=785)
        {
          id: 8,
          x: 495,
          y: 785,
          type: 'bs3',
          title: 'BS (3 set)',
          direction: 'horizontal',
          rows: 3,
          options: ['B', 'S'],
          startNum: 16
        },
        // 9. Pilihan Ganda Kompleks (PG Kompleks: No. 19 - 24 pada y=785)
        {
          id: 9,
          x: 700,
          y: 785,
          type: 'kompleks',
          title: 'PG Kompleks',
          direction: 'horizontal',
          rows: 6,
          options: ['A', 'B', 'C', 'D'],
          startNum: 19
        },
        // 10. Menjodohkan (No. 25 - 27 pada y=1194)
        {
          id: 10,
          x: 90,
          y: 1194,
          type: 'jodoh',
          title: 'Menjodohkan',
          direction: 'horizontal',
          rows: 3,
          options: ['A', 'B', 'C', 'D'],
          startNum: 25
        },
        // 11. Menjodohkan (No. 28 - 30 pada y=1194)
        {
          id: 11,
          x: 320,
          y: 1194,
          type: 'jodoh',
          title: 'Menjodohkan',
          direction: 'horizontal',
          rows: 3,
          options: ['A', 'B', 'C', 'D'],
          startNum: 28
        },
        // 12. Catatan / Petunjuk Ujian (pada y=1194)
        {
          id: 12,
          x: 565,
          y: 1194,
          type: 'teks_kustom',
          title: 'Catatan',
          direction: 'teks',
          cols: 345,
          rows: 115,
          prefillValue: 'Jaga lembar jawaban agar tidak terlipat, basah, robek, atau kotor, serta pastikan tidak ada coretan lain agar lembar ujianmu terbaca sempurna oleh mesin pemindai.'
        }
      ]
    };
    tpl.blocks.forEach(b => {
      b.bubbles = computeBlockBubbles(b);
    });
    return tpl;
  };

  const createInitialTKATemplate = createDefaultTemplate;

  const getDefaultBlocks = (): TemplateBlock[] => [
    { id: 1, x: 90, y: 135, type: 'handwritten_identity', title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [], prefillValue: '' },
    { id: 2, x: 90, y: 360, type: 'identity_nisn', title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 3, x: 442, y: 360, type: 'identity_npsn', title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' },
    { id: 4, x: 725, y: 360, type: 'identity_subject', title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '01' },
    { id: 5, x: 820, y: 360, type: 'identity_test', title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '01' }
  ];

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const createCleanEmptyTemplate = (): OmrTemplate => {
    const tpl: OmrTemplate = {
      id: generateId(),
      name: 'Lembar Jawaban Baru',
      updatedAt: Date.now(),
      blocks: getDefaultBlocks(),
      autoLayout: true
    };
    tpl.blocks.forEach(b => {
      b.bubbles = computeBlockBubbles(b);
    });
    return tpl;
  };

  const savedTemplates = ref<OmrTemplate[]>([]);
  // Standar Default: Membuka template LJK Lembar Jawaban Latihan TKA 1 lengkap dengan 30 butir soal dan seluruh ROI
  const activeTemplate = ref<OmrTemplate>(createDefaultTemplate());
  const snackbar = ref({ show: false, text: '', color: 'info' });

  const showToast = (text: string, color = 'info') => {
    snackbar.value = { show: true, text, color };
  };

  const loadTemplatesFromDB = async () => {
    try {
      let data = await db.templates.orderBy('updatedAt').reverse().toArray();

      // Pastikan templat default "Lembar Jawaban Latihan TKA 1" selalu tersedia di database
      const defaultTpl = createDefaultTemplate();
      const existingIdx = data.findIndex(t => 
        t.id === 'tpl_latihan_tka' ||
        t.name === 'Lembar Jawaban Latihan TKA 1' ||
        t.id === 'tpl_smpn2_kemranjen'
      );

      if (existingIdx === -1) {
        await db.templates.put(defaultTpl);
        data.unshift(defaultTpl);
      } else {
        if (data[existingIdx].id === 'tpl_smpn2_kemranjen') {
          await db.templates.delete('tpl_smpn2_kemranjen');
        }
        await db.templates.put(defaultTpl);
        data[existingIdx] = defaultTpl;
      }

      const migratedData = data.map(template => {
        let templateChanged = false;
        template.blocks.forEach(block => {
          if (block.type === 'identity_subject' && block.title === 'Kode Mapel') {
            block.title = 'ID Mapel';
            templateChanged = true;
          }
          if (block.type === 'identity_test' && block.title === 'ID Tes') {
            block.title = 'Kode Tes';
            templateChanged = true;
          }
          if (block.type === 'teks_kustom' && block.title === 'Teks Info') {
            block.title = 'Catatan';
            templateChanged = true;
          }
          const titleMap: Record<string, string> = {
            'Pilihan Ganda': 'PG Biasa',
            'Pilihan Ganda Kompleks': 'PG Kompleks',
            'Benar / Salah': 'BS (1 set)',
            'Benar / Salah (3 Baris)': 'BS (3 set)',
            'Sesuai / Tak Sesuai': 'S / TS',
            'Skala Kuesioner': 'Skala',
            'Jodohkan': 'Menjodohkan',
            'Jodoh': 'Menjodohkan',
            'Teks Info': 'Catatan'
          };
          if (titleMap[block.title]) {
            block.title = titleMap[block.title];
            templateChanged = true;
          }
          if (!block.bubbles) {
            block.bubbles = computeBlockBubbles(block);
            templateChanged = true;
          }
        });
        if (templateChanged) {
          db.templates.put(template).catch(e => console.error("Migration failed for template", template.id, e));
        }
        return template;
      });
      savedTemplates.value = migratedData;

      // Inisialisasi baseline ROI di latar belakang untuk setiap templat jika belum tersedia
      migratedData.forEach(async (tpl) => {
        try {
          const exists = await db.templateRois.get(`${tpl.id}_baseline`);
          if (!exists) {
            await saveBaselineRoi(tpl);
          }
        } catch (_) {}
      });

      // UX: Jika activeTemplate masih kosong atau belum disesuaikan ke templat default TKA 1
      if (!activeTemplate.value.id || activeTemplate.value.blocks.length <= 5 || activeTemplate.value.id === 'tpl_smpn2_kemranjen') {
        activeTemplate.value = JSON.parse(JSON.stringify(defaultTpl));
      }
    } catch (error: any) {
      showToast(`Gagal memuat templat: ${error.message}`, 'error');
    }
  };

  const importTemplateFromJson = async (jsonInput: string | Record<string, any>): Promise<OmrTemplate> => {
    try {
      const imported = importOmrTemplateFromJson(jsonInput);
      imported.blocks.forEach(b => {
        b.bubbles = computeBlockBubbles(b);
      });
      imported.updatedAt = Date.now();
      await db.templates.put(imported);
      await saveBaselineRoi(imported);
      activeTemplate.value = imported;
      await loadTemplatesFromDB();
      showToast(`Templat berhasil diimpor: ${imported.name}`, 'success');
      return imported;
    } catch (err: any) {
      showToast(`Gagal mengimpor templat: ${err.message}`, 'error');
      throw err;
    }
  };

  const saveTemplate = async () => {
    try {
      if (activeTemplate.value.blocks.length === 0) throw new Error("Kanvas kosong.");
      
      const templateData = JSON.parse(JSON.stringify(activeTemplate.value));
      templateData.updatedAt = Date.now();
      templateData.blocks.forEach((block: TemplateBlock) => {
        block.bubbles = computeBlockBubbles(block);
      });
      
      await db.templates.put(templateData);
      // Simpan juga ROI Vektor Baseline secara otomatis
      await saveBaselineRoi(templateData);
      showToast(`Tersimpan: ${activeTemplate.value.name}`, 'success');
      await loadTemplatesFromDB();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await db.templates.delete(id);
      showToast('Templat dihapus.', 'success');
      await loadTemplatesFromDB();
    } catch (error: any) {
      showToast(`Gagal menghapus: ${error.message}`, 'error');
    }
  };

  const createNewTemplate = () => {
    activeTemplate.value = createCleanEmptyTemplate();
  };

  const resetToDefaultTemplate = async () => {
    const defTpl = createDefaultTemplate();
    activeTemplate.value = defTpl;
    await db.templates.put(defTpl);
    await saveBaselineRoi(defTpl);
    showToast('Templat dikembalikan ke standar Lembar Jawaban Latihan TKA 1.', 'info');
  };

  const openTemplate = (templateData: OmrTemplate) => {
    const cloned = JSON.parse(JSON.stringify(templateData));
    cloned.blocks.forEach((b: TemplateBlock) => {
      b.bubbles = computeBlockBubbles(b);
    });
    activeTemplate.value = cloned;
  };

  const clearQuestionBlocks = () => {
    const identityTypes = ['handwritten_identity', 'identity_nisn', 'identity_npsn', 'identity_subject', 'identity_test'];
    activeTemplate.value.blocks = activeTemplate.value.blocks.filter(b => identityTypes.includes(b.type));
    activeTemplate.value.blocks.forEach(b => {
      b.bubbles = computeBlockBubbles(b);
    });
    showToast('Bagian soal berhasil dikosongkan.', 'info');
  };

  return {
    savedTemplates,
    activeTemplate,
    snackbar,
    showToast,
    computeBlockBubbles,
    loadTemplatesFromDB,
    importTemplateFromJson,
    saveTemplate,
    deleteTemplate,
    createNewTemplate,
    resetToDefaultTemplate,
    createDefaultTemplate,
    createInitialTKATemplate,
    createCleanEmptyTemplate,
    clearQuestionBlocks,
    openTemplate
  };
});

