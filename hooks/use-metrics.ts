"use client"

import { useState, useEffect, useCallback } from "react"
import type { MetricsData } from "@/types/metrics"
import { api } from "@/services/api"

export function useMetrics() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inactiveThresholdDays, setInactiveThresholdDays] = useState(30) // Default to 30 days

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const [usersToday, lastUse, dau, weeklyUsers, sessionsTodayByUser, sessionsToday, allSessions, allUsersAnalyticsByCenter] =
        await Promise.all([
          api.getUsersToday(),
          api.getLastUse(),
          api.getDAU(),
          api.getWeeklyUsers(),
          api.getSessionsTodayByUser(),
          api.getSessionsToday(),
          api.getAllSessions(),
          api.getAllUsersAnalyticsByCenter(inactiveThresholdDays), // Pass threshold
        ])

      setMetrics({
        usersToday,
        lastUse,
        dau,
        weeklyUsers,
        sessionsTodayByUser,
        sessionsToday,
        allSessions,
        allUsersAnalyticsByCenter,
      })
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch metrics")
    } finally {
      setLoading(false)
    }
  }, [inactiveThresholdDays]) // Re-fetch when threshold changes

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  return {
    metrics,
    loading,
    error,
    refreshMetrics: fetchMetrics,
    inactiveThresholdDays,
    setInactiveThresholdDays,
  }
}
