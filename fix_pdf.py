import re

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

# Check if jsPDF is imported
if 'import { jsPDF } from' not in content:
    content = content.replace("<script setup lang=\"ts\">", "<script setup lang=\"ts\">\nimport { jsPDF } from 'jspdf';\nimport autoTable from 'jspdf-autotable';")

old_execute = """const executePrint = () => {
  dialogPrintPDF.value = false;
  printMode.value = true;
  
  setTimeout(() => {
    let styleEl = document.getElementById('print-style');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'print-style';
      document.head.appendChild(styleEl);
    }
    const isA4 = selectedPaperSize.value === 'A4';
    const sizeValue = isA4 ? 'A4 portrait' : '215.9mm 330.2mm portrait';
    
    styleEl.innerHTML = `
      @media print {
        @page { size: ${sizeValue}; margin: 15mm; }
        body * { visibility: hidden; }
        #analysis-report, #analysis-report * { visibility: visible; }
        #analysis-report {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: auto !important;
          overflow: visible !important;
          border: none !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .v-data-table {
           page-break-inside: auto;
        }
        .v-data-table thead { display: table-header-group; }
        .v-data-table tr, .v-data-table td, .v-data-table th { page-break-inside: avoid; }
        .v-data-table-footer { display: none !important; }
        .v-card { break-inside: avoid; page-break-inside: avoid; }
      }
    `;
    
    window.print();
    
    setTimeout(() => {
      printMode.value = false;
    }, 500);
  }, 300);
};"""

new_execute = """const executePrint = () => {
  dialogPrintPDF.value = false;
  omrStore.showToast('Membuat PDF, mohon tunggu...', 'info');

  const isA4 = selectedPaperSize.value === 'A4';
  const format = isA4 ? 'a4' : [215.9, 330.2]; // F4 dimensions in mm
  const doc = new jsPDF('p', 'mm', format);
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Laporan Analisis Data', 15, currentY);
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const tplName = omrStore.activeTemplate.name || 'LJK';
  doc.text(`ID Mapel: ${selectedCombination.value.split('-')[0]} | Kode Tes: ${selectedCombination.value.split('-')[1]} | LJK: ${tplName}`, 15, currentY);
  currentY += 10;

  // Statistik Nilai & Distribusi Nilai
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Statistik Nilai', 15, currentY);
  doc.text('Distribusi Nilai', pageWidth / 2 + 10, currentY);
  currentY += 6;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const statsTexts = [
    `Rata-rata: ${stats.value.mean.toFixed(2)}`,
    `Nilai Tertinggi: ${stats.value.max.toFixed(2)}`,
    `Nilai Terendah: ${stats.value.min.toFixed(2)}`,
    `Total Peserta: ${stats.value.count}`,
    `Tuntas (>= ${batasKetuntasan.value}): ${stats.value.passed} (${((stats.value.passed/stats.value.count)*100).toFixed(1)}%)`,
    `Tidak Tuntas (< ${batasKetuntasan.value}): ${stats.value.failed} (${((stats.value.failed/stats.value.count)*100).toFixed(1)}%)`
  ];
  
  const distribTexts = [
    `Sangat Baik (A): ${predicates.value.sangatBaik}`,
    `Baik (B): ${predicates.value.baik}`,
    `Cukup (C): ${predicates.value.cukup}`,
    `Kurang (D): ${predicates.value.kurang}`
  ];

  for (let i = 0; i < Math.max(statsTexts.length, distribTexts.length); i++) {
    if (i < statsTexts.length) {
      doc.text(statsTexts[i], 15, currentY);
    }
    if (i < distribTexts.length) {
      doc.text(distribTexts[i], pageWidth / 2 + 10, currentY);
    }
    currentY += 6;
  }
  
  currentY += 5;

  // Table Data Preparation
  const head = [['No', 'Tingkat Kesukaran (P)', 'Daya Pembeda (D)', 'Pola Jawaban', 'Keputusan']];
  const body = analysisResults.value.map(item => {
    let distractorsStr = '';
    if (item.distractor_counts) {
      distractorsStr = Object.entries(item.distractor_counts).map(([k, v]) => `${k}:${v}`).join(', ');
    }
    let badDist = '';
    if (item.bad_distractors && item.bad_distractors.length > 0) {
      badDist = `\n(Buruk: ${item.bad_distractors.join(', ')})`;
    }
    return [
      `S-${item.nomor_soal}`,
      `${item.p_value.toFixed(2)} (${item.p_category})`,
      `${item.d_value.toFixed(2)} (${item.d_category})`,
      `Kunci: ${item.key_answer}\nDistribusi: ${distractorsStr}${badDist}`,
      item.decision
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [44, 62, 80] },
    columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25 }
    },
    pageBreak: 'auto',
    rowPageBreak: 'avoid'
  });

  doc.save(`Laporan_Analisis_${selectedCombination.value}.pdf`);
  omrStore.showToast('Laporan PDF berhasil diunduh', 'success');
};"""

if old_execute in content:
    content = content.replace(old_execute, new_execute)
else:
    print("Could not find old_execute!")

with open('src/views/Analisis.vue', 'w') as f:
    f.write(content)

