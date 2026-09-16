import { defineStore } from 'pinia';
import { db, type OmrTemplate, type TemplateBlock, type BubbleROI } from '../db/database';
import { ref } from 'vue';

export const useOmrStore = defineStore('omr', () => {
  const savedTemplates = ref<OmrTemplate[]>([]);
  const activeTemplate = ref<OmrTemplate>({
    id: '',
    name: '',
    updatedAt: 0,
    blocks: []
  });
  const snackbar = ref({ show: false, text: '', color: 'info' });

  const showToast = (text: string, color = 'info') => {
    snackbar.value = { show: true, text, color };
  };

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

  const loadTemplatesFromDB = async () => {
    try {
      const data = await db.templates.orderBy('updatedAt').reverse().toArray();
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
    loadTemplatesFromDB,
    saveTemplate,
    deleteTemplate,
    createNewTemplate,
    openTemplate
  };
});
