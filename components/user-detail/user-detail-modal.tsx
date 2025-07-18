"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Download } from "lucide-react"
import { useUserDetails } from "@/hooks/use-user-details"
import LoadingSpinner from "@/components/shared/loading-spinner"
import StatusBadge from "@/components/shared/status-badge"
import AudioPlayer from "@/components/shared/audio-player"

interface UserDetailModalProps {
  isOpen: boolean
  userId: string
  userEmail: string
  onClose: () => void
}

interface SessionDetail {
  patient_name: string
  created_at: string
  session_type: string
  session_status: string
  workflow_status: string
  session_id: string
  workflow_id: string
  workflow_name: string
  patient_id: string
  json_to_populate: any
  diarized_transcription: any
  audio_link: string | null
}

export default function UserDetailModal({ isOpen, userId, userEmail, onClose }: UserDetailModalProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  const { sessions, loading, error } = useUserDetails(userId, isOpen)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }

    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

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
    return `${diffDays} day(s) ago`
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

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
        <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: "calc(90vh - 200px)" }}>
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
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="w-[15%] min-w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="w-[20%] min-w-[150px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Patient
                        </th>
                        <th className="w-[15%] min-w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session Type
                        </th>
                        <th className="w-[20%] min-w-[150px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow Type
                        </th>
                        <th className="w-[15%] min-w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Session Status
                        </th>
                        <th className="w-[15%] min-w-[120px] px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Workflow Status
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
                          <td className="w-[15%] min-w-[120px] px-4 py-4 text-sm text-gray-900">
                            <div className="truncate">
                              {new Date(session.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {new Date(session.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="w-[20%] min-w-[150px] px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 truncate" title={session.patient_name}>
                              {session.patient_name}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={session.patient_id}>
                              ID: {session.patient_id}
                            </div>
                          </td>
                          <td className="w-[15%] min-w-[120px] px-4 py-4 text-sm text-gray-900">
                            <div className="truncate" title={session.session_type}>
                              {session.session_type}
                            </div>
                          </td>
                          <td className="w-[20%] min-w-[150px] px-4 py-4 text-sm text-gray-900">
                            <div className="truncate" title={session.workflow_name}>
                              {session.workflow_name}
                            </div>
                          </td>
                          <td className="w-[15%] min-w-[120px] px-4 py-4">
                            <StatusBadge status={session.session_status} />
                          </td>
                          <td className="w-[15%] min-w-[120px] px-4 py-4">
                            <StatusBadge status={session.workflow_status} />
                            {session.audio_link && (
                              <div className="text-xs text-green-600 font-medium mt-1">Audio Available</div>
                            )}
                          </td>
                        </tr>

                        {/* Enhanced Expanded Row Details */}
                        {expandedRows.has(uniqueId) && (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 bg-gray-50 max-w-0">
                              <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-lg font-semibold text-gray-900">SESSION DETAILS</h4>
                                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                                    <span>Session ID: {session.session_id}</span>
                                    <span>Workflow ID: {session.workflow_id}</span>
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
                                        <span className="font-mono text-xs text-gray-700">{session.patient_id}</span>
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
                                        <div className="mt-4">
                                          <span className="text-gray-600 text-xs">Workflow Data:</span>
                                          <div className="mt-2 p-3 bg-gray-50 rounded border max-h-32 overflow-y-auto">
                                            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                                              {typeof session.json_to_populate === 'string' 
                                                ? (() => {
                                                    try {
                                                      return JSON.stringify(JSON.parse(session.json_to_populate), null, 2)
                                                    } catch {
                                                      return session.json_to_populate
                                                    }
                                                  })()
                                                : JSON.stringify(session.json_to_populate, null, 2)
                                              }
                                            </pre>
                                          </div>
                                        </div>
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
                                      AUDIO & TRANSCRIPTION
                                    </h5>
                                    <div className="space-y-3">
                                      {session.audio_link ? (
                                        <div>
                                          <AudioPlayer src={session.audio_link} className="w-full" />
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">No audio recording available</p>
                                      )}

                                      {session.diarized_transcription ? (
                                        <div>
                                          <span className="text-sm text-gray-600">Diarized Transcription:</span>
                                          <div className="mt-2 p-3 bg-gray-50 rounded border max-h-40 overflow-y-auto">
                                            <div className="text-sm text-gray-700">
                                              {typeof session.diarized_transcription === "string" ? (
                                                <p className="whitespace-pre-wrap">{session.diarized_transcription}</p>
                                              ) : (
                                                <pre className="whitespace-pre-wrap text-xs">
                                                  {JSON.stringify(session.diarized_transcription, null, 2)}
                                                </pre>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-gray-500">No transcription available</p>
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

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
