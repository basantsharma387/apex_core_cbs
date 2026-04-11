import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const api = axios.create({
  baseURL: import.meta.env['VITE_API_BASE_URL'] ?? '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
})

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  async err => {
    const original = err.config as typeof err.config & { _retry?: boolean }
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const res = await axios.post<{ body: { accessToken: string } }>('/api/v1/auth/refresh', {}, { withCredentials: true })
        const newToken = res.data.body.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        original.headers['Authorization'] = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

// Named alias for pages that import { apiClient }
export const apiClient = api
export default api
