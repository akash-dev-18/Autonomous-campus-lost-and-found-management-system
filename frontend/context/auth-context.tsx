"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "@/lib/types"
import { currentUser as mockCurrentUser } from "@/lib/mock-data"

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
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, _password: string) => {
    // Mock login - in production, this would call the API
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock validation
    if (email === "demo@example.com" || email === "john@example.com") {
      const userData = { ...mockCurrentUser, email }
      setUser(userData)
      localStorage.setItem("user", JSON.stringify(userData))
      localStorage.setItem("access_token", "mock_access_token")
      localStorage.setItem("refresh_token", "mock_refresh_token")
    } else {
      throw new Error("Invalid credentials")
    }
    setIsLoading(false)
  }

  const register = async (data: RegisterData) => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const newUser: User = {
      id: `user-${Date.now()}`,
      email: data.email,
      full_name: data.full_name,
      student_id: data.student_id,
      role: "user",
      reputation_score: 0,
      is_active: true,
      created_at: new Date().toISOString(),
    }

    setUser(newUser)
    localStorage.setItem("user", JSON.stringify(newUser))
    localStorage.setItem("access_token", "mock_access_token")
    localStorage.setItem("refresh_token", "mock_refresh_token")
    setIsLoading(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("user")
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
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
