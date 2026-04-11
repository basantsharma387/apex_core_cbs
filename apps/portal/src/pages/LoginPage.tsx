import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { usePortalAuthStore } from '@/store/authStore'
import apiClient from '@/api/client'
import { Eye, EyeOff, ArrowRight, Wallet, FileCheck, Smartphone, ShieldCheck } from 'lucide-react'

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

// ── Carousel content ────────────────────────────────────────────────────────
const SLIDES = [
  {
    icon: Wallet,
    title: 'Your loans, at a glance',
    body: 'Track outstanding balances, upcoming EMIs and repayment schedules — all in one place.',
  },
  {
    icon: FileCheck,
    title: 'KYC & documents, digitised',
    body: 'Upload once, verify instantly. No branch visits, no paperwork to chase.',
  },
  {
    icon: Smartphone,
    title: 'Apply for a loan in minutes',
    body: 'Guided 3-step application with AI-assisted credit scoring. Decisions on the same day.',
  },
] as const

const SLIDE_INTERVAL_MS = 5200
const GET_STARTED_DELAY_MS = 2000

interface CarouselPanelProps {
  onGetStarted?: () => void
}

function CarouselPanel({ onGetStarted }: CarouselPanelProps) {
  const [idx, setIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const [showCta, setShowCta] = useState(false)

  useEffect(() => {
    const t = setInterval(() => {
      setIdx(i => {
        setPrevIdx(i)
        return (i + 1) % SLIDES.length
      })
    }, SLIDE_INTERVAL_MS)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (prevIdx === null) return
    const t = setTimeout(() => setPrevIdx(null), 950)
    return () => clearTimeout(t)
  }, [prevIdx])

  // Reveal the mobile CTA after a short delay
  useEffect(() => {
    if (!onGetStarted) return
    const t = setTimeout(() => setShowCta(true), GET_STARTED_DELAY_MS)
    return () => clearTimeout(t)
  }, [onGetStarted])

  function jump(next: number) {
    if (next === idx) return
    setPrevIdx(idx)
    setIdx(next)
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0D2B6A]">
      <div
        className="absolute inset-0 opacity-[0.10] auth-grid"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
      />
      <div className="auth-blob-a absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-[#1565C0]/40 blur-3xl" />
      <div className="auth-blob-b absolute -bottom-32 -left-16 w-[380px] h-[380px] rounded-full bg-[#2196F3]/25 blur-3xl" />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0.03) 100%)',
        }}
      />

      <div className="relative h-full flex flex-col justify-between p-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-[#1565C0] rounded-lg flex items-center justify-center shadow-lg shadow-[#1565C0]/30">
            <span className="text-white text-xs font-bold tracking-tight">DN</span>
          </div>
          <div>
            <p className="text-white text-[13px] font-semibold leading-tight">Data Networks</p>
            <p className="text-white/60 text-[10px] leading-tight">Customer Banking Portal</p>
          </div>
        </div>

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

        <div className="space-y-5">
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

          {/* Mobile-only "Get started" CTA — fades in after GET_STARTED_DELAY_MS */}
          {onGetStarted && (
            <button
              type="button"
              onClick={onGetStarted}
              className={`lg:hidden w-full h-12 bg-white text-[#0D2B6A] text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xl shadow-black/20 transition-all duration-700 ease-out ${
                showCta ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
              }`}
            >
              Get started
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

type MobileStage = 'carousel' | 'form'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAccessToken, setUser } = usePortalAuthStore()
  const [showPwd, setShowPwd] = useState(false)
  // Mobile-only two-step flow. On lg+ both panels are always visible and this
  // state is ignored.
  const [mobileStage, setMobileStage] = useState<MobileStage>('carousel')

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
    <div className="min-h-screen flex bg-white">
      {/*
        Left carousel.
        - Desktop (lg+): always visible, 50 % width.
        - Mobile: full-screen initially; hidden once user taps Get started.
      */}
      <div
        className={`lg:block lg:w-1/2 ${
          mobileStage === 'carousel' ? 'fixed inset-0 z-30 lg:static' : 'hidden lg:block'
        }`}
      >
        <CarouselPanel onGetStarted={() => setMobileStage('form')} />
      </div>

      {/*
        Right form.
        - Desktop (lg+): always visible, 50 % width.
        - Mobile: hidden until user taps Get started.
      */}
      <div
        className={`lg:w-1/2 lg:flex items-center justify-center px-6 py-4 relative bg-white overflow-hidden ${
          mobileStage === 'form' ? 'flex w-full min-h-screen' : 'hidden lg:flex'
        }`}
      >
        {/* Grid-dot texture — top of panel, fading downward */}
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
          {/* Mobile logo */}
          <div className="mb-5 text-center lg:hidden">
            <div className="w-9 h-9 bg-action rounded-lg flex items-center justify-center mx-auto mb-2">
              <span className="text-white text-xs font-bold">DN</span>
            </div>
            <h1 className="text-base font-semibold text-ink">Data Networks</h1>
            <p className="text-[12px] text-sub mt-0.5">Customer Banking Portal</p>
          </div>

          {/* Desktop badge */}
          <div className="hidden lg:flex w-10 h-10 bg-action rounded-xl items-center justify-center mb-4 shadow-sm">
            <ShieldCheck size={18} className="text-white" strokeWidth={2} />
          </div>

          <h2 className="text-xl font-semibold text-ink mb-1 tracking-tight">Sign in to your account</h2>
          <p className="text-[13px] text-sub mb-5">Access your loans, documents, and account overview</p>

          <form onSubmit={handleSubmit(d => login.mutate(d))} className="space-y-3">
            <div>
              <label className="block text-[12px] font-medium text-ink mb-1">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="you@example.com"
                className="portal-input"
                autoComplete="email"
              />
              {errors.email && <p className="text-[11px] text-risk mt-0.5">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[12px] font-medium text-ink">Password</label>
                <button type="button" className="text-[11px] text-action hover:underline">Forgot password?</button>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="portal-input pr-9"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-sub"
                  onClick={() => setShowPwd(v => !v)}
                >
                  {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-risk mt-0.5">{errors.password.message}</p>}
            </div>

            {login.error && (
              <p className="text-[12px] text-risk bg-risk-bg border border-risk/20 rounded-lg px-3 py-2">
                Invalid email or password. Please try again.
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full h-9 bg-action text-white text-[13px] font-medium rounded-lg flex items-center justify-center gap-2 hover:bg-actionHover transition-colors disabled:opacity-60"
            >
              {login.isPending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={14} /></>
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-divider">
            <p className="text-[11px] text-muted text-center">
              New customer?{' '}
              <Link to="/register" className="text-action hover:underline font-medium">Open an account</Link>
              {' · '}
              <Link to="/support" className="text-action hover:underline font-medium">Get support</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
