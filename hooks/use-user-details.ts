"use client"

import { useState, useEffect } from "react"
import type { SessionDetail } from "@/types/user"
import { api } from "@/services/api"

export function useUserDetails(userId: string, enabled = true) {
  const [sessions, setSessions] = useState<SessionDetail[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || !userId) {
      setSessions(null)
      setLoading(false)
      setError(null)
      return
    }

    const fetchUserDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        const userSessions = await api.getUserSessions(userId)
        setSessions(userSessions)
      } catch (err) {
        console.error("Error fetching user details:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch user details")
      } finally {
        setLoading(false)
      }
    }

    fetchUserDetails()
  }, [userId, enabled])

  return {
    sessions,
    loading,
    error,
  }
}
