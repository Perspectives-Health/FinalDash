"use client"

import { useState, useEffect } from "react"
import type { SessionDetail } from "@/types/user"
import { api } from "@/services/api"

export function useUserDetails(userId: string, enabled = true) {
  const [sessions, setSessions] = useState<SessionDetail[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUserId, setLastUserId] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setSessions(null)
      setLoading(false)
      setError(null)
      return
    }

    // Skip fetch if data already exists for the same user (basic caching)
    if (sessions && lastUserId === userId && !error) {
      return
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const userSessions = await api.getUserSessions(userId)
        
        // Deduplicate sessions based on session_id + workflow_id combination
        const deduplicatedSessions = userSessions.filter((session, index, array) => {
          const uniqueKey = `${session.session_id}-${session.workflow_id}`
          return array.findIndex(s => `${s.session_id}-${s.workflow_id}` === uniqueKey) === index
        })
        
        setSessions(deduplicatedSessions)
        setLastUserId(userId)
      } catch (err) {
        console.error("Error fetching user details:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch user details")
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId, enabled, sessions, lastUserId, error])

  return {
    sessions,
    loading,
    error,
  }
}
