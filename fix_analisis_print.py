import re

with open('src/views/Analisis.vue', 'r') as f:
    content = f.read()

# Add dialog before </v-container>
dialog_html = """
    <!-- Dialog Print PDF -->
    <v-dialog v-model="dialogPrintPDF" max-width="400">
      <v-card class="rounded-xl border" elevation="0">
        <v-card-title class="font-weight-bold pt-4 px-4 bg-grey-lighten-4 border-b">
          Cetak Laporan
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-body-2 mb-4">Pilih ukuran kertas untuk mencetak laporan analisis. (Gunakan fitur "Save as PDF" di browser Anda).</div>
          <v-select
            v-model="selectedPaperSize"
            :items="[{ title: 'A4 (210 x 297 mm)', value: 'A4' }, { title: 'F4 / Folio (215.9 x 330.2 mm)', value: 'F4' }]"
            label="Ukuran Kertas"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-card-text>
        <v-card-actions class="pa-4 border-t bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialogPrintPDF = false">Batal</v-btn>
          <v-btn color="primary" variant="flat" rounded="pill" class="px-6" @click="executePrint">Cetak / PDF</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
"""

content = content.replace("  </v-container>\n</template>", dialog_html + "  </v-container>\n</template>")

# Update v-data-table to support printMode
# First find `:items-per-page="10"` and replace with `:items-per-page="printMode ? -1 : itemsPerPage"`
# Wait, we need to add @update:itemsPerPage="itemsPerPage = $event"
old_table_props = """:items-per-page="10"
                :items-per-page-options="[10, 25, 50, 100, -1]"
                show-current-page"""
new_table_props = """:items-per-page="printMode ? -1 : itemsPerPage"
                @update:itemsPerPage="itemsPerPage = $event"
                :items-per-page-options="[10, 25, 50, 100, -1]"
                show-current-page"""
content = content.replace(old_table_props, new_table_props)

# In script setup, add variables and executePrint
# We will replace exportToPDF completely.

old_export_pdf = """const exportToPDF = async () => {
  const element = document.getElementById('analysis-report');
  if (!element) return;
  
  omrStore.showToast('Memproses PDF...', 'info');
  try {
    const canvas = await html2canvas(element, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // If it's too long for one page, jsPDF addImage might squash it or we need multiple pages.
    // For simplicity, we just add it to one long page or scale it.
    if (pdfHeight > pdf.internal.pageSize.getHeight()) {
       // Multi-page logic
       let heightLeft = pdfHeight;
       let position = 0;
       
       pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
       heightLeft -= pdf.internal.pageSize.getHeight();
       
       while (heightLeft >= 0) {
           position = heightLeft - pdfHeight;
           pdf.addPage();
           pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
           heightLeft -= pdf.internal.pageSize.getHeight();
       }
    } else {
       pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    }
    
    pdf.save('Laporan_Analisis_Data.pdf');
    omrStore.showToast('Laporan PDF berhasil diunduh', 'success');
  } catch (err) {
    console.error(err);
    omrStore.showToast('Gagal mengekspor PDF', 'error');
  }
};"""

new_export_pdf = """const itemsPerPage = ref(10);
const printMode = ref(false);
const dialogPrintPDF = ref(false);
const selectedPaperSize = ref('A4');

const exportToPDF = () => {
  dialogPrintPDF.value = true;
};

const executePrint = () => {
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

content = content.replace(old_export_pdf, new_export_pdf)

with open('src/views/Analisis.vue', 'w') as f:
    f.write(content)
