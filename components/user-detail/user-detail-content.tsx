"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { Download, ClipboardCopy } from "lucide-react"
import { useUserDetails } from "@/hooks/use-user-details"
import LoadingSpinner from "@/components/shared/loading-spinner"
import StatusBadge from "@/components/shared/status-badge"
import AudioPlayer from "@/components/shared/audio-player"

interface UserDetailContentProps {
  userId: string
  userEmail: string
}

// Define JsonToPopulateItem type at the top-level (outside the component)
interface JsonToPopulateItem {
  processed_question_text?: string;
  question_text?: string;
  answer?: string;
  evidence?: string;
}

// CopyButton component for IDs
function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <span className="inline-flex items-center ml-1">
      <button
        type="button"
        className="p-1 rounded hover:bg-gray-200 focus:outline-none"
        title="Copy to clipboard"
        onClick={async (e) => {
          e.stopPropagation()
          await navigator.clipboard.writeText(value)
          setCopied(true)
          setTimeout(() => setCopied(false), 1200)
        }}
      >
        <ClipboardCopy className="w-4 h-4 text-gray-400 hover:text-gray-700" />
      </button>
      {copied && <span className="ml-1 text-xs text-green-600">Copied!</span>}
    </span>
  )
}

export default function UserDetailContent({ userId, userEmail }: UserDetailContentProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showWorkflowQAModal, setShowWorkflowQAModal] = useState(false)
  const [answeredSearch, setAnsweredSearch] = useState("")
  const [unansweredSearch, setUnansweredSearch] = useState("")
  const [transcriptSearch, setTranscriptSearch] = useState("")
  const itemsPerPage = 10

  const { sessions, loading, error } = useUserDetails(userId, true)

  const toggleRowExpansion = (sessionId: string) => {
    if (expandedRows.has(sessionId)) {
      setExpandedRows(new Set())
    } else {
      setExpandedRows(new Set([sessionId]))
    }
  }

  const exportData = () => {
    if (!sessions) return

    const csvContent = [
      ["Date", "Patient", "Type", "Status", "Workflow", "Session ID"].join(","),
      ...sessions.map((session) =>
        [
          new Date(session.created_at).toLocaleDateString(),
          session.patient_name,
          session.session_type,
          session.session_status,
          session.workflow_name,
          session.session_id,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${userEmail}_sessions.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const paginatedSessions = sessions?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) || []

  const totalPages = Math.ceil((sessions?.length || 0) / itemsPerPage)

  const getLastActiveTime = () => {
    if (!sessions || sessions.length === 0) return "Never"
    const lastSession = sessions[0]
    const lastActive = new Date(lastSession.created_at)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return "Less than 1 hour ago"
    if (diffHours < 24) return `${diffHours} hours ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} days ago`
  }

  // Helper for Q&A modal metrics
  function getQAMetrics(data: any) {
    if (!data || typeof data !== 'object') return { total: 0, answered: 0, unanswered: 0, percent: 0, percentColor: '' }
    const entries = Object.entries(data)
    const total = entries.length
    const answered = entries.filter(([_, item]) => (item as any)?.answer).length
    const unanswered = total - answered
    const percent = total > 0 ? Math.round((answered / total) * 100) : 0
    let percentColor = 'bg-red-100 text-red-700'
    if (percent >= 80) percentColor = 'bg-green-100 text-green-700'
    else if (percent >= 50) percentColor = 'bg-yellow-100 text-yellow-700'
    return { total, answered, unanswered, percent, percentColor }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      {/* User Info */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">USER</p>
            <p className="font-semibold text-gray-900">{userEmail}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">LAST ACTIVE</p>
            <p className="font-semibold text-gray-900">{getLastActiveTime()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">ID</p>
            <p className="font-mono text-sm text-gray-700">{userId}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">STATUS</p>
            <StatusBadge status="active" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">SESSION HISTORY</h3>
          <button
            onClick={exportData}
            disabled={!sessions || sessions.length === 0}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No sessions found for this user</p>
          </div>
        ) : (
          <>
            {/* Sessions Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workflow Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Workflow Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Audio Available
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedSessions.map((session) => {
                    const uniqueId = `${session.session_id}-${session.workflow_id}`
                    return (
                    <>
                      <tr 
                        key={uniqueId} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRowExpansion(uniqueId)}
                      >
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(session.created_at).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(session.created_at).toLocaleTimeString()}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{session.patient_name}</div>
                          <div className="text-xs text-gray-500">ID: {session.patient_id}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{session.session_type}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{session.workflow_name}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={session.session_status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <StatusBadge status={session.workflow_status} />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {session.audio_link ? (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                              Yes
                            </div>
                          ) : (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                              </svg>
                              No
                            </div>
                          )}
                        </td>
                      </tr>

                      {/* Enhanced Expanded Row Details */}
                      {expandedRows.has(uniqueId) && (
                        <tr>
                          <td colSpan={7} className="px-4 py-6 bg-gray-50 max-w-0">
                            <div className="space-y-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <h4 className="text-lg font-semibold text-gray-900">SESSION DETAILS</h4>
                                  {/* Q&A button and modal logic */}
                                  {(() => {
                                    let data: any = session.json_to_populate
                                    if (typeof data === 'string') {
                                      try {
                                        data = JSON.parse(data)
                                      } catch {
                                        return null
                                      }
                                    }
                                    if (data && typeof data === 'object' && !Array.isArray(data)) {
                                      const entries = Object.entries(data) as [string, JsonToPopulateItem][]
                                      if (entries.length > 0 && entries[0][1]?.processed_question_text) {
                                        return (
                                          <>
                                            <button
                                              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs font-semibold"
                                              onClick={() => setShowWorkflowQAModal(true)}
                                            >
                                              View Workflow Q&amp;A ({entries.length})
                                            </button>
                                            {showWorkflowQAModal && (
                                              <div
                                                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
                                                onClick={() => setShowWorkflowQAModal(false)}
                                              >
                                                <div
                                                  className="relative w-[90vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                                                  onClick={e => e.stopPropagation()}
                                                >
                                                  {/* Sticky Header with Info */}
                                                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6 flex flex-col gap-2 rounded-t-2xl">
                                                    <button
                                                      className="absolute top-6 right-8 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                                      onClick={() => setShowWorkflowQAModal(false)}
                                                      aria-label="Close"
                                                    >
                                                      &times;
                                                    </button>
                                                    {/* Modal Header: Clean, Evenly Aligned Row */}
                                                    <div className="flex flex-row justify-between items-start w-full mb-6 gap-x-12">
                                                      {/* Date & Audio (now leftmost column) */}
                                                      <div className="flex-1 min-w-0 flex flex-col items-start justify-start">
                                                        <div className="mb-2">
                                                          <div className="text-xl font-bold text-gray-900 truncate">{new Date(session.created_at).toLocaleString()}</div>
                                                        <div className="h-4" />
                                                        </div>
                                                        <div className="w-full max-w-lg">
                                                          {session.audio_link ? (
                                                            <AudioPlayer src={session.audio_link} className="w-full" />
                                                          ) : (
                                                            <span className="text-xs text-gray-400">No audio</span>
                                                          )}
                                                        </div>
                                                      </div>
                                                      {/* User & Patient (now center column) */}
                                                      <div className="flex-1 min-w-0">
                                                        <div className="mb-2">
                                                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">User</div>
                                                          <div className="flex flex-col gap-y-1">
                                                            <span className="text-xl font-bold text-gray-900 truncate">{userEmail}</span>
                                                            <span className="text-xs text-gray-400 font-mono truncate">{userId}<CopyButton value={userId} /></span>
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Patient</div>
                                                          <div className="flex flex-col gap-y-1">
                                                            <span className="text-xl font-bold text-gray-900 truncate">{session.patient_name}</span>
                                                            <span className="text-xs text-gray-400 font-mono truncate">{session.patient_id}<CopyButton value={session.patient_id} /></span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                      {/* Session & Workflow (now rightmost column) */}
                                                      <div className="flex-1 min-w-0">
                                                        <div className="mb-2">
                                                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Session Type</div>
                                                          <div className="flex items-center gap-2">
                                                            <div className="flex flex-col gap-y-1">
                                                              <span className="text-xl font-bold text-gray-900 truncate flex items-center gap-2">
                                                                {session.session_type}
                                                                <StatusBadge status={session.session_status} className="text-xs" />
                                                              </span>
                                                              <span className="text-xs text-gray-400 font-mono truncate">{session.session_id}<CopyButton value={session.session_id} /></span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                        <div>
                                                          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-0.5">Workflow Type</div>
                                                          <div className="flex items-center gap-2">
                                                            <div className="flex flex-col gap-y-1">
                                                              <span className="text-xl font-bold text-blue-700 truncate flex items-center gap-2">
                                                                {session.workflow_name}
                                                                <StatusBadge status={session.workflow_status} className="text-xs" />
                                                              </span>
                                                              <span className="text-xs text-gray-400 font-mono truncate">{session.workflow_id}<CopyButton value={session.workflow_id} /></span>
                                                            </div>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                  {/* Modal Content: 3 columns */}
                                                  <div className="flex-1 flex gap-6 min-h-0 px-8 py-6 overflow-y-auto">
                                                    {/* Answered Qs Column */}
                                                    <div className="w-1/3 flex flex-col h-full">
                                                      <div className="mb-2">
                                                        <input
                                                          type="text"
                                                          placeholder="Search answered..."
                                                          className="w-full px-2 py-1 border rounded text-sm"
                                                          value={answeredSearch}
                                                          onChange={e => setAnsweredSearch(e.target.value)}
                                                        />
                                                      </div>
                                                      <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                                                        {entries
                                                          .filter(([_, item]) => (item as JsonToPopulateItem)?.answer)
                                                          .filter(([_, item]) => {
                                                            const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                            return (
                                                              (q.processed_question_text || q.question_text || "").toLowerCase().includes(answeredSearch.toLowerCase()) ||
                                                              (q.answer || "").toLowerCase().includes(answeredSearch.toLowerCase())
                                                            )
                                                          })
                                                          .map(([key, item]) => {
                                                            const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                            return (
                                                              <div key={key} className="bg-white border rounded-lg shadow-sm p-3">
                                                                <div className="font-semibold text-sm text-gray-800 mb-1">
                                                                  {q.processed_question_text?.trim() ? q.processed_question_text : q.question_text || `Question ${key}`}
                                                                </div>
                                                                <div className="text-sm text-gray-700 bg-gray-50 rounded p-2 mb-1">
                                                                  {q.answer}
                                                                </div>
                                                                {q.evidence && (
                                                                  <div className="text-xs italic text-gray-500 bg-gray-50 rounded p-2 mt-1">
                                                                    {q.evidence}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )
                                                          })
                                                        }
                                                      </div>
                                                    </div>
                                                    {/* Unanswered Qs Column */}
                                                    <div className="w-1/3 flex flex-col h-full">
                                                      <div className="mb-2">
                                                        <input
                                                          type="text"
                                                          placeholder="Search unanswered..."
                                                          className="w-full px-2 py-1 border rounded text-sm"
                                                          value={unansweredSearch}
                                                          onChange={e => setUnansweredSearch(e.target.value)}
                                                        />
                                                      </div>
                                                      <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                                                        {entries
                                                          .filter(([_, item]) => !(item as JsonToPopulateItem)?.answer)
                                                          .filter(([_, item]) => {
                                                            const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                            return (
                                                              (q.processed_question_text || q.question_text || "").toLowerCase().includes(unansweredSearch.toLowerCase())
                                                            )
                                                          })
                                                          .map(([key, item]) => {
                                                            const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                            // Only render if there is a question text (skip if no answer and no question)
                                                            if (!(q.processed_question_text || q.question_text)) return null;
                                                            return (
                                                              <div key={key} className="bg-white border rounded-lg shadow-sm p-3">
                                                                <div className="font-semibold text-sm text-gray-800 mb-1">
                                                                  {q.processed_question_text?.trim() ? q.processed_question_text : q.question_text || `Question ${key}`}
                                                                </div>
                                                                {/* No 'No answer provided' message, just skip */}
                                                              </div>
                                                            )
                                                          })
                                                        }
                                                      </div>
                                                    </div>
                                                    {/* Transcript Column */}
                                                    <div className="w-1/3 flex flex-col h-full">
                                                      <div className="mb-2">
                                                        <input
                                                          type="text"
                                                          placeholder="Search transcript..."
                                                          className="w-full px-2 py-1 border rounded text-sm"
                                                          value={transcriptSearch}
                                                          onChange={e => setTranscriptSearch(e.target.value)}
                                                        />
                                                      </div>
                                                      <div className="overflow-y-auto flex-1 space-y-4">
                                                        {(() => {
                                                          const transcript = session.diarized_transcription
                                                          if (!transcript) {
                                                            return <div className="text-gray-400 italic">No transcription available</div>
                                                          }
                                                          // Color palette for speakers (backgrounds)
                                                          const speakerBg: Record<string, string> = {
                                                            'A': 'bg-blue-100',
                                                            'B': 'bg-green-100',
                                                            'C': 'bg-purple-100',
                                                            'D': 'bg-pink-100',
                                                            'E': 'bg-orange-100',
                                                          }
                                                          const speakerText: Record<string, string> = {
                                                            'A': 'text-blue-900',
                                                            'B': 'text-green-900',
                                                            'C': 'text-purple-900',
                                                            'D': 'text-pink-900',
                                                            'E': 'text-orange-900',
                                                          }
                                                          const getBg = (speaker: string) => {
                                                            const key = speaker.replace(/Speaker /i, '').trim().charAt(0).toUpperCase()
                                                            return speakerBg[key] || 'bg-gray-100'
                                                          }
                                                          const getText = (speaker: string) => {
                                                            const key = speaker.replace(/Speaker /i, '').trim().charAt(0).toUpperCase()
                                                            return speakerText[key] || 'text-gray-900'
                                                          }
                                                          // If transcript is a string, try to split by speaker
                                                          if (typeof transcript === 'string') {
                                                            const lines = transcript.split(/\n|\r/).filter(Boolean)
                                                            return lines
                                                              .map((line, idx) => {
                                                                const match = line.match(/^(Speaker [A-Z]):\s*(.*)$/i)
                                                                if (match) {
                                                                  const speaker = match[1]
                                                                  const text = match[2]
                                                                  if (
                                                                    transcriptSearch &&
                                                                    !(
                                                                      speaker.toLowerCase().includes(transcriptSearch.toLowerCase()) ||
                                                                      text.toLowerCase().includes(transcriptSearch.toLowerCase())
                                                                    )
                                                                  ) {
                                                                    return null
                                                                  }
                                                                  return (
                                                                    <div key={idx} className={`rounded-lg p-3 ${getBg(speaker)} ${getText(speaker)} shadow-sm`}> 
                                                                      <span className="font-bold mr-2">{speaker}:</span>
                                                                      <span className="whitespace-pre-line">{text}</span>
                                                                    </div>
                                                                  )
                                                                }
                                                                // Not a speaker line
                                                                if (
                                                                  transcriptSearch &&
                                                                  !line.toLowerCase().includes(transcriptSearch.toLowerCase())
                                                                ) {
                                                                  return null
                                                                }
                                                                return <div key={idx} className="rounded-lg p-3 bg-gray-100 text-gray-900 shadow-sm">{line}</div>
                                                              })
                                                          }
                                                          // If transcript is an array of {speaker, text}
                                                          if (Array.isArray(transcript)) {
                                                            return transcript
                                                              .map((seg: any, idx: number) => {
                                                                if (
                                                                  transcriptSearch &&
                                                                  !(
                                                                    (seg.speaker || '').toLowerCase().includes(transcriptSearch.toLowerCase()) ||
                                                                    (seg.text || '').toLowerCase().includes(transcriptSearch.toLowerCase())
                                                                  )
                                                                ) {
                                                                  return null
                                                                }
                                                                return (
                                                                  <div key={idx} className={`rounded-lg p-3 ${getBg(seg.speaker || '')} ${getText(seg.speaker || '')} shadow-sm`}>
                                                                    <span className="font-bold mr-2">{seg.speaker}:</span>
                                                                    <span className="whitespace-pre-line">{seg.text}</span>
                                                                  </div>
                                                                )
                                                              })
                                                          }
                                                          // Fallback: show as JSON
                                                          return <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{JSON.stringify(transcript, null, 2)}</pre>
                                                        })()}
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                          </>
                                        )
                                      }
                                    }
                                    return null
                                  })()}
                                </div>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>Session ID: {session.session_id} <CopyButton value={session.session_id} /></span>
                                  <span>Workflow ID: {session.workflow_id} <CopyButton value={session.workflow_id} /></span>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {/* Patient & Session Info */}
                                <div className="bg-white p-5 rounded-lg border shadow-sm">
                                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg
                                      className="w-5 h-5 mr-2 text-blue-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                      />
                                    </svg>
                                    PATIENT & SESSION
                                  </h5>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Patient:</span>
                                      <span className="font-medium text-gray-900">{session.patient_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Patient ID:</span>
                                      <span className="font-mono text-xs text-gray-700">{session.patient_id}<CopyButton value={session.patient_id} /></span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Session Type:</span>
                                      <span className="font-medium text-gray-900">{session.session_type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Created:</span>
                                      <span className="text-gray-900">
                                        {new Date(session.created_at).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Workflow Information */}
                                <div className="bg-white p-5 rounded-lg border shadow-sm">
                                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg
                                      className="w-5 h-5 mr-2 text-purple-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                      />
                                    </svg>
                                    WORKFLOW DATA
                                  </h5>
                                  <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Workflow:</span>
                                      <span className="font-medium text-gray-900">{session.workflow_name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Session Status:</span>
                                      <StatusBadge status={session.session_status} className="text-xs" />
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Workflow Status:</span>
                                      <StatusBadge status={session.workflow_status} className="text-xs" />
                                    </div>
                                    {session.json_to_populate && (
                                      (() => {
                                        let data: any = session.json_to_populate
                                        if (typeof data === 'string') {
                                          try {
                                            data = JSON.parse(data)
                                          } catch {
                                            return null
                                          }
                                        }
                                        if (data && typeof data === 'object' && !Array.isArray(data)) {
                                          const entries = Object.entries(data)
                                          if (entries.length > 0 && (entries[0][1] as JsonToPopulateItem)?.processed_question_text) {
                                            const qaMetrics = getQAMetrics(data)
                                            return (
                                              <>
                                                {/* The Q&A button is now rendered outside the Workflow Information card */}
                                              </>
                                            )
                                          }
                                        }
                                        return null
                                      })()
                                    )}
                                  </div>
                                </div>

                                {/* Audio & Transcription */}
                                <div className="bg-white p-5 rounded-lg border shadow-sm">
                                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg
                                      className="w-5 h-5 mr-2 text-green-600"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                      />
                                    </svg>
                                    AUDIO
                                  </h5>
                                  <div className="space-y-3">
                                    {session.audio_link ? (
                                      <div>
                                        <AudioPlayer src={session.audio_link} className="w-full" />
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-500">No audio recording available</p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex justify-end">
                                <button
                                  onClick={() => toggleRowExpansion(uniqueId)}
                                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  Collapse Details
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Previous 10
                </button>

                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 text-sm rounded-md ${
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next 10 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}