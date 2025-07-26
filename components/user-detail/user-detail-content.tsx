"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Download, ClipboardCopy } from "lucide-react"
import { useUserDetails } from "@/hooks/use-user-details"
import LoadingSpinner from "@/components/shared/loading-spinner"
import StatusBadge from "@/components/shared/status-badge"
import AudioPlayer from "@/components/shared/audio-player"
import { api } from "@/services/api"

interface UserDetailContentProps {
  userId: string
  userEmail: string
  targetSessionId?: string | null
  targetWorkflowId?: string | null
}

// Define JsonToPopulateItem type at the top-level (outside the component)
interface JsonToPopulateItem {
  processed_question_text?: string;
  question_text?: string;
  answer?: string;
  evidence?: string;
  type: string;
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

export default function UserDetailContent({ userId, userEmail, targetSessionId, targetWorkflowId }: UserDetailContentProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [showWorkflowQAModal, setShowWorkflowQAModal] = useState(false)
  const [showEditPopulateModal, setShowEditPopulateModal] = useState(false)
  const [editedQuestions, setEditedQuestions] = useState<Record<string, string>>({})
  const [originalQuestions, setOriginalQuestions] = useState<string[]>([])
  const [currentEditingSession, setCurrentEditingSession] = useState<{sessionId: string, workflowId: string} | null>(null)
  const [testPopulateResult, setTestPopulateResult] = useState<any>(null)
  const [isPopulating, setIsPopulating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [currentSession, setCurrentSession] = useState<any>(null)
  const [populateStatus, setPopulateStatus] = useState<string>('')
  const [populateError, setPopulateError] = useState<string>('')
  const [saveSuccess, setSaveSuccess] = useState(false)
  const leftPanelRef = useRef<HTMLDivElement>(null)
  const rightPanelRef = useRef<HTMLDivElement>(null)
  const [answeredSearch, setAnsweredSearch] = useState("")
  const [unansweredSearch, setUnansweredSearch] = useState("")
  const [transcriptSearch, setTranscriptSearch] = useState("")
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())
  const itemsPerPage = 10

  const { sessions, loading, error } = useUserDetails(userId, true)

  // Handle URL-based expansion on component mount and when sessions change
  useEffect(() => {
    if (targetSessionId && targetWorkflowId && sessions) {
      const uniqueId = `${targetSessionId}-${targetWorkflowId}`
      // Verify this session exists in our current data
      const sessionExists = sessions.some(session => 
        session.session_id === targetSessionId && session.workflow_id === targetWorkflowId
      )
      
      if (sessionExists) {
        setExpandedRows(new Set([uniqueId]))
      }
    }
  }, [targetSessionId, targetWorkflowId, sessions])

  const toggleRowExpansion = (uniqueId: string, session_id: string, workflow_id: string) => {
    if (expandedRows.has(uniqueId)) {
      // Closing expanded row - update state only, use replace to avoid navigation
      setExpandedRows(new Set())
      window.history.replaceState({}, '', `/users/${userId}`)
    } else {
      // Opening new row - update state and URL without causing navigation
      setExpandedRows(new Set([uniqueId]))
      window.history.replaceState({}, '', `/users/${userId}/${session_id}/${workflow_id}`)
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

  const handleParallelScroll = (source: 'left' | 'right') => {
    return (e: React.UIEvent<HTMLDivElement>) => {
      const sourceElement = e.currentTarget
      const targetElement = source === 'left' ? rightPanelRef.current : leftPanelRef.current
      
      if (targetElement && sourceElement) {
        targetElement.scrollTop = sourceElement.scrollTop
      }
    }
  }

  const handleQuestionChange = (key: string, value: string) => {
    setEditedQuestions(prev => ({ ...prev, [key]: value }))
  }

  const handleRetryPopulate = async (sessionId: string, workflowId: string, sessionData?: any) => {
    console.log('🚀 handleRetryPopulate called with:', { sessionId, workflowId, sessionData })
    
    // Set the current session and open the modal
    setCurrentEditingSession({ sessionId, workflowId })
    
    // If sessionData is provided, use it; otherwise try to find it in the sessions array
    if (sessionData) {
      setCurrentSession(sessionData)
    } else {
      // Find the session in our sessions array
      const foundSession = sessions?.find(s => s.session_id === sessionId && s.workflow_id === workflowId)
      console.log('🔍 Found session:', foundSession)
      setCurrentSession(foundSession || null)
    }
    
    // Clear all cached state when opening a new session/workflow
    setEditedQuestions({})
    setTestPopulateResult(null)
    setPopulateError('')
    setSaveSuccess(false)
    setShowEditPopulateModal(true)
  }

  const handleTestPopulate = async () => {
    console.log('🚀 handleTestPopulate CALLED!')
    console.log('🚀 currentEditingSession:', currentEditingSession)
    console.log('🚀 currentSession?.json_to_populate:', currentSession?.json_to_populate)
    
    if (!currentEditingSession || !currentSession?.json_to_populate) {
      console.log('❌ Early return - missing session data')
      return
    }
    
    // Get the current questions from the session data and any edits
    const entries = Object.entries(currentSession.json_to_populate || {})
    const questions = entries.map(([key, item]) => {
      const q: JsonToPopulateItem = item as JsonToPopulateItem
      const originalQuestion = q.processed_question_text?.trim() || q.question_text || ''
      return editedQuestions[key] || originalQuestion
    })
    
    console.log('🚨 TESTING POPULATE WITH QUESTIONS:', questions)
    console.log('🚨 Number of questions:', questions.length)
    
    try {
      setIsPopulating(true)
      const result = await api.testPopulate(
        currentEditingSession.sessionId,
        currentEditingSession.workflowId,
        questions,
        userId
      )
      setTestPopulateResult(result)
      console.log('✅ Test populate result:', result)
    } catch (error) {
      console.error('❌ Test populate failed:', error)
      setPopulateError(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsPopulating(false)
    }
  }

  const handleSaveAndPopulate = async () => {
    if (!currentEditingSession || !currentSession?.json_to_populate) return
    
    // Get the current questions from the session data and any edits
    const entries = Object.entries(currentSession.json_to_populate || {})
    const questions = entries.map(([key, item]) => {
      const q: JsonToPopulateItem = item as JsonToPopulateItem
      const originalQuestion = q.processed_question_text?.trim() || q.question_text || ''
      return editedQuestions[key] || originalQuestion
    })
    
    console.log('💾 SAVING AND POPULATING WITH QUESTIONS:', questions)
    console.log('💾 Number of questions:', questions.length)
    
    try {
      setIsSaving(true)
      
      // First save the questions
      await api.saveQuestions(currentEditingSession.workflowId, questions)
      console.log('✅ Questions saved successfully')
      setSaveSuccess(true)
      
      // Then start the populate process using the old retry endpoint
      setPopulateStatus('Starting populate process...')
      await api.retryPopulate(currentEditingSession.sessionId, currentEditingSession.workflowId, userId)
      setPopulateStatus('Processing workflow data...')
      
      // Close the modal and start polling
      setShowEditPopulateModal(false)
      startPolling(currentEditingSession.sessionId, currentEditingSession.workflowId)
      
    } catch (error) {
      console.error('❌ Save and populate failed:', error)
      setPopulateError(`Failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSaving(false)
    }
  }

  const startPolling = (sessionId: string, workflowId: string) => {
    // Clear any existing polling
    if (pollingInterval) {
      clearInterval(pollingInterval)
    }
    
    let pollCount = 0
    const maxPolls = 100 // 5 minutes at 3 second intervals
    
    const interval = setInterval(async () => {
      try {
        pollCount++
        setPopulateStatus(`Checking progress... (${Math.floor(pollCount * 3)}s)`)
        
        const workflowStatuses = await api.getWorkflowStatus(sessionId)
        
        // Find the status for our specific workflow
        const workflowStatus = workflowStatuses.find((w: any) => w.workflow_id === workflowId)
        
        if (workflowStatus) {
          const status = workflowStatus.status
          
          // Update status message based on workflow state
          switch (status) {
            case 'created':
              setPopulateStatus('Initializing workflow...')
              break
            case 'ready_for_generation':
              setPopulateStatus('Preparing to generate responses...')
              break
            case 'generating_workflow_responses':
              setPopulateStatus('AI is generating responses...')
              break
            case 'post_processing':
              setPopulateStatus('Finalizing responses...')
              break
            case 'ready_to_populate':
            case 'completed':
              // Stop polling and refresh data
              clearInterval(interval)
              setPollingInterval(null)
              setIsPopulating(false)
              setPopulateStatus('✅ Populate completed successfully!')
              
              // Refresh the user sessions to get updated data
              setTimeout(async () => {
                await refreshSessionData()
                setPopulateStatus('')
              }, 2000)
              return
            case 'error':
              // Stop polling on error
              clearInterval(interval)
              setPollingInterval(null)
              setIsPopulating(false)
              setPopulateError('❌ Populate failed due to an error. Please try again.')
              setPopulateStatus('')
              return
          }
        }
        
        // Check if we've exceeded max polling time
        if (pollCount >= maxPolls) {
          clearInterval(interval)
          setPollingInterval(null)
          setIsPopulating(false)
          setPopulateError('⏰ Populate timed out after 5 minutes. The process may still be running in the background.')
          setPopulateStatus('')
        }
        
      } catch (error) {
        console.error('Error polling workflow status:', error)
        
        // Check if it's an auth error (401, 403, or "Not authenticated")
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('403') || error.message.includes('Forbidden') || error.message.includes('Not authenticated'))) {
          // Stop polling on auth error and provide manual refresh option
          clearInterval(interval)
          setPollingInterval(null)
          setIsPopulating(false)
          setPopulateError('⚠️ Authentication required for status check. Please refresh manually to check if populate completed.')
          setPopulateStatus('')
          return
        }
        
        setPopulateStatus(`Connection error... retrying (${Math.floor(pollCount * 3)}s)`)
        // Continue polling on other errors
      }
    }, 3000) // Poll every 3 seconds
    
    setPollingInterval(interval)
  }

  const refreshSessionData = async () => {
    try {
      // Force refresh of user details by refetching
      window.location.reload() // Simple approach for now
    } catch (error) {
      console.error('Error refreshing session data:', error)
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Reset populate state when modal closes
  useEffect(() => {
    if (!showEditPopulateModal) {
      setPopulateStatus('')
      setPopulateError('')
      setSaveSuccess(false)
      setEditedQuestions({}) // Clear cached question edits
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      setIsPopulating(false)
    }
  }, [showEditPopulateModal, pollingInterval])

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
                    <React.Fragment key={uniqueId}>
                      <tr 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleRowExpansion(uniqueId, session.session_id, session.workflow_id)}
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
                                            <button
                                              className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-xs font-semibold ml-2"
                                              onClick={() => handleRetryPopulate(session.session_id, session.workflow_id, session)}
                                            >
                                              Edit &amp; Populate
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
                                                      <div className="mb-4">
                                                        <h4 className="text-lg font-bold text-green-700 mb-2 flex items-center">
                                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                          </svg>
                                                          ANSWERED QUESTIONS
                                                        </h4>
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
                                                            const questionId = `answered-${key}`
                                                            const isExpanded = expandedQuestions.has(questionId)
                                                            
                                                            const toggleExpanded = () => {
                                                              const newExpanded = new Set(expandedQuestions)
                                                              if (isExpanded) {
                                                                newExpanded.delete(questionId)
                                                              } else {
                                                                newExpanded.add(questionId)
                                                              }
                                                              setExpandedQuestions(newExpanded)
                                                            }
                                                            
                                                            return (
                                                              <div key={key} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                                                <div 
                                                                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                                  onClick={toggleExpanded}
                                                                >
                                                                  <div className="flex items-start justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                      <div className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">
                                                                        ✓ ANSWERED • Q{key}
                                                                      </div>
                                                                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                                        {q.question_text?.trim() || q.processed_question_text || `Question ${key}`}
                                                                      </div>
                                                                      {!isExpanded && (
                                                                        <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                                          {q.answer && q.answer.length > 80 ? `${q.answer.substring(0, 80)}...` : q.answer}
                                                                        </div>
                                                                      )}
                                                                    </div>
                                                                    <div className="ml-2 flex-shrink-0">
                                                                      <svg 
                                                                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                        fill="none" 
                                                                        stroke="currentColor" 
                                                                        viewBox="0 0 24 24"
                                                                      >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                      </svg>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                                
                                                                {isExpanded && (
                                                                  <div className="border-t bg-gray-50 p-3 space-y-3">
                                                                    {q.processed_question_text && q.processed_question_text !== q.question_text && (
                                                                      <div>
                                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                                          PROCESSED QUESTION
                                                                        </div>
                                                                        <div className="text-sm text-gray-700 bg-white rounded p-2 border">
                                                                          {q.processed_question_text}
                                                                        </div>
                                                                      </div>
                                                                    )}
                                                                    
                                                                    <div>
                                                                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                                        ANSWER
                                                                      </div>
                                                                      <div className="text-sm text-gray-900 bg-white rounded p-2 border">
                                                                        {q.answer}
                                                                      </div>
                                                                    </div>
                                                                    
                                                                    {q.evidence && (
                                                                      <div>
                                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                                          EVIDENCE
                                                                        </div>
                                                                        <div className="text-xs text-gray-600 bg-white rounded p-2 border italic">
                                                                          {q.evidence}
                                                                        </div>
                                                                      </div>
                                                                    )}
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
                                                      <div className="mb-4">
                                                        <h4 className="text-lg font-bold text-red-700 mb-2 flex items-center">
                                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                          </svg>
                                                          UNANSWERED QUESTIONS
                                                        </h4>
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
                                                            
                                                            const questionId = `unanswered-${key}`
                                                            const isExpanded = expandedQuestions.has(questionId)
                                                            
                                                            const toggleExpanded = () => {
                                                              const newExpanded = new Set(expandedQuestions)
                                                              if (isExpanded) {
                                                                newExpanded.delete(questionId)
                                                              } else {
                                                                newExpanded.add(questionId)
                                                              }
                                                              setExpandedQuestions(newExpanded)
                                                            }
                                                            
                                                            return (
                                                              <div key={key} className="bg-white border rounded-lg shadow-sm overflow-hidden">
                                                                <div 
                                                                  className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                                                                  onClick={toggleExpanded}
                                                                >
                                                                  <div className="flex items-start justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                      <div className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">
                                                                        ! UNANSWERED • Q{key}
                                                                      </div>
                                                                      <div className="text-sm font-semibold text-gray-900 leading-tight">
                                                                        {q.question_text?.trim() || q.processed_question_text || `Question ${key}`}
                                                                      </div>
                                                                    </div>
                                                                    <div className="ml-2 flex-shrink-0">
                                                                      <svg 
                                                                        className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                                                        fill="none" 
                                                                        stroke="currentColor" 
                                                                        viewBox="0 0 24 24"
                                                                      >
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                      </svg>
                                                                    </div>
                                                                  </div>
                                                                </div>
                                                                
                                                                {isExpanded && (
                                                                  <div className="border-t bg-gray-50 p-3 space-y-3">
                                                                    {q.processed_question_text && q.processed_question_text !== q.question_text && (
                                                                      <div>
                                                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                                          PROCESSED QUESTION
                                                                        </div>
                                                                        <div className="text-sm text-gray-700 bg-white rounded p-2 border">
                                                                          {q.processed_question_text}
                                                                        </div>
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )}
                                                              </div>
                                                            )
                                                          })
                                                        }
                                                      </div>
                                                    </div>
                                                    {/* Transcript Column */}
                                                    <div className="w-1/3 flex flex-col h-full">
                                                      <div className="mb-4">
                                                        <h4 className="text-lg font-bold text-blue-700 mb-2 flex items-center">
                                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                          </svg>
                                                          CONVERSATION TRANSCRIPT
                                                        </h4>
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
                                                        })()
                                                        }
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>
                                            )}
                                            {showEditPopulateModal && (
                                              <div
                                                className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4"
                                                onClick={() => setShowEditPopulateModal(false)}
                                              >
                                                <div
                                                  className="relative w-[90vw] h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
                                                  onClick={e => e.stopPropagation()}
                                                >
                                                  {/* Modal Header */}
                                                  <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-6 flex flex-col gap-2 rounded-t-2xl">
                                                    <button
                                                      className="absolute top-6 right-8 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                                                      onClick={() => setShowEditPopulateModal(false)}
                                                      aria-label="Close"
                                                    >
                                                      &times;
                                                    </button>
                                                    <div className="flex items-center justify-between">
                                                      <h3 className="text-xl font-bold text-gray-900">Edit & Populate Workflow</h3>
                                                      <div className="flex gap-3 mr-12">
                                                        <button 
                                                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
                                                          onClick={(e) => {
                                                            e.preventDefault()
                                                            e.stopPropagation()
                                                            console.log('🖱️ TEST POPULATE BUTTON CLICKED!')
                                                            console.log('🖱️ Button disabled?', isPopulating)
                                                            console.log('🖱️ currentEditingSession:', currentEditingSession)
                                                            console.log('🖱️ currentSession:', currentSession)
                                                            handleTestPopulate()
                                                          }}
                                                          disabled={isPopulating}
                                                        >
                                                          {isPopulating && (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                          )}
                                                          {isPopulating ? 'Testing...' : 'Test Populate'}
                                                        </button>
                                                        <button 
                                                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                          onClick={handleSaveAndPopulate}
                                                          disabled={isSaving || isPopulating}
                                                        >
                                                          {isSaving && (
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                          )}
                                                          {isSaving ? 'Saving...' : 'Save & Populate'}
                                                        </button>
                                                        {populateError.includes('Authentication required') && (
                                                          <button 
                                                            className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-semibold"
                                                            onClick={() => refreshSessionData()}
                                                          >
                                                            Refresh Data
                                                          </button>
                                                        )}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                      <div className="text-sm text-gray-600">
                                                        Session: {session.session_id} | Workflow: {session.workflow_id}
                                                      </div>
                                                      {(saveSuccess || populateStatus || populateError) && (
                                                        <div className="flex items-center gap-2">
                                                          {saveSuccess && !populateStatus && !populateError && (
                                                            <div className="flex items-center gap-2 text-sm text-green-600">
                                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                              </svg>
                                                              Questions Saved Successfully
                                                            </div>
                                                          )}
                                                          {populateStatus && (
                                                            <div className="flex items-center gap-2 text-sm text-blue-600">
                                                              <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                                              {populateStatus}
                                                            </div>
                                                          )}
                                                          {populateError && (
                                                            <div className="text-sm text-red-600 max-w-md">
                                                              {populateError}
                                                            </div>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                  
                                                  {/* Modal Content: 2 columns */}
                                                  <div className="flex-1 flex gap-6 min-h-0 px-8 py-6 overflow-hidden">
                                                    {/* Left Panel: Questions */}
                                                    <div className="w-1/2 flex flex-col h-full">
                                                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Questions</h4>
                                                      <div 
                                                        ref={leftPanelRef}
                                                        className="overflow-y-auto flex-1 space-y-4 pr-2"
                                                        onScroll={handleParallelScroll('left')}
                                                      >
                                                        {entries.map(([key, item]) => {
                                                          const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                          const currentValue = editedQuestions[key] ?? (q.processed_question_text?.trim() || q.question_text || '')
                                                          const answerText = q.answer || ''
                                                          
                                                          // Calculate height based on longer content
                                                          const questionLines = Math.ceil(currentValue.length / 50)
                                                          const answerLines = Math.ceil(answerText.length / 50)
                                                          const contentHeight = Math.max(questionLines, answerLines, 3) * 24 + 30
                                                          const containerHeight = contentHeight + 100
                                                          
                                                          return (
                                                            <div key={key} className="bg-white border rounded-lg shadow-sm p-4" style={{ height: containerHeight }}>
                                                              <div className="flex justify-between items-center mb-2">
                                                                <label className="block text-sm font-medium text-gray-700">
                                                                  Question {key}
                                                                </label>
                                                                {q.type && (
                                                                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                                                    {q.type}
                                                                  </span>
                                                                )}
                                                              </div>
                                                              <textarea
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                style={{ height: contentHeight }}
                                                                value={currentValue}
                                                                onChange={(e) => handleQuestionChange(key, e.target.value)}
                                                                placeholder="Enter question text..."
                                                              />
                                                            </div>
                                                          )
                                                        })}
                                                      </div>
                                                    </div>
                                                    
                                                    {/* Right Panel: Answers */}
                                                    <div className="w-1/2 flex flex-col h-full">
                                                      <h4 className="text-lg font-semibold text-gray-900 mb-4">Answers</h4>
                                                      <div 
                                                        ref={rightPanelRef}
                                                        className="overflow-y-auto flex-1 space-y-4 pr-2"
                                                        onScroll={handleParallelScroll('right')}
                                                      >
                                                        {(() => {
                                                          const entries = Object.entries(currentSession?.json_to_populate || {})
                                                          const answers = testPopulateResult?.success ? testPopulateResult.populate_data?.answers || [] : []
                                                          
                                                          return entries.map(([key, item], index) => {
                                                            const q: JsonToPopulateItem = item as JsonToPopulateItem
                                                            const currentValue = editedQuestions[key] ?? (q.processed_question_text?.trim() || q.question_text || '')
                                                            
                                                            // Get answer from test result or original
                                                            let answerContent
                                                            if (testPopulateResult?.success && answers.length > 0) {
                                                              const answerObj = answers.find((a: any) => parseInt(a.index) === index + 1)
                                                              if (answerObj) {
                                                                answerContent = (
                                                                  <div className="space-y-3">
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                      <div className="flex items-center mb-2">
                                                                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <div className="text-sm font-bold text-green-800 uppercase tracking-wide">Answer</div>
                                                                      </div>
                                                                      <div className="text-sm text-green-900 font-medium leading-relaxed">{answerObj.answer}</div>
                                                                    </div>
                                                                    {answerObj.evidence && (
                                                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                        <div className="flex items-center mb-2">
                                                                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                          </svg>
                                                                          <div className="text-sm font-bold text-blue-800 uppercase tracking-wide">Evidence</div>
                                                                        </div>
                                                                        <div className="text-sm text-blue-900 leading-relaxed">{answerObj.evidence}</div>
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )
                                                              } else {
                                                                answerContent = <span className="text-gray-400 italic">No answer generated for this question</span>
                                                              }
                                                            } else if (testPopulateResult && !testPopulateResult.success) {
                                                              answerContent = (
                                                                <div className="text-red-600 text-sm">
                                                                  <div className="font-medium mb-1">Test Failed</div>
                                                                  <div>{testPopulateResult.message}</div>
                                                                </div>
                                                              )
                                                            } else {
                                                              // Show original answer with enhanced styling
                                                              if (q.answer) {
                                                                answerContent = (
                                                                  <div className="space-y-3">
                                                                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                                                      <div className="flex items-center mb-2">
                                                                        <svg className="w-4 h-4 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        <div className="text-sm font-bold text-green-800 uppercase tracking-wide">Answer</div>
                                                                      </div>
                                                                      <div className="text-sm text-green-900 font-medium leading-relaxed">{q.answer}</div>
                                                                    </div>
                                                                    {q.evidence && (
                                                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                        <div className="flex items-center mb-2">
                                                                          <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                                          </svg>
                                                                          <div className="text-sm font-bold text-blue-800 uppercase tracking-wide">Evidence</div>
                                                                        </div>
                                                                        <div className="text-sm text-blue-900 leading-relaxed">{q.evidence}</div>
                                                                      </div>
                                                                    )}
                                                                  </div>
                                                                )
                                                              } else {
                                                                answerContent = <span className="text-gray-400 italic">No answer provided</span>
                                                              }
                                                            }
                                                            
                                                            // Use same height calculation as left panel for consistency
                                                            const questionLines = Math.ceil(currentValue.length / 50)
                                                            const answerText = q.answer || ''
                                                            const answerLines = Math.ceil(answerText.length / 50)
                                                            const contentHeight = Math.max(questionLines, answerLines, 3) * 24 + 30
                                                            const containerHeight = contentHeight + 100
                                                            
                                                            return (
                                                              <div key={key} className="bg-white border rounded-lg shadow-sm p-4" style={{ height: containerHeight }}>
                                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                  Answer {key}
                                                                </label>
                                                                <div 
                                                                  className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-700 overflow-y-auto"
                                                                  style={{ height: contentHeight }}
                                                                >
                                                                  {answerContent}
                                                                </div>
                                                              </div>
                                                            )
                                                          })
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
                                  onClick={() => toggleRowExpansion(uniqueId, session.session_id, session.workflow_id)}
                                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                                >
                                  Collapse Details
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
                  {(() => {
                    const maxVisiblePages = 5;
                    const startPage = totalPages > maxVisiblePages 
                      ? Math.max(1, Math.floor((currentPage - 1) / maxVisiblePages) * maxVisiblePages + 1)
                      : 1;
                    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages);
                    
                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const page = startPage + i;
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
                      );
                    });
                  })()}
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