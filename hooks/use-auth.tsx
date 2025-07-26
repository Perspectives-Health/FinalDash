"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { auth, AuthError, LoginResponse } from '@/lib/auth'

export interface User {
  email: string
  // Add other user properties as needed
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  error: string | null
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check for existing auth on mount
  useEffect(() => {
    const initAuth = () => {
      try {
        if (auth.isAuthenticated()) {
          // We don't have user info stored, but we have a valid token
          // In a real app, you might want to fetch user info here
          setUser({ email: 'authenticated-user' })
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        auth.clearToken()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [])

  const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
      setError(null)
      setIsLoading(true)
      
      await auth.login(email, password)
      setUser({ email })
    } catch (error) {
      const errorMessage = error instanceof AuthError 
        ? error.message 
        : 'An unexpected error occurred during login'
      setError(errorMessage)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    auth.logout()
    setUser(null)
    setError(null)
  }

  const clearError = () => {
    setError(null)
  }

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && auth.isAuthenticated(),
    isLoading,
    login: handleLogin,
    logout: handleLogout,
    error,
    clearError,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}