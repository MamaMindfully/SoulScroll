import jsPDF from 'jspdf';
import { isPremiumUser } from './SubscriptionEngine';

interface JournalEntry {
  id?: string;
  timestamp: string;
  highPoint?: string;
  lesson?: string;
  emotion?: string;
  body?: string;
  type?: 'morning' | 'evening' | 'reflection';
  mood?: number;
  weather?: string;
  aiResponse?: string;
}

export function exportJournalToPDF(entries: JournalEntry[] = []): boolean {
  // Check premium status
  if (!isPremiumUser()) {
    alert('PDF Export is a premium feature. Please upgrade to unlock this functionality.');
    return false;
  }

  if (entries.length === 0) {
    alert('No journal entries found to export.');
    return false;
  }

  try {
    const doc = new jsPDF();
    let y = 30;
    const pageHeight = 280;
    const marginLeft = 15;
    const marginRight = 15;
    const pageWidth = 210;
    const textWidth = pageWidth - marginLeft - marginRight;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('🌙 SoulScroll Journal Export', marginLeft, 20);
    
    // Export date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Exported on ${new Date().toLocaleDateString()}`, marginLeft, 25);
    
    y = 40;

    entries.forEach((entry, index) => {
      // Check if we need a new page
      if (y > pageHeight - 40) {
        doc.addPage();
        y = 20;
      }

      const date = new Date(entry.timestamp).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });

      // Entry header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Entry ${index + 1}: ${date} at ${time}`, marginLeft, y);
      y += 8;

      // Entry type badge
      if (entry.type) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        const typeText = entry.type === 'morning' ? '🌅 Morning Reflection' : 
                        entry.type === 'evening' ? '🌙 Evening Reflection' : 
                        '💭 Free Writing';
        doc.text(typeText, marginLeft, y);
        y += 6;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      // High Point
      if (entry.highPoint) {
        doc.setFont('helvetica', 'bold');
        doc.text('✨ High Point:', marginLeft, y);
        doc.setFont('helvetica', 'normal');
        const highPointLines = doc.splitTextToSize(entry.highPoint, textWidth - 30);
        doc.text(highPointLines, marginLeft + 25, y);
        y += highPointLines.length * 4 + 3;
      }

      // Lesson
      if (entry.lesson) {
        doc.setFont('helvetica', 'bold');
        doc.text('📚 Lesson Learned:', marginLeft, y);
        doc.setFont('helvetica', 'normal');
        const lessonLines = doc.splitTextToSize(entry.lesson, textWidth - 30);
        doc.text(lessonLines, marginLeft + 25, y);
        y += lessonLines.length * 4 + 3;
      }

      // Emotion
      if (entry.emotion) {
        doc.setFont('helvetica', 'bold');
        doc.text('💭 Emotion:', marginLeft, y);
        doc.setFont('helvetica', 'normal');
        const emotionLines = doc.splitTextToSize(entry.emotion, textWidth - 25);
        doc.text(emotionLines, marginLeft + 25, y);
        y += emotionLines.length * 4 + 3;
      }

      // Mood rating
      if (entry.mood) {
        doc.setFont('helvetica', 'bold');
        doc.text('🌟 Mood:', marginLeft, y);
        doc.setFont('helvetica', 'normal');
        doc.text(`${entry.mood}/5`, marginLeft + 20, y);
        y += 6;
      }

      // Weather
      if (entry.weather) {
        doc.setFont('helvetica', 'bold');
        doc.text('🌤️ Weather:', marginLeft, y);
        doc.setFont('helvetica', 'normal');
        doc.text(entry.weather, marginLeft + 25, y);
        y += 6;
      }

      // Main entry content
      if (entry.body) {
        doc.setFont('helvetica', 'bold');
        doc.text('📝 Journal Entry:', marginLeft, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        const bodyLines = doc.splitTextToSize(entry.body, textWidth);
        doc.text(bodyLines, marginLeft, y);
        y += bodyLines.length * 4 + 3;
      }

      // AI Response
      if (entry.aiResponse) {
        doc.setFont('helvetica', 'bold');
        doc.text('🤖 AI Reflection:', marginLeft, y);
        y += 5;
        doc.setFont('helvetica', 'italic');
        const aiLines = doc.splitTextToSize(entry.aiResponse, textWidth);
        doc.text(aiLines, marginLeft, y);
        y += aiLines.length * 4 + 5;
      }

      // Add separator line
      if (index < entries.length - 1) {
        y += 3;
        doc.setDrawColor(200, 200, 200);
        doc.line(marginLeft, y, pageWidth - marginRight, y);
        y += 8;
      }
    });

    // Footer on last page
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - 30, pageHeight + 10);
      doc.text('Generated by SoulScroll - Your AI-Powered Journal', marginLeft, pageHeight + 10);
    }

    // Generate filename with date
    const today = new Date().toISOString().split('T')[0];
    const filename = `SoulScroll_Journal_${today}.pdf`;
    
    doc.save(filename);
    return true;

  } catch (error) {
    console.error('PDF Export Error:', error);
    alert('Failed to export PDF. Please try again.');
    return false;
  }
}

export function exportSpecificEntries(entryIds: string[]): boolean {
  const allEntries = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
  const selectedEntries = allEntries.filter((entry: JournalEntry) => 
    entryIds.includes(entry.id || '')
  );
  
  return exportJournalToPDF(selectedEntries);
}

export function exportDateRange(startDate: Date, endDate: Date): boolean {
  const allEntries = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
  const filteredEntries = allEntries.filter((entry: JournalEntry) => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= startDate && entryDate <= endDate;
  });
  
  return exportJournalToPDF(filteredEntries);
}

export function getExportStats(): { totalEntries: number; canExport: boolean } {
  const allEntries = JSON.parse(localStorage.getItem('soulscroll-entries') || '[]');
  return {
    totalEntries: allEntries.length,
    canExport: isPremiumUser()
  };
}