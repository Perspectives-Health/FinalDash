"use client"

import { useState, useEffect } from "react"
import { api } from "@/services/api"
import { FileText, Download, Calendar, FileDown } from "lucide-react"
// import { generateClinicalNotesPDF } from "@/utils/pdf-generator"

interface CenterOption {
  value: string
  label: string
}

export default function ClinicalNotesReport() {
  const [centers, setCenters] = useState<CenterOption[]>([])
  const [selectedCenter, setSelectedCenter] = useState<string>("all")
  const [daysRange, setDaysRange] = useState<number>(7)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch centers on component mount
  useEffect(() => {
    fetchCenters()
  }, [])

  const fetchCenters = async () => {
    try {
      const users = await api.getUsersWithSessionAndCenter("center")
      
      // Extract unique center names
      const uniqueCenters = new Set<string>()
      users.forEach(user => {
        if (user.center_name) {
          uniqueCenters.add(user.center_name)
        }
      })

      // Convert to options array and sort alphabetically
      const centerOptions: CenterOption[] = [
        { value: "all", label: "All Centers" },
        ...Array.from(uniqueCenters)
          .sort()
          .map(name => ({ value: name, label: name }))
      ]

      setCenters(centerOptions)
    } catch (err) {
      console.error("Error fetching centers:", err)
      setError("Failed to load centers")
    }
  }

  const generateReport = async () => {
    setIsGenerating(true)
    setError(null)

    try {
      // Fetch users from selected center
      const allUsers = await api.getUsersWithSessionAndCenter("center")
      
      // Filter by selected center if not "all"
      const filteredUsers = selectedCenter === "all" 
        ? allUsers 
        : allUsers.filter(user => user.center_name === selectedCenter)

      // Sort users alphabetically by email
      filteredUsers.sort((a, b) => a.email.localeCompare(b.email))

      // Calculate date range based on selected days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - daysRange)

      // Prepare data for PDF generation
      const cliniciansData = []

      // Process each user
      for (const user of filteredUsers) {
        const clinicianData = {
          email: user.email,
          center_name: user.center_name || '',
          sessions: [],
          totalAnsweredQuestions: 0
        }

        try {
          // Fetch user sessions
          const sessions = await api.getUserSessions(user.user_id)
          
          // Filter sessions from selected date range
          const recentSessions = sessions.filter(session => {
            const sessionDate = new Date(session.created_at)
            return sessionDate >= startDate && sessionDate <= endDate
          })

          // Further filter to exclude test patients and sessions without answers
          const validSessions = recentSessions.filter(session => {
            // Check if patient name contains "Test" (case-insensitive)
            const patientName = session.patient_name.toLowerCase()
            const nameParts = patientName.split(' ')
            const hasTestInName = nameParts.some(part => part === 'test')
            if (hasTestInName) return false

            // Check if session has any answered questions
            if (!session.json_to_populate || typeof session.json_to_populate !== 'object') {
              return false
            }

            const hasAnswers = Object.values(session.json_to_populate).some((item: any) => item.answer)
            return hasAnswers
          })

          // Count total answered questions
          validSessions.forEach(session => {
            if (session.json_to_populate && typeof session.json_to_populate === 'object') {
              Object.values(session.json_to_populate).forEach((item: any) => {
                if (item.answer) clinicianData.totalAnsweredQuestions++
              })
            }
          })

          // Store valid sessions
          clinicianData.sessions = validSessions

        } catch (err) {
          console.error(`Error fetching sessions for ${user.email}:`, err)
        }

        cliniciansData.push(clinicianData)
      }

      // Try to generate PDF first if available
      try {
        // Dynamic import to avoid build errors when jsPDF is not installed
        const { generateClinicalNotesPDF } = await import("@/utils/pdf-generator")
        const pdfResult = await generateClinicalNotesPDF(
          cliniciansData,
          selectedCenter,
          daysRange,
          startDate,
          endDate
        )

        if (!pdfResult.success || pdfResult.fallbackToText) {
          // Fall back to text generation
          generateTextReport(cliniciansData, selectedCenter, daysRange, startDate, endDate)
        }
      } catch (error) {
        console.log("PDF generation not available, falling back to text")
        // Fall back to text generation
        generateTextReport(cliniciansData, selectedCenter, daysRange, startDate, endDate)
      }

    } catch (err) {
      console.error("Error generating report:", err)
      setError("Failed to generate report. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTextReport = (cliniciansData: any[], selectedCenter: string, daysRange: number, startDate: Date, endDate: Date) => {
    let reportContent = ""
    const index: Array<{ name: string, lineNumber: number }> = []
    let currentLine = 1

    // Add report header
    const header = `CLINICAL NOTES REPORT
====================
Center: ${selectedCenter === "all" ? "All Centers" : selectedCenter}
Date Range: ${formatDate(startDate)} - ${formatDate(endDate)} (Last ${daysRange} days)
Generated: ${formatDate(endDate)} at ${formatTime(endDate)}

`
    reportContent += header
    currentLine += header.split('\n').length

    // Add index placeholder
    reportContent += `INDEX OF CLINICIANS
==================
`
    currentLine += 3

    // Reserve space for index
    const indexPlaceholder = cliniciansData.map((_, i) => `${i + 1}. `).join('\n')
    reportContent += indexPlaceholder + '\n\n'
    currentLine += cliniciansData.length + 2

    reportContent += "==================================================\n\n"
    currentLine += 2

    // Process each clinician
    for (const clinician of cliniciansData) {
      index.push({ name: clinician.email, lineNumber: currentLine })

      const clinicianHeader = `CLINICIAN: ${clinician.email}
${clinician.center_name ? `Center: ${clinician.center_name}\n` : ''}
`
      reportContent += clinicianHeader
      currentLine += clinicianHeader.split('\n').length - 1

      const summary = `Sessions in Period: ${clinician.sessions.length}
Total Answered Questions: ${clinician.totalAnsweredQuestions}

`
      reportContent += summary
      currentLine += summary.split('\n').length - 1

      // Add session details
      for (const session of clinician.sessions) {
        const sessionHeader = `--------------------------------------------------
Date: ${formatDate(new Date(session.created_at))} - ${formatTime(new Date(session.created_at))}
Patient: ${session.patient_name}
Workflow: ${session.workflow_name}

`
        reportContent += sessionHeader
        currentLine += sessionHeader.split('\n').length - 1

        // Extract Q&A pairs
        if (session.json_to_populate && typeof session.json_to_populate === 'object') {
          const qaEntries = Object.entries(session.json_to_populate)
            .filter(([_, item]: [string, any]) => item.answer)
            .map(([key, item]: [string, any]) => {
              const question = item.question_text || item.processed_question_text || `Question ${key}`
              return `Q: ${question}\nA: ${item.answer}\n\n`
            })

          reportContent += qaEntries.join('')
          currentLine += qaEntries.join('').split('\n').length - 1
        }
      }

      if (clinician.sessions.length === 0) {
        reportContent += `No sessions in the last ${daysRange} days.\n\n`
        currentLine += 2
      }

      reportContent += "\n"
      currentLine += 1
    }

    // Build final index
    const finalIndex = index.map((entry, i) => 
      `${i + 1}. ${entry.name} ${''.padEnd(Math.max(1, 50 - entry.name.length), '.')} Line ${entry.lineNumber}`
    ).join('\n')

    // Replace index placeholder
    const lines = reportContent.split('\n')
    let indexLineStart = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] === '==================') {
        indexLineStart = i + 1
        break
      }
    }
    
    if (indexLineStart > 0) {
      lines.splice(indexLineStart, cliniciansData.length, ...finalIndex.split('\n'))
      reportContent = lines.join('\n')
    }

    // Download the file
    downloadTextFile(reportContent, `clinical_notes_report_${formatFileDate(new Date())}.txt`)
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

  const formatFileDate = (date: Date): string => {
    return date.toISOString().split('T')[0]
  }

  const downloadTextFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Generate Clinical Notes Report</h2>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="center-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Center
          </label>
          <select
            id="center-select"
            value={selectedCenter}
            onChange={(e) => setSelectedCenter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            disabled={isGenerating}
          >
            {centers.map((center) => (
              <option key={center.value} value={center.value}>
                {center.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="days-range" className="block text-sm font-medium text-gray-700 mb-2">
            Date Range (Days)
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="days-range"
              type="number"
              min="1"
              max="365"
              value={daysRange}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (value > 0 && value <= 365) {
                  setDaysRange(value)
                }
              }}
              className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-center"
              disabled={isGenerating}
            />
            <span className="text-sm text-gray-600">days</span>
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              Generating Report...
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Generate Report
            </>
          )}
        </button>

        <p className="text-xs text-gray-500 text-center">
          This will generate a report containing all answered questions from the selected center for the last {daysRange} days
        </p>
      </div>
    </div>
  )
}