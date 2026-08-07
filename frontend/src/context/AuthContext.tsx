import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, csrfClient } from '../lib/api'
import type { Store, TrialLimits, User } from '../types'

interface AuthContextValue {
  user: User | null
  store: Store | null
  limits: TrialLimits | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshLimits: () => Promise<void>
  refreshStore: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [store, setStore] = useState<Store | null>(null)
  const [limits, setLimits] = useState<TrialLimits | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshLimits = useCallback(async () => {
    try {
      const { data } = await api.get<{ data: TrialLimits }>('/store/limits')
      setLimits(data.data)
    } catch {
      setLimits(null)
    }
  }, [])

  const refreshStore = useCallback(async () => {
    try {
      const { data } = await api.get<{ user: User; store: Store | null }>('/me')
      setUser(data.user)
      setStore(data.store)
      if (data.store) await refreshLimits()
    } catch {
      /* mantém estado atual */
    }
  }, [refreshLimits])

  const hasSessionCookie = useCallback(() => {
    return document.cookie.split(';').some((cookie) => cookie.trim().startsWith('laravel_session='))
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      if (!hasSessionCookie()) {
        setUser(null)
        setStore(null)
        return
      }
      const { data } = await api.get<{ user: User; store: Store | null }>('/me')
      setUser(data.user)
      setStore(data.store)
      if (data.store) await refreshLimits()
    } catch {
      setUser(null)
      setStore(null)
    } finally {
      setIsLoading(false)
    }
  }, [refreshLimits, hasSessionCookie])

  useEffect(() => {
    void fetchUser()
  }, [fetchUser])

  const login = useCallback(
    async (email: string, password: string) => {
      await csrfClient.get('/sanctum/csrf-cookie')

      const { data } = await api.post<{ user: User; store: Store | null }>('/login', { email, password })
      setUser(data.user)
      setStore(data.store)
      if (data.store) await refreshLimits()
    },
    [refreshLimits],
  )

  const logout = useCallback(async () => {
    try {
      await api.post('/logout')
    } finally {
      setUser(null)
      setStore(null)
      setLimits(null)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{ user, store, limits, isLoading, isAuthenticated: !!user, login, logout, refreshLimits, refreshStore }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
