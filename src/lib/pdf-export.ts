import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';

interface ContentBlock {
  id: string;
  type: string;
  content: Record<string, unknown>;
}

interface ProcedureData {
  title: string;
  description?: string;
  category?: string;
  version?: string;
  documentNumber?: string;
  reviewDate?: string;
  approvedBy?: string;
  approvedAt?: string;
  tags?: string[];
  contentBlocks: ContentBlock[];
  attachments?: { file_name: string }[];
}

export async function exportToPDF(procedure: ProcedureData): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Helper to add new page if needed
  const checkNewPage = (requiredHeight: number) => {
    if (yPos + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPos = margin;
      return true;
    }
    return false;
  };

  // Helper to add text with word wrap
  const addText = (text: string, fontSize: number, fontStyle: 'normal' | 'bold' = 'normal', color: [number, number, number] = [0, 0, 0]) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', fontStyle);
    doc.setTextColor(...color);
    
    const lines = doc.splitTextToSize(text, contentWidth);
    const lineHeight = fontSize * 0.5;
    
    lines.forEach((line: string) => {
      checkNewPage(lineHeight);
      doc.text(line, margin, yPos);
      yPos += lineHeight;
    });
    
    return lines.length * lineHeight;
  };

  // Header
  doc.setFillColor(59, 130, 246); // Blue header
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('ASCO', margin, 12);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(procedure.category?.toUpperCase() || 'PROSEDYRE', margin, 25);
  
  yPos = 45;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(procedure.title, contentWidth);
  titleLines.forEach((line: string) => {
    doc.text(line, margin, yPos);
    yPos += 10;
  });
  
  yPos += 5;

  // Metadata line
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  const metaLine = [
    procedure.version && `Versjon ${procedure.version}`,
    procedure.documentNumber && `Dok.nr: ${procedure.documentNumber}`,
  ].filter(Boolean).join(' | ');
  
  if (metaLine) {
    doc.text(metaLine, margin, yPos);
    yPos += 8;
  }

  // Approval info
  if (procedure.approvedBy || procedure.approvedAt || procedure.reviewDate) {
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPos, contentWidth, 25, 'F');
    
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    
    let infoY = yPos + 7;
    if (procedure.approvedBy) {
      doc.text(`Godkjent av: ${procedure.approvedBy}`, margin + 5, infoY);
      infoY += 6;
    }
    if (procedure.approvedAt) {
      const formattedDate = format(new Date(procedure.approvedAt), 'd. MMMM yyyy', { locale: nb });
      doc.text(`Godkjent dato: ${formattedDate}`, margin + 5, infoY);
      infoY += 6;
    }
    if (procedure.reviewDate) {
      const formattedReview = format(new Date(procedure.reviewDate), 'd. MMMM yyyy', { locale: nb });
      doc.text(`Neste revisjon: ${formattedReview}`, margin + 5, infoY);
    }
    
    yPos += 30;
  }

  // Separator
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  // Description
  if (procedure.description) {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    addText(procedure.description, 11, 'normal', [80, 80, 80]);
    yPos += 5;
  }

  // Content blocks
  let headingCounter = 0;
  
  for (const block of procedure.contentBlocks) {
    checkNewPage(15);
    
    switch (block.type) {
      case 'heading': {
        headingCounter++;
        const headingText = (block.content as { text?: string }).text || '';
        const level = (block.content as { level?: number }).level || 2;
        const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12;
        
        yPos += 5;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', 'bold');
        doc.text(`${headingCounter}. ${headingText}`, margin, yPos);
        yPos += fontSize * 0.6;
        break;
      }
      
      case 'text': {
        const textContent = (block.content as { text?: string }).text || '';
        if (textContent) {
          yPos += 3;
          addText(textContent, 10, 'normal', [40, 40, 40]);
          yPos += 3;
        }
        break;
      }
      
      case 'warning': {
        const warningText = (block.content as { text?: string }).text || '';
        if (warningText) {
          checkNewPage(20);
          
          doc.setFillColor(254, 243, 199); // Yellow background
          doc.setDrawColor(245, 158, 11); // Orange border
          doc.setLineWidth(0.5);
          
          const warningLines = doc.splitTextToSize(warningText, contentWidth - 15);
          const boxHeight = Math.max(15, warningLines.length * 5 + 10);
          
          doc.rect(margin, yPos, contentWidth, boxHeight, 'FD');
          
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(146, 64, 14);
          doc.text('⚠ VIKTIG', margin + 5, yPos + 6);
          
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(120, 53, 15);
          let lineY = yPos + 12;
          warningLines.forEach((line: string) => {
            doc.text(line, margin + 5, lineY);
            lineY += 5;
          });
          
          yPos += boxHeight + 5;
        }
        break;
      }
      
      case 'list': {
        const items = (block.content as { items?: string[] }).items || [];
        if (items.length > 0) {
          yPos += 3;
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          
          items.forEach((item) => {
            checkNewPage(6);
            doc.text(`• ${item}`, margin + 5, yPos);
            yPos += 6;
          });
          yPos += 3;
        }
        break;
      }
      
      case 'image': {
        const imageAlt = (block.content as { alt?: string }).alt;
        if (imageAlt) {
          checkNewPage(10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          doc.text(`[Bilde: ${imageAlt}]`, margin, yPos);
          yPos += 8;
        }
        break;
      }
      
      case 'video': {
        const videoTitle = (block.content as { title?: string }).title;
        if (videoTitle) {
          checkNewPage(10);
          doc.setFontSize(9);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100, 100, 100);
          doc.text(`[Video: ${videoTitle}]`, margin, yPos);
          yPos += 8;
        }
        break;
      }
    }
  }

  // Attachments section
  if (procedure.attachments && procedure.attachments.length > 0) {
    checkNewPage(30);
    yPos += 10;
    
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('VEDLEGG', margin, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    procedure.attachments.forEach((att) => {
      checkNewPage(6);
      doc.text(`• ${att.file_name}`, margin + 5, yPos);
      yPos += 6;
    });
  }

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Side ${i} av ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      format(new Date(), 'd. MMMM yyyy', { locale: nb }),
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  // Download
  const filename = `${procedure.documentNumber || procedure.title.replace(/\s+/g, '_')}_v${procedure.version || '1.0'}.pdf`;
  doc.save(filename);
}
