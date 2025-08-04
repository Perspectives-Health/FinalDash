// Note: This file requires jspdf to be installed
// Run: npm install jspdf jspdf-autotable --save
// Or add to package.json: "jspdf": "^2.5.1", "jspdf-autotable": "^3.8.0"

interface Session {
  created_at: string
  patient_name: string
  workflow_name: string
  json_to_populate: any
}

interface Clinician {
  email: string
  center_name: string
  sessions: Session[]
  totalAnsweredQuestions: number
}

export async function generateClinicalNotesPDF(
  clinicians: Clinician[],
  selectedCenter: string,
  daysRange: number,
  startDate: Date,
  endDate: Date
) {
  // Dynamic import to handle missing dependency gracefully
  try {
    const { default: jsPDF } = await import('jspdf')
    await import('jspdf-autotable')
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // Colors
    const primaryColor = '#2563eb' // Blue
    const textColor = '#1f2937' // Dark gray
    const lightGray = '#f3f4f6'
    const borderColor = '#e5e7eb'

    // Fonts
    doc.setFont('helvetica')

    // Helper functions
    const addPageNumber = (pageNum: number) => {
      doc.setFontSize(9)
      doc.setTextColor(150)
      doc.text(`Page ${pageNum}`, 200, 287, { align: 'right' })
    }

    const formatDate = (date: Date): string => {
      return date.toLocaleDateString("en-US", { 
        month: "short", 
        day: "numeric", 
        year: "numeric" 
      })
    }

    const formatTime = (date: Date): string => {
      return date.toLocaleTimeString("en-US", { 
        hour: "numeric", 
        minute: "2-digit",
        hour12: true 
      })
    }

    // PAGE 1: Cover Page
    let pageNumber = 1

    // Add logo
    try {
      const logoPath = '/images/perspectives-logo.png'
      // Logo would be added here if we had access to the image
      // doc.addImage(logoPath, 'PNG', 80, 30, 50, 20)
      
      // Placeholder for logo
      doc.setDrawColor(borderColor)
      doc.rect(80, 30, 50, 20)
      doc.setFontSize(10)
      doc.setTextColor(150)
      doc.text('PERSPECTIVES LOGO', 105, 42, { align: 'center' })
    } catch (e) {
      console.log('Logo not found')
    }

    // Title
    doc.setFontSize(24)
    doc.setTextColor(textColor)
    doc.text('CLINICAL NOTES REPORT', 105, 80, { align: 'center' })

    // Center name
    doc.setFontSize(16)
    doc.text(selectedCenter === 'all' ? 'All Centers' : selectedCenter, 105, 95, { align: 'center' })

    // Date range
    doc.setFontSize(12)
    doc.setTextColor(100)
    doc.text(`${formatDate(startDate)} - ${formatDate(endDate)}`, 105, 110, { align: 'center' })
    doc.text(`(Last ${daysRange} days)`, 105, 118, { align: 'center' })

    // Generated timestamp
    doc.setFontSize(10)
    doc.text(`Generated: ${formatDate(endDate)} at ${formatTime(endDate)}`, 105, 130, { align: 'center' })

    // Add decorative line
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.5)
    doc.line(50, 140, 160, 140)

    addPageNumber(pageNumber)

    // PAGE 2: Table of Contents
    doc.addPage()
    pageNumber++

    doc.setFontSize(18)
    doc.setTextColor(textColor)
    doc.text('TABLE OF CONTENTS', 20, 30)

    // Add line under title
    doc.setDrawColor(primaryColor)
    doc.setLineWidth(0.3)
    doc.line(20, 35, 190, 35)

    let yPos = 50
    const tocEntries: Array<{ name: string, page: number }> = []
    let currentPage = 3 // Start after TOC

    // Active clinicians
    const activeClinicians = clinicians.filter(c => c.sessions.length > 0)
    const inactiveClinicians = clinicians.filter(c => c.sessions.length === 0)

    if (activeClinicians.length > 0) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Active Clinicians', 20, yPos)
      yPos += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(11)

      activeClinicians.forEach((clinician, index) => {
        const sessionText = `${clinician.sessions.length} sessions, ${clinician.totalAnsweredQuestions} Q&As`
        
        // Clinician name
        doc.setTextColor(primaryColor)
        doc.text(clinician.email, 25, yPos)
        
        // Session info
        doc.setTextColor(100)
        doc.setFontSize(9)
        doc.text(sessionText, 25, yPos + 5)
        
        // Page number with dots
        doc.setTextColor(textColor)
        doc.setFontSize(11)
        const pageText = `${currentPage}`
        doc.text(pageText, 185, yPos, { align: 'right' })
        
        // Draw dots
        const nameWidth = doc.getTextWidth(clinician.email)
        const pageWidth = doc.getTextWidth(pageText)
        const dotStart = 25 + nameWidth + 5
        const dotEnd = 185 - pageWidth - 5
        
        doc.setTextColor(200)
        let x = dotStart
        while (x < dotEnd) {
          doc.text('.', x, yPos)
          x += 3
        }

        tocEntries.push({ name: clinician.email, page: currentPage })
        currentPage += Math.ceil(clinician.sessions.length / 2) + 1 // Estimate pages
        yPos += 12

        if (yPos > 250) {
          doc.addPage()
          pageNumber++
          yPos = 30
        }
      })
    }

    // Inactive clinicians
    if (inactiveClinicians.length > 0) {
      yPos += 10
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(textColor)
      doc.text('No Activity This Period', 20, yPos)
      yPos += 10

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(150)

      inactiveClinicians.forEach(clinician => {
        doc.text(`• ${clinician.email}`, 25, yPos)
        yPos += 6

        if (yPos > 270) {
          doc.addPage()
          pageNumber++
          yPos = 30
        }
      })
    }

    addPageNumber(pageNumber)

    // CLINICIAN PAGES
    activeClinicians.forEach((clinician, clinicianIndex) => {
      doc.addPage()
      pageNumber++

      // Header
      doc.setFillColor(lightGray)
      doc.rect(0, 0, 210, 40, 'F')

      // Clinician name
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(textColor)
      doc.text(clinician.email, 20, 20)

      // Center
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(clinician.center_name || 'No Center Assigned', 20, 28)

      // Summary box
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(borderColor)
      doc.setLineWidth(0.3)
      doc.roundedRect(140, 10, 60, 25, 2, 2)

      doc.setFontSize(10)
      doc.setTextColor(textColor)
      doc.text('Summary', 145, 18)
      doc.setFontSize(9)
      doc.text(`Sessions: ${clinician.sessions.length}`, 145, 24)
      doc.text(`Total Q&As: ${clinician.totalAnsweredQuestions}`, 145, 29)

      let yPos = 50

      // Sessions
      clinician.sessions.forEach((session, sessionIndex) => {
        // Check if we need a new page
        if (yPos > 220) {
          doc.addPage()
          pageNumber++
          yPos = 30
        }

        // Session box
        doc.setFillColor(255, 255, 255)
        doc.setDrawColor(borderColor)
        doc.setLineWidth(0.3)
        doc.roundedRect(15, yPos, 180, 10, 2, 2)

        // Session header
        doc.setFillColor(245, 247, 250)
        doc.roundedRect(15, yPos, 180, 10, 2, 2, 'F')

        // Session number and date
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(textColor)
        doc.text(`Session ${sessionIndex + 1} of ${clinician.sessions.length}`, 20, yPos + 7)

        const sessionDate = new Date(session.created_at)
        doc.setFont('helvetica', 'normal')
        doc.text(`${formatDate(sessionDate)} • ${formatTime(sessionDate)}`, 100, yPos + 7)

        yPos += 15

        // Patient and workflow
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.text(`Patient: ${session.patient_name}`, 20, yPos)
        
        // Workflow badge
        doc.setFillColor(primaryColor)
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        const workflowText = session.workflow_name
        const workflowWidth = doc.getTextWidth(workflowText) + 6
        doc.roundedRect(120, yPos - 5, workflowWidth, 7, 1, 1, 'F')
        doc.text(workflowText, 123, yPos - 0.5)

        yPos += 10

        // Q&A pairs
        if (session.json_to_populate && typeof session.json_to_populate === 'object') {
          const qaEntries = Object.entries(session.json_to_populate)
            .filter(([_, item]: [string, any]) => item.answer)

          doc.setTextColor(textColor)
          
          qaEntries.forEach(([key, item]: [string, any]) => {
            // Check if we need a new page
            if (yPos > 250) {
              addPageNumber(pageNumber)
              doc.addPage()
              pageNumber++
              yPos = 30
            }

            const question = item.question_text || item.processed_question_text || `Question ${key}`
            const answer = item.answer

            // Question
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(10)
            
            // Handle DAP format specially
            if (question === 'D' || question === 'A' || question === 'P') {
              const labels = { 'D': 'Data', 'A': 'Assessment', 'P': 'Plan' }
              doc.setTextColor(primaryColor)
              doc.text(`${question}: ${labels[question]}`, 20, yPos)
            } else {
              doc.setTextColor(70)
              doc.text('Q: ', 20, yPos)
              doc.setFont('helvetica', 'normal')
              const lines = doc.splitTextToSize(question, 165)
              doc.text(lines, 27, yPos)
              yPos += lines.length * 5
            }

            yPos += 6

            // Answer
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(9)
            doc.setTextColor(textColor)
            doc.text('A: ', 20, yPos)
            
            const answerLines = doc.splitTextToSize(answer, 165)
            doc.text(answerLines, 27, yPos)
            yPos += answerLines.length * 4 + 8
          })
        }

        yPos += 5
      })

      addPageNumber(pageNumber)
    })

    // Save the PDF
    const filename = `clinical_notes_report_${selectedCenter === 'all' ? 'all_centers' : selectedCenter.toLowerCase().replace(/\s+/g, '_')}_${formatDate(new Date()).toLowerCase().replace(/\s+/g, '_')}.pdf`
    doc.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('PDF generation error:', error)
    
    // If jsPDF is not installed, provide instructions
    if (error.message?.includes('Cannot find module')) {
      return {
        success: false,
        error: 'jsPDF library not installed. Please run: npm install jspdf jspdf-autotable --save',
        fallbackToText: true
      }
    }
    
    return {
      success: false,
      error: error.message,
      fallbackToText: true
    }
  }
}