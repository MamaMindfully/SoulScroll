import jsPDF from 'jspdf';

interface JournalEntry {
  content: string;
  createdAt: string;
  emotionalTone?: string;
  wordCount?: number;
  aiResponse?: string;
}

export const exportEntryToPDF = (
  entryText: string, 
  date: Date = new Date(),
  metadata?: { emotionalTone?: string; wordCount?: number; aiResponse?: string }
) => {
  const doc = new jsPDF();
  
  // Set up document styling
  doc.setFont('helvetica', 'normal');
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(75, 85, 99); // Gray-600
  doc.text('SoulScroll Journal Entry', 20, 25);
  
  // Date
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128); // Gray-500
  doc.text(`Date: ${date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 20, 35);
  
  // Metadata
  let yPosition = 45;
  if (metadata?.wordCount) {
    doc.text(`Word Count: ${metadata.wordCount}`, 20, yPosition);
    yPosition += 8;
  }
  
  if (metadata?.emotionalTone) {
    doc.text(`Emotional Tone: ${metadata.emotionalTone}`, 20, yPosition);
    yPosition += 8;
  }
  
  // Add separator line
  yPosition += 5;
  doc.setLineWidth(0.5);
  doc.setDrawColor(209, 213, 219); // Gray-300
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 15;
  
  // Entry content
  doc.setFontSize(11);
  doc.setTextColor(55, 65, 81); // Gray-700
  const splitText = doc.splitTextToSize(entryText, 170);
  doc.text(splitText, 20, yPosition);
  
  // Calculate where AI response should start
  const textHeight = splitText.length * 6;
  yPosition += textHeight + 20;
  
  // AI Response section
  if (metadata?.aiResponse) {
    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 25;
    }
    
    doc.setFontSize(14);
    doc.setTextColor(79, 70, 229); // Indigo-600
    doc.text('AI Reflection', 20, yPosition);
    yPosition += 15;
    
    doc.setFontSize(11);
    doc.setTextColor(67, 56, 202); // Indigo-700
    const aiSplitText = doc.splitTextToSize(metadata.aiResponse, 170);
    doc.text(aiSplitText, 20, yPosition);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // Gray-400
    doc.text(
      `Generated by SoulScroll - Page ${i} of ${pageCount}`,
      20,
      doc.internal.pageSize.height - 10
    );
  }
  
  // Save with formatted filename
  const filename = `SoulScroll_${date.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return filename;
};

export const exportMultipleEntriesToPDF = (entries: JournalEntry[]) => {
  const doc = new jsPDF();
  
  // Cover page
  doc.setFontSize(24);
  doc.setTextColor(75, 85, 99);
  doc.text('SoulScroll', 105, 60, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Journal Collection', 105, 75, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(107, 114, 128);
  doc.text(`${entries.length} entries`, 105, 90, { align: 'center' });
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, 105, 100, { align: 'center' });
  
  // Add entries
  entries.forEach((entry, index) => {
    doc.addPage();
    
    // Entry header
    doc.setFontSize(16);
    doc.setTextColor(75, 85, 99);
    doc.text(`Entry ${index + 1}`, 20, 25);
    
    // Date
    doc.setFontSize(12);
    doc.setTextColor(107, 114, 128);
    const entryDate = new Date(entry.createdAt);
    doc.text(entryDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }), 20, 35);
    
    // Metadata
    let yPos = 45;
    if (entry.wordCount) {
      doc.text(`${entry.wordCount} words`, 20, yPos);
      yPos += 8;
    }
    if (entry.emotionalTone) {
      doc.text(`Tone: ${entry.emotionalTone}`, 20, yPos);
      yPos += 8;
    }
    
    // Separator
    yPos += 5;
    doc.setLineWidth(0.5);
    doc.setDrawColor(209, 213, 219);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
    
    // Content
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);
    const splitText = doc.splitTextToSize(entry.content, 170);
    doc.text(splitText, 20, yPos);
    
    // AI Response if available
    if (entry.aiResponse) {
      const textHeight = splitText.length * 6;
      yPos += textHeight + 20;
      
      if (yPos > 250) {
        doc.addPage();
        yPos = 25;
      }
      
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text('AI Reflection', 20, yPos);
      yPos += 15;
      
      doc.setFontSize(10);
      doc.setTextColor(67, 56, 202);
      const aiSplitText = doc.splitTextToSize(entry.aiResponse, 170);
      doc.text(aiSplitText, 20, yPos);
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Page ${i} of ${pageCount}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  const filename = `SoulScroll_Collection_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return filename;
};