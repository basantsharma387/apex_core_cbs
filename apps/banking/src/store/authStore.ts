import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { JWTPayload } from '@apex/shared'

interface AuthState {
  accessToken: string | null
  user: JWTPayload | null
  setAuth: (token: string, user: JWTPayload) => void
  setAccessToken: (token: string) => void
  setUser: (user: JWTPayload) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      user: null,
      setAuth: (accessToken, user) => set({ accessToken, user }),
      setAccessToken: accessToken => set({ accessToken }),
      setUser: user => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: 'apex-auth', partialize: state => ({ accessToken: state.accessToken, user: state.user }) }
  )
)
