// Stub file to prevent build errors when jsPDF is not installed
export async function generateClinicalNotesPDF(
  clinicians: any[],
  selectedCenter: string,
  daysRange: number,
  startDate: Date,
  endDate: Date
) {
  return {
    success: false,
    error: 'PDF generation not available. Please install jspdf and jspdf-autotable.',
    fallbackToText: true
  }
}