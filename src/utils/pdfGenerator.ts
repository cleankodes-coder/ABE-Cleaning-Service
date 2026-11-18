import { jsPDF } from 'jspdf';
import { Quotation } from '../types/operations';
import { formatGBP, formatUKDate } from './formatters';

export function downloadQuotationPDF(quote: Quotation): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Top Header Band — Official ABE Navy (#0F1B3D)
  doc.setFillColor(15, 27, 61);
  doc.rect(0, 0, pageWidth, 34, 'F');

  // Official Wordmark Styling in PDF Header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('ABE', margin, 16);

  const abeWidth = doc.getTextWidth('ABE ');
  doc.setTextColor(218, 186, 118); // Gold accent on dark navy
  doc.text('Cleaning', margin + abeWidth, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(210, 217, 232);
  doc.text('Operations Hub  |  North London & Hertfordshire', margin, 23);

  // Sample / Concept Notice Badge in Official Gold (#8A6A2C)
  doc.setFillColor(138, 106, 44);
  doc.roundedRect(pageWidth - margin - 54, 10, 54, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CONCEPT DEMO QUOTE', pageWidth - margin - 27, 16.2, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Illustrative Rates Only', pageWidth - margin - 27, 20.8, { align: 'center' });

  y = 44;

  // Quote Title & Metadata Grid
  doc.setTextColor(15, 27, 61);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Quotation ${quote.reference}`, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 112, 135);
  doc.text(`Status: ${quote.status}`, pageWidth - margin, y, { align: 'right' });

  y += 8;
  doc.setDrawColor(232, 234, 240);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Two-column Client & Quote Metadata
  const colMid = margin + contentWidth / 2 + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(138, 106, 44); // #8A6A2C Gold
  doc.text('PREPARED FOR', margin, y);
  doc.text('QUOTATION DETAILS', colMid, y);

  y += 5.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 27, 61);
  doc.text(quote.companyName ? quote.companyName : quote.customerName, margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Issue Date: ${formatUKDate(quote.createdAt)}`, colMid, y);

  y += 5;
  if (quote.companyName) {
    doc.text(`Attn: ${quote.customerName}`, margin, y);
  } else {
    doc.text(`${quote.location}`, margin, y);
  }
  doc.text(`Valid Until: ${formatUKDate(quote.validUntil)}`, colMid, y);

  y += 5;
  doc.text(`${quote.address}`, margin, y);
  doc.text(`Service Area: ${quote.location}`, colMid, y);

  y += 5;
  doc.text(`${quote.location}, ${quote.postcode}`, margin, y);
  doc.text(`Schedule: ${quote.frequency}`, colMid, y);

  y += 12;

  // Illustrative Banner
  doc.setFillColor(247, 242, 231); // Soft gold tint
  doc.roundedRect(margin, y, contentWidth, 10, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 27, 61);
  doc.text(
    'Note: This PDF is generated from an interactive concept prototype. Figures shown are illustrative only.',
    margin + 4,
    y + 6.3
  );

  y += 16;

  // Cost Table Header
  doc.setFillColor(247, 248, 250);
  doc.rect(margin, y, contentWidth, 9, 'F');
  doc.setDrawColor(232, 234, 240);
  doc.line(margin, y, pageWidth - margin, y);
  doc.line(margin, y + 9, pageWidth - margin, y + 9);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 27, 61);
  doc.text('Service Description', margin + 3, y + 6);
  doc.text('Qty / Hrs', margin + 108, y + 6, { align: 'right' });
  doc.text('Rate', margin + 136, y + 6, { align: 'right' });
  doc.text('Amount', pageWidth - margin - 3, y + 6, { align: 'right' });

  y += 14;

  // Primary Service Row
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 27, 61);
  doc.text(`${quote.serviceCategory} (${quote.frequency})`, margin + 3, y);

  const baseCost = quote.estimatedHours * quote.hourlyRate;
  doc.setFont('helvetica', 'normal');
  doc.text(`${quote.estimatedHours.toFixed(1)} hrs`, margin + 108, y, { align: 'right' });
  doc.text(`${formatGBP(quote.hourlyRate)}/hr`, margin + 136, y, { align: 'right' });
  doc.text(formatGBP(baseCost), pageWidth - margin - 3, y, { align: 'right' });

  y += 5;
  doc.setFontSize(8.5);
  doc.setTextColor(100, 112, 135);
  const descLines = doc.splitTextToSize(quote.serviceDescription, 96);
  doc.text(descLines, margin + 3, y);
  y += descLines.length * 4.2 + 4;

  // Optional Additional Services
  const selectedExtras = quote.additionalServices.filter((s) => s.selected);
  for (const extra of selectedExtras) {
    doc.setDrawColor(232, 234, 240);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 27, 61);
    doc.text(extra.label, margin + 3, y + 3);
    doc.text('1', margin + 108, y + 3, { align: 'right' });
    doc.text(formatGBP(extra.amount), margin + 136, y + 3, { align: 'right' });
    doc.text(formatGBP(extra.amount), pageWidth - margin - 3, y + 3, { align: 'right' });
    y += 9;
  }

  y += 4;
  doc.setDrawColor(210, 214, 224);
  doc.line(margin + 92, y, pageWidth - margin, y);
  y += 7;

  // Totals Block
  const labelX = margin + 128;
  const valX = pageWidth - margin - 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(100, 112, 135);
  doc.text('Subtotal', labelX, y, { align: 'right' });
  doc.setTextColor(15, 27, 61);
  doc.text(formatGBP(quote.subtotal), valX, y, { align: 'right' });

  y += 6;
  doc.setTextColor(100, 112, 135);
  doc.text(
    quote.includeVat ? `UK VAT (${quote.vatRate}%)` : 'VAT (Not Applied)',
    labelX,
    y,
    { align: 'right' }
  );
  doc.setTextColor(15, 27, 61);
  doc.text(formatGBP(quote.vatAmount), valX, y, { align: 'right' });

  y += 4;
  doc.setFillColor(15, 27, 61); // Navy total bar
  doc.roundedRect(margin + 92, y, contentWidth - 92, 11, 1.5, 1.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Estimated Total (GBP)', labelX, y + 7.2, { align: 'right' });
  doc.setTextColor(227, 198, 133);
  doc.text(formatGBP(quote.total), valX, y + 7.2, { align: 'right' });

  y += 20;

  // Terms & Notes
  if (quote.termsAndNotes) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 27, 61);
    doc.text('Scope Notes & Illustrative Terms', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(72, 82, 105);
    const termsLines = doc.splitTextToSize(quote.termsAndNotes, contentWidth);
    doc.text(termsLines, margin, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 14;
  doc.setDrawColor(232, 234, 240);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 112, 135);
  doc.text(
    'ABE Cleaning Services (Concept Prototype)  •  https://www.abecleaner.com/  •  Prepared by Zayvo AI Studio',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  doc.save(`${quote.reference}-ABE-Cleaning-Demo-Quote.pdf`);
}
