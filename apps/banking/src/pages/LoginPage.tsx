import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import type { JWTPayload } from '@apex/shared'
import { jwtDecode } from 'jwt-decode'

const schema = z.object({
  email:      z.string().email('Valid email required'),
  password:   z.string().min(8, 'Password required'),
  tenantCode: z.string().min(1, 'Tenant code required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAccessToken, setUser } = useAuthStore()

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenantCode: 'DEMO' },
  })

  const login = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await axios.post<{ body: { accessToken: string } }>(
        '/api/v1/auth/login', data, { withCredentials: true }
      )
      return res.data.body.accessToken
    },
    onSuccess: (token) => {
      setAccessToken(token)
      const user = jwtDecode<JWTPayload>(token)
      setUser(user)
      navigate('/dashboard')
    },
  })

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-action rounded flex items-center justify-center">
            <span className="text-white text-sm font-bold">DN</span>
          </div>
          <div>
            <p className="text-ink text-base font-semibold leading-tight">Data Networks</p>
            <p className="text-muted text-xs">Banking Operations Platform</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded p-6">
          <h2 className="text-lg font-semibold text-ink mb-1">Sign in</h2>
          <p className="text-sm text-sub mb-6">Operations access for authorised staff only</p>

          <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-4">
            <Input
              {...register('tenantCode')}
              label="Institution code"
              placeholder="e.g. DEMO"
              error={errors.tenantCode?.message}
              required
            />
            <Input
              {...register('email')}
              type="email"
              label="Email address"
              placeholder="you@institution.com"
              error={errors.email?.message}
              required
            />
            <Input
              {...register('password')}
              type="password"
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              required
            />

            {login.error && (
              <p className="text-xs text-risk bg-risk-bg border border-risk/20 rounded px-3 py-2">
                {(login.error as Error).message ?? 'Invalid credentials. Please try again.'}
              </p>
            )}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-muted mt-4">
          Need access?{' '}
          <a href="mailto:admin@datanetworks.com" className="text-action hover:underline">
            Contact your administrator
          </a>
        </p>
      </div>
    </div>
  )
}
