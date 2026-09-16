import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { useOmrStore } from '../store/omrStore';

export const exportSvgToPdf = async (svgElement: SVGSVGElement | null, fileName: string = 'LJK_Template.pdf', copies: number = 1) => {
  const omrStore = useOmrStore();
  if (!svgElement) {
    omrStore.showToast("SVG LJK tidak ditemukan", "error");
    return;
  }

  try {
    const container = svgElement.parentElement;
    if (!container) throw new Error("Wadah SVG tidak ditemukan");

    // Tangkap gambar elemen menggunakan html2canvas
    const canvas = await html2canvas(container, {
      scale: 2, 
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    for (let i = 0; i < copies; i++) {
      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
    }
    
    pdf.save(fileName);
    omrStore.showToast("Berhasil mengunduh PDF.", "success");
    
  } catch (error: any) {
    omrStore.showToast(`Kesalahan mengekspor PDF: ${error.message}`, 'error');
  }
};
