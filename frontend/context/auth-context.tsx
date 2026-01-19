"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { authAPI } from "@/lib/api/auth"

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  email: string
  password: string
  full_name: string
  student_id?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")
    
    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
        // Optionally verify token is still valid
        authAPI.getCurrentUser()
          .then((userData) => {
            setUser(userData)
            localStorage.setItem("user", JSON.stringify(userData))
          })
          .catch(() => {
            // Token invalid, clear storage
            localStorage.clear()
            setUser(null)
          })
      } catch (error) {
        // Corrupted localStorage data, clear it
        console.error('Failed to parse stored user data:', error)
        localStorage.clear()
        setUser(null)
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authAPI.login(email, password)
      
      setUser(response.user)
      localStorage.setItem("user", JSON.stringify(response.user))
      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await authAPI.register(data)
      
      setUser(response.user)
      localStorage.setItem("user", JSON.stringify(response.user))
      localStorage.setItem("access_token", response.access_token)
      localStorage.setItem("refresh_token", response.refresh_token)
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authAPI.logout().finally(() => {
      setUser(null)
      localStorage.clear()
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
