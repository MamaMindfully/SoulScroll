import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportJournalToPDF(elementId: string, filename: string = 'SoulScroll_Reflection.pdf'): Promise<void> {
  const input = document.getElementById(elementId);
  if (!input) {
    alert('Unable to export: content not found.');
    return;
  }

  try {
    // Show loading state
    const loadingElement = document.createElement('div');
    loadingElement.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;">
        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div>Generating PDF...</div>
          <div style="margin-top: 10px; font-size: 12px; color: #666;">This may take a moment</div>
        </div>
      </div>
    `;
    document.body.appendChild(loadingElement);

    const canvas = await html2canvas(input, {
      scale: 2,
      scrollY: -window.scrollY,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: input.scrollWidth,
      height: input.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    // Handle multi-page PDFs if content is too long
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    // Remove loading state
    document.body.removeChild(loadingElement);
    
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Error generating PDF. Please try again.');
    
    // Remove loading state if it exists
    const loadingElement = document.querySelector('[style*="position: fixed"]');
    if (loadingElement) {
      document.body.removeChild(loadingElement);
    }
  }
}

export async function exportJournalEntriesPDF(
  entries: any[], 
  userStats?: any,
  filename: string = 'SoulScroll_Journal_Export.pdf'
): Promise<void> {
  if (!entries || entries.length === 0) {
    alert('No journal entries to export.');
    return;
  }

  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    const lineHeight = 6;
    let currentY = margin;

    // Add header
    pdf.setFontSize(24);
    pdf.text('SoulScroll Journal Export', margin, currentY);
    currentY += 15;

    // Add export date
    pdf.setFontSize(12);
    pdf.text(`Exported on: ${new Date().toLocaleDateString()}`, margin, currentY);
    currentY += 10;

    // Add user stats if available
    if (userStats) {
      pdf.text(`Total Entries: ${userStats.totalEntries}`, margin, currentY);
      currentY += lineHeight;
      pdf.text(`Current Streak: ${userStats.currentStreak} days`, margin, currentY);
      currentY += lineHeight;
      pdf.text(`Longest Streak: ${userStats.longestStreak} days`, margin, currentY);
      currentY += 15;
    }

    // Add entries
    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (currentY > pageHeight - 40) {
        pdf.addPage();
        currentY = margin;
      }

      // Entry header
      pdf.setFontSize(14);
      pdf.text(`Entry ${index + 1}`, margin, currentY);
      currentY += lineHeight;

      pdf.setFontSize(10);
      const date = new Date(entry.createdAt).toLocaleDateString();
      pdf.text(`Date: ${date}`, margin, currentY);
      currentY += lineHeight;

      if (entry.wordCount) {
        pdf.text(`Words: ${entry.wordCount}`, margin, currentY);
        currentY += lineHeight;
      }

      currentY += 3;

      // Entry content
      pdf.setFontSize(11);
      const content = entry.content || '';
      const splitContent = pdf.splitTextToSize(content, pageWidth - 2 * margin);
      
      splitContent.forEach((line: string) => {
        if (currentY > pageHeight - 20) {
          pdf.addPage();
          currentY = margin;
        }
        pdf.text(line, margin, currentY);
        currentY += lineHeight;
      });

      // AI reflection if available
      if (entry.aiReflection) {
        currentY += 5;
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text('AI Reflection:', margin, currentY);
        currentY += lineHeight;
        
        const reflection = pdf.splitTextToSize(entry.aiReflection, pageWidth - 2 * margin);
        reflection.forEach((line: string) => {
          if (currentY > pageHeight - 20) {
            pdf.addPage();
            currentY = margin;
          }
          pdf.text(line, margin, currentY);
          currentY += lineHeight;
        });
        pdf.setTextColor(0, 0, 0); // Reset color
      }

      currentY += 10; // Space between entries
    });

    pdf.save(filename);
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Error generating PDF. Please try again.');
  }
}