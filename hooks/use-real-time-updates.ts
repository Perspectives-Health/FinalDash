"use client"

import { useState, useEffect, useRef } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/internal/dashboard"

// Check if backend is available
async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/ws/connections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
    return response.ok
  } catch (error) {
    console.log("Backend health check failed:", error)
    return false
  }
}

export function useRealTimeUpdates(onUpdate?: () => void) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const connectionAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  useEffect(() => {
    let ws: WebSocket | null = null
    let shouldReconnect = true

    const connectWebSocket = async () => {
      // Don't attempt to connect if we've exceeded max attempts
      if (connectionAttemptsRef.current >= maxReconnectAttempts) {
        console.log("Max WebSocket connection attempts reached, using polling fallback")
        shouldReconnect = false
        startPolling()
        return
      }

      // Check if backend is available first
      const backendAvailable = await checkBackendHealth()
      if (!backendAvailable) {
        console.log("Backend not available, using polling fallback")
        shouldReconnect = false
        startPolling()
        return
      }

      try {
        console.log(`Attempting WebSocket connection (attempt ${connectionAttemptsRef.current + 1}/${maxReconnectAttempts})`)
        connectionAttemptsRef.current++
        
        // Create WebSocket connection - use the new /internal/dashboard/ws endpoint
        const wsBaseUrl = API_BASE_URL.replace('http', 'ws')
        ws = new WebSocket(`${wsBaseUrl}/ws`)
        
        ws.onopen = () => {
          setIsConnected(true)
          connectionAttemptsRef.current = 0 // Reset attempts on successful connection
          console.log("WebSocket connected successfully")
          
          // Clear any polling interval when WebSocket connects
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
          }
        }

        ws.onmessage = (event) => {
          if (event.data === "ping") {
            // Handle ping/pong for connection health
            ws?.send("pong")
          } else if (event.data === "update") {
            // Handle data updates
            if (onUpdate) {
              onUpdate()
            }
          }
        }

        ws.onclose = (event) => {
          setIsConnected(false)
          console.log(`WebSocket disconnected - Code: ${event.code}, Reason: ${event.reason}`)
          
          // Only attempt to reconnect for abnormal closures
          if (shouldReconnect && event.code !== 1000 && event.code !== 1001) {
            const delay = Math.min(1000 * Math.pow(2, connectionAttemptsRef.current), 10000) // Exponential backoff, max 10s
            console.log(`Attempting to reconnect in ${delay/1000} seconds...`)
            reconnectTimeoutRef.current = setTimeout(() => {
              if (shouldReconnect) {
                connectWebSocket()
              }
            }, delay)
          } else if (event.code === 1000 || event.code === 1001) {
            // Normal closure, don't reconnect
            console.log("WebSocket closed normally")
          }
        }

        ws.onerror = (error) => {
          console.error("WebSocket error:", error)
          setIsConnected(false)
        }

        setSocket(ws)
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error)
        setIsConnected(false)
      }
    }

    const startPolling = () => {
      console.log("Starting polling fallback")
      pollingIntervalRef.current = setInterval(() => {
        if (onUpdate) {
          onUpdate()
        }
      }, 30000) // Update every 30 seconds
    }

    // Try WebSocket first
    connectWebSocket()

    // Fallback to polling if WebSocket fails after 10 seconds
    const pollingFallback = setTimeout(() => {
      if (!isConnected && shouldReconnect) {
        console.log("WebSocket failed to connect, falling back to polling")
        shouldReconnect = false // Stop WebSocket reconnection attempts
        startPolling()
      }
    }, 10000)

    return () => {
      shouldReconnect = false
      
      // Clear timeouts
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
      clearTimeout(pollingFallback)
      
      // Close WebSocket
      if (ws) {
        ws.close(1000, "Component unmounting") // Normal closure
      }
    }
  }, [onUpdate])

  return {
    socket,
    isConnected,
  }
}
