import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { JWTPayload } from '@apex/shared'
import { jwtDecode } from 'jwt-decode'
import { ShieldCheck, TrendingUp, Layers } from 'lucide-react'

const schema = z.object({
  email:      z.string().email('Valid email required'),
  password:   z.string().min(8, 'Password required'),
  tenantCode: z.string().min(1, 'Tenant code required'),
})
type FormData = z.infer<typeof schema>

// ── Carousel content ────────────────────────────────────────────────────────
const SLIDES = [
  {
    icon: Layers,
    title: 'One platform. Ten modules.',
    body: 'Loans, risk, compliance, collections and reporting — unified in a single operations console.',
  },
  {
    icon: ShieldCheck,
    title: 'AI-driven risk monitoring',
    body: 'Early-warning alerts, IFRS 9 staging and AML surveillance — catch stress 60–90 days earlier.',
  },
  {
    icon: TrendingUp,
    title: 'Treasury, ALM & FTP',
    body: 'Liquidity gap, IRRBB shocks and FTP curves — board-grade dashboards out of the box.',
  },
] as const

const SLIDE_INTERVAL_MS = 5200

function CarouselPanel() {
  const [idx, setIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)

  // Auto-advance
  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => {
        setPrevIdx(i)
        return (i + 1) % SLIDES.length
      })
    }, SLIDE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [])

  // Clear "leaving" state after the transition finishes so the old slide can
  // reset its transform for the next cycle without flashing.
  useEffect(() => {
    if (prevIdx === null) return
    const t = setTimeout(() => setPrevIdx(null), 950)
    return () => clearTimeout(t)
  }, [prevIdx])

  function jump(next: number) {
    if (next === idx) return
    setPrevIdx(idx)
    setIdx(next)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-brand-navy">
      {/* Animated radial grid texture */}
      <div
        className="absolute inset-0 opacity-[0.10] auth-grid"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* Drifting accent blobs */}
      <div className="auth-blob-a absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-brand-blue/35 blur-3xl" />
      <div className="auth-blob-b absolute -bottom-32 -left-16 w-[380px] h-[380px] rounded-full bg-brand-sky/25 blur-3xl" />

      {/* Diagonal sheen */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.03) 100%)',
        }}
      />

      <div className="relative h-full flex flex-col justify-between p-10">
        {/* Top logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-brand-blue rounded-lg flex items-center justify-center shadow-lg shadow-brand-blue/30">
            <span className="text-white text-xs font-bold tracking-tight">DN</span>
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold leading-tight">Data Networks</p>
            <p className="text-white/60 text-[10px] leading-tight">Banking Operations Platform</p>
          </div>
        </div>

        {/* Slides stage */}
        <div className="relative min-h-[220px]">
          {SLIDES.map((slide, i) => {
            const Icon = slide.icon
            const state = i === idx ? 'is-active' : i === prevIdx ? 'is-leaving' : ''
            return (
              <div key={i} className={`auth-slide ${state}`}>
                <div className="auth-slide-child auth-slide-child--icon w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center mb-5 shadow-xl shadow-black/20">
                  <Icon size={24} className="text-white" strokeWidth={1.75} />
                </div>
                <h2 className="auth-slide-child auth-slide-child--title text-white text-[26px] font-semibold leading-[1.15] tracking-tight mb-3 max-w-md">
                  {slide.title}
                </h2>
                <p className="auth-slide-child auth-slide-child--body text-white/70 text-[13px] leading-relaxed max-w-md">
                  {slide.body}
                </p>
              </div>
            )
          })}
        </div>

        {/* Dot indicators with progress ring on active */}
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => {
            const active = i === idx
            return (
              <button
                key={i}
                onClick={() => jump(i)}
                aria-label={`Slide ${i + 1}`}
                className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-500 ease-out ${
                  active ? 'w-10 bg-white/25' : 'w-1.5 bg-white/40 hover:bg-white/60'
                }`}
              >
                {active && (
                  <span
                    key={`bar-${idx}`}
                    className="auth-dot-active-bar absolute inset-0 bg-white rounded-full"
                    style={{ ['--auth-interval' as any]: `${SLIDE_INTERVAL_MS}ms` }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

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
    <div className="min-h-screen flex bg-white">
      {/* Left: carousel — hidden on mobile */}
      <div className="hidden lg:block lg:w-1/2">
        <CarouselPanel />
      </div>

      {/* Right: form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-4 relative bg-white overflow-hidden">
        {/* Grid-dot texture — anchored to the top, fades out downward */}
        <div
          className="absolute top-0 left-0 right-0 h-[46%] pointer-events-none"
          style={{
            backgroundImage: 'url(/griddot.lg.avif)',
            backgroundRepeat: 'repeat',
            backgroundPosition: 'top center',
            backgroundSize: 'auto',
            WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0) 100%)',
            maskImage: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0) 100%)',
          }}
        />

        <div className="w-full max-w-[360px] relative">
          {/* Logo — mobile only */}
          <div className="flex items-center gap-2.5 mb-5 lg:hidden">
            <div className="w-8 h-8 bg-action rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">DN</span>
            </div>
            <div>
              <p className="text-ink text-sm font-semibold leading-tight">Data Networks</p>
              <p className="text-muted text-[11px]">Banking Operations Platform</p>
            </div>
          </div>

          {/* Brand badge — desktop */}
          <div className="hidden lg:flex w-10 h-10 bg-brand-blue rounded-xl items-center justify-center mb-4 shadow-sm">
            <ShieldCheck size={18} className="text-white" strokeWidth={2} />
          </div>

          <h2 className="text-xl font-semibold text-ink mb-1 tracking-tight">Sign in</h2>
          <p className="text-[13px] text-sub mb-5">Operations access for authorised staff only</p>

          <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-3">
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
              <p className="text-[11px] text-risk bg-risk-bg border border-risk/20 rounded px-3 py-1.5">
                {(login.error as Error).message ?? 'Invalid credentials. Please try again.'}
              </p>
            )}

            <Button type="submit" className="w-full" loading={login.isPending}>
              Sign in
            </Button>
          </form>

          <div className="mt-4 pt-4 border-t border-divider">
            <p className="text-center text-[11px] text-muted">
              Need access?{' '}
              <a href="mailto:admin@datanetworks.com" className="text-action hover:underline font-medium">
                Contact your administrator →
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
