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
      const totalRows = block.type === 'bs3' ? rows * 3 : rows;
      for (let r = 1; r <= totalRows; r++) {
        const qNum = (block.startNum || 0) + (block.type === 'bs3' ? Math.floor((r - 1) / 3) : r - 1);
        opts.forEach((opt, oIdx) => {
          const subId = block.type === 'bs3' ? `_sub${(r - 1) % 3}` : '';
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

  const createInitialTKATemplate = (): OmrTemplate => {
    const tpl: OmrTemplate = {
      id: 'tpl_latihan_tka',
      name: 'Lembar Jawaban Latihan TKA',
      updatedAt: Date.now(),
      autoLayout: false,
      blocks: [
        { id: 1, x: 90, y: 140, type: 'handwritten_identity', title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [], prefillValue: '' },
        { id: 2, x: 90, y: 390, type: 'identity_nisn', title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
        { id: 3, x: 442, y: 390, type: 'identity_npsn', title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' },
        { id: 4, x: 730, y: 390, type: 'identity_subject', title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
        { id: 5, x: 826, y: 390, type: 'identity_test', title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
        // 1. Satu blok pilihan ganda biasa dengan 4 opsi sebanyak 12 item (No. 1 - 12)
        { id: 6, x: 95, y: 765, type: 'biasa', title: 'PG', direction: 'horizontal', rows: 12, options: ['A', 'B', 'C', 'D'], startNum: 1 },
        // 2. Satu blok pilihan ganda kompleks dengan 4 opsi sebanyak 6 item (No. 13 - 18)
        { id: 7, x: 375, y: 765, type: 'kompleks', title: 'PGK', direction: 'horizontal', rows: 6, options: ['A', 'B', 'C', 'D'], startNum: 13 },
        // 3. Satu blok soal benar salah dengan 3 pasang opsi sebanyak 6 item (No. 19 - 24)
        { id: 8, x: 745, y: 765, type: 'bs3', title: 'B/S (3B)', direction: 'horizontal', rows: 6, options: ['B', 'S'], startNum: 19 },
        // 4. Dua blok soal menjodohkan dengan 4 opsi jawaban masing-masing 3 item
        // Blok menjodohkan ke-1 (No. 25 - 27)
        { id: 9, x: 95, y: 1160, type: 'jodoh', title: 'Jodohkan 1', direction: 'horizontal', rows: 3, options: ['A', 'B', 'C', 'D'], startNum: 25 },
        // Blok menjodohkan ke-2 (No. 28 - 30)
        { id: 10, x: 375, y: 980, type: 'jodoh', title: 'Jodohkan 2', direction: 'horizontal', rows: 3, options: ['A', 'B', 'C', 'D'], startNum: 28 },
        // 5. Satu item blok catatan dengan teks: Jaga lembar jawaban komputer tetap bersih, tidak terlipat.
        { id: 11, x: 375, y: 1105, type: 'teks_kustom', title: 'Catatan', direction: 'teks', cols: 250, rows: 95, prefillValue: 'Jaga lembar jawaban komputer tetap bersih, tidak terlipat.' }
      ]
    };
    tpl.blocks.forEach(b => {
      b.bubbles = computeBlockBubbles(b);
    });
    return tpl;
  };

  const savedTemplates = ref<OmrTemplate[]>([]);
  const activeTemplate = ref<OmrTemplate>(createInitialTKATemplate());
  const snackbar = ref({ show: false, text: '', color: 'info' });

  const showToast = (text: string, color = 'info') => {
    snackbar.value = { show: true, text, color };
  };

  const loadTemplatesFromDB = async () => {
    try {
      let data = await db.templates.orderBy('updatedAt').reverse().toArray();

      // Pastikan templat inisiasi "Lembar Jawaban Latihan TKA" selalu tersedia di database
      const tkaExists = data.some(t => t.name === 'Lembar Jawaban Latihan TKA' || t.id === 'tpl_latihan_tka');
      if (!tkaExists) {
        const initialTpl = createInitialTKATemplate();
        await db.templates.put(initialTpl);
        data.unshift(initialTpl);
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
          const titleMap: Record<string, string> = {
            'Pilihan Ganda': 'PG',
            'Pilihan Ganda Kompleks': 'PGK',
            'Benar / Salah': 'B / S',
            'Benar / Salah (3 Baris)': 'B/S (3B)',
            'Sesuai / Tak Sesuai': 'S / TS',
            'Skala Kuesioner': 'Skala',
            'Menjodohkan': 'Jodoh'
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

      // Jika activeTemplate belum terisi atau masih bawaan lama tanpa soal, arahkan ke TKA template
      if (!activeTemplate.value.id || activeTemplate.value.name === 'Lembar Jawaban' || activeTemplate.value.blocks.length <= 5) {
        const tkaTpl = migratedData.find(t => t.name === 'Lembar Jawaban Latihan TKA') || migratedData[0];
        if (tkaTpl) {
          activeTemplate.value = JSON.parse(JSON.stringify(tkaTpl));
        }
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

  const getDefaultBlocks = (): TemplateBlock[] => [
    { id: 1, x: 90, y: 150, type: 'handwritten_identity', title: 'Data Peserta', direction: 'handwritten', cols: 0, rows: 0, options: [], prefillValue: '' },
    { id: 2, x: 90, y: 390, type: 'identity_nisn', title: 'NISN', direction: 'vertical', cols: 10, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 3, x: 442, y: 390, type: 'identity_npsn', title: 'NPSN', direction: 'vertical', cols: 8, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '20301942' },
    { id: 4, x: 730, y: 390, type: 'identity_subject', title: 'ID Mapel', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' },
    { id: 5, x: 826, y: 390, type: 'identity_test', title: 'Kode Tes', direction: 'vertical', cols: 2, rows: 10, options: ['0','1','2','3','4','5','6','7','8','9'], prefillValue: '' }
  ];

  const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

  const createNewTemplate = () => {
    activeTemplate.value = {
      id: generateId(),
      name: 'Lembar Jawaban',
      updatedAt: Date.now(),
      blocks: getDefaultBlocks(),
      autoLayout: true
    };
  };

  const openTemplate = (templateData: OmrTemplate) => {
    activeTemplate.value = JSON.parse(JSON.stringify(templateData));
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
    openTemplate
  };
});
