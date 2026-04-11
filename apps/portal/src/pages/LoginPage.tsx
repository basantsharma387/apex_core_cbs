import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useState } from 'react'

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})
type FormData = z.infer<typeof schema>

interface LoginResponse {
  body: {
    accessToken: string
    user: { id: string; name: string; email: string; customerId: string; kycStatus: string }
  }
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAccessToken, setUser } = usePortalAuthStore()
  const [showPwd, setShowPwd] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const login = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiClient.post<LoginResponse>('/portal/auth/login', data)
      return (res as unknown as LoginResponse).body
    },
    onSuccess: ({ accessToken, user }) => {
      setAccessToken(accessToken)
      setUser(user)
      navigate('/dashboard')
    },
  })

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      {/* Brand */}
      <div className="mb-8 text-center">
        <div className="w-10 h-10 bg-action rounded-lg flex items-center justify-center mx-auto mb-3">
          <span className="text-white text-sm font-bold">DN</span>
        </div>
        <h1 className="text-xl font-semibold text-ink">Data Networks</h1>
        <p className="text-sm text-sub mt-1">Customer Banking Portal</p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm bg-white border border-border rounded-xl p-8">
        <h2 className="text-lg font-semibold text-ink mb-1">Sign in to your account</h2>
        <p className="text-sm text-sub mb-6">Access your loans, documents, and account overview</p>

        <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              className="portal-input"
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-risk mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-sm font-medium text-ink">Password</label>
              <button type="button" className="text-xs text-action hover:underline">Forgot password?</button>
            </div>
            <div className="relative">
              <input
                {...register('password')}
                type={showPwd ? 'text' : 'password'}
                placeholder="••••••••"
                className="portal-input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-sub"
                onClick={() => setShowPwd(v => !v)}
              >
                {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-risk mt-1">{errors.password.message}</p>}
          </div>

          {login.error && (
            <p className="text-sm text-risk bg-risk-bg border border-risk/20 rounded-lg px-4 py-2.5">
              Invalid email or password. Please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full h-10 bg-action text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-actionHover transition-colors disabled:opacity-60"
          >
            {login.isPending ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Sign in <ArrowRight size={15} /></>
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-muted text-center mt-6">
        New customer?{' '}
        <Link to="/register" className="text-action hover:underline">Open an account</Link>
        {' · '}
        <Link to="/support" className="text-action hover:underline">Get support</Link>
      </p>
    </div>
  )
}
