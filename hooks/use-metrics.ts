"use client"

import { useState, useEffect, useCallback } from "react"
import type { MetricsData } from "@/types/metrics"
import { api } from "@/services/api"

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all metrics in parallel
      const [usersToday, lastUse, dau, weeklyUsers, sessionsTodayByUser, sessionsToday, allSessions] =
        await Promise.all([
          api.getUsersToday(),
          api.getLastUse(),
          api.getDAU(),
          api.getWeeklyUsers(),
          api.getSessionsTodayByUser(),
          api.getSessionsToday(),
          api.getAllSessions(),
        ])

      setMetrics({
        usersToday,
        lastUse,
        dau,
        weeklyUsers,
        sessionsTodayByUser,
        sessionsToday,
        allSessions,
      })
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchMetrics,
  }
}
