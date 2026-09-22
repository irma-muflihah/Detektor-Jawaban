import { defineStore } from 'pinia';
import { db, type OmrTemplate, type TemplateBlock, type BubbleROI } from '../db/database';
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

  // Inisiasi templat "Lembar Jawaban Latihan TKA 1" persis sesuai desain LJK_LTKA_1.jpg dengan proporsi vertikal ideal
  const createInitialTKATemplate = (): OmrTemplate => {
    const tpl: OmrTemplate = {
      id: 'tpl_latihan_tka',
      name: 'Lembar Jawaban Latihan TKA 1',
      updatedAt: Date.now(),
      autoLayout: false,
      blocks: [
        // 1. Data Peserta (Mulai pada y=135 untuk memberi jarak aman 40px+ dari judul di y=95 dan ticker mark)
        {
          id: 1,
          x: 90,
          y: 135,
          type: 'handwritten_identity',
          title: 'Data Peserta',
          direction: 'handwritten',
          cols: 0,
          rows: 0,
          options: [],
          prefillValue: ''
        },
        // 2. NISN (10 kolom)
        {
          id: 2,
          x: 90,
          y: 360,
          type: 'identity_nisn',
          title: 'NISN',
          direction: 'vertical',
          cols: 10,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: ''
        },
        // 3. NPSN (8 kolom, default terisi 20301942)
        {
          id: 3,
          x: 442,
          y: 360,
          type: 'identity_npsn',
          title: 'NPSN',
          direction: 'vertical',
          cols: 8,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: '20301942'
        },
        // 4. ID Mapel (2 kolom)
        {
          id: 4,
          x: 725,
          y: 360,
          type: 'identity_subject',
          title: 'ID Mapel',
          direction: 'vertical',
          cols: 2,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: '01'
        },
        // 5. Kode Tes (2 kolom)
        {
          id: 5,
          x: 820,
          y: 360,
          type: 'identity_test',
          title: 'Kode Tes',
          direction: 'vertical',
          cols: 2,
          rows: 10,
          options: ['0','1','2','3','4','5','6','7','8','9'],
          prefillValue: '01'
        },
        // 6. Pilihan Ganda (PG Biasa: No. 1 - 12)
        {
          id: 6,
          x: 90,
          y: 735,
          type: 'biasa',
          title: 'PG Biasa',
          direction: 'horizontal',
          rows: 12,
          options: ['A', 'B', 'C', 'D'],
          startNum: 1
        },
        // 7. Benar / Salah (3 Baris) (BS 3 set: No. 13 - 15)
        {
          id: 7,
          x: 310,
          y: 735,
          type: 'bs3',
          title: 'BS (3 set)',
          direction: 'horizontal',
          rows: 3,
          options: ['B', 'S'],
          startNum: 13
        },
        // 8. Benar / Salah (3 Baris) (BS 3 set: No. 16 - 18)
        {
          id: 8,
          x: 485,
          y: 735,
          type: 'bs3',
          title: 'BS (3 set)',
          direction: 'horizontal',
          rows: 3,
          options: ['B', 'S'],
          startNum: 16
        },
        // 9. Pilihan Ganda Kompleks (PG Kompleks: No. 19 - 24)
        {
          id: 9,
          x: 680,
          y: 735,
          type: 'kompleks',
          title: 'PG Kompleks',
          direction: 'horizontal',
          rows: 6,
          options: ['A', 'B', 'C', 'D'],
          startNum: 19
        },
        // 10. Menjodohkan (No. 25 - 27)
        {
          id: 10,
          x: 90,
          y: 1135,
          type: 'jodoh',
          title: 'Menjodohkan',
          direction: 'horizontal',
          rows: 3,
          options: ['A', 'B', 'C', 'D'],
          startNum: 25
        },
        // 11. Menjodohkan (No. 28 - 30)
        {
          id: 11,
          x: 310,
          y: 1135,
          type: 'jodoh',
          title: 'Menjodohkan',
          direction: 'horizontal',
          rows: 3,
          options: ['A', 'B', 'C', 'D'],
          startNum: 28
        },
        // 12. Catatan / Keterangan
        {
          id: 12,
          x: 565,
          y: 1135,
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
  // UX: Ketika menu desain dibuka pertama kali atau saat mulai baru, bagian soal TETAP KOSONG
  const activeTemplate = ref<OmrTemplate>(createCleanEmptyTemplate());
  const snackbar = ref({ show: false, text: '', color: 'info' });

  const showToast = (text: string, color = 'info') => {
    snackbar.value = { show: true, text, color };
  };

  const loadTemplatesFromDB = async () => {
    try {
      let data = await db.templates.orderBy('updatedAt').reverse().toArray();

      // Pastikan templat inisiasi "Lembar Jawaban Latihan TKA 1" selalu tersedia di database koleksi
      const tkaIdx = data.findIndex(t => t.name === 'Lembar Jawaban Latihan TKA 1' || t.name === 'Lembar Jawaban Latihan TKA' || t.id === 'tpl_latihan_tka');
      const initialTpl = createInitialTKATemplate();

      if (tkaIdx === -1) {
        await db.templates.put(initialTpl);
        data.unshift(initialTpl);
      } else {
        // Perbarui jika templat TKA lama masih memakai konfigurasi lama atau koordinat lama yang terlalu ke atas (y < 130)
        const isOldCoordinates = data[tkaIdx].blocks[0] && data[tkaIdx].blocks[0].y < 130;
        if (data[tkaIdx].blocks.length < 12 || data[tkaIdx].name !== 'Lembar Jawaban Latihan TKA 1' || isOldCoordinates) {
          await db.templates.put(initialTpl);
          data[tkaIdx] = initialTpl;
        }
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

      // PENTING UNTUK UX: Jika activeTemplate belum diset atau memakai koordinat lama yang terlalu ke atas, perbarui
      if (!activeTemplate.value.id || (activeTemplate.value.blocks?.[0] && activeTemplate.value.blocks[0].y < 130)) {
        activeTemplate.value = createCleanEmptyTemplate();
      }
    } catch (error: any) {
      showToast(`Gagal memuat templat: ${error.message}`, 'error');
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
    saveTemplate,
    deleteTemplate,
    createNewTemplate,
    createInitialTKATemplate,
    createCleanEmptyTemplate,
    clearQuestionBlocks,
    openTemplate
  };
});

