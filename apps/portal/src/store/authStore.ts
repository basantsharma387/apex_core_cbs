import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PortalUser {
  id: string
  name: string
  email: string
  customerId: string
  kycStatus: string
}

interface PortalAuthState {
  accessToken: string | null
  user: PortalUser | null
  setAccessToken: (t: string) => void
  setUser: (u: PortalUser) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const usePortalAuthStore = create<PortalAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      logout: () => set({ accessToken: null, user: null }),
      isAuthenticated: () => !!get().accessToken,
    }),
    { name: 'apex-portal-auth', partialize: s => ({ accessToken: s.accessToken, user: s.user }) }
  )
)
