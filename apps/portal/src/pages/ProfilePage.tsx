import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { User, Mail, Phone, MapPin, Shield } from 'lucide-react'
import PageLayout from '@/components/layout/PageLayout'
import { portalClient } from '@/api/client'
import { usePortalAuthStore } from '@/store/authStore'

const ProfileSchema = z.object({
  fullName: z.string().min(2),
  email:    z.string().email(),
  phone:    z.string().min(10).max(15),
  address:  z.string().min(5).optional(),
})
type ProfileForm = z.infer<typeof ProfileSchema>

const PasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword:     z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})
type PasswordForm = z.infer<typeof PasswordSchema>

function Field({
  label, icon: Icon, error, children,
}: { label: string; icon?: React.ElementType; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="portal-label flex items-center gap-1.5">
        {Icon && <Icon size={12} className="text-muted" />}
        {label}
      </label>
      {children}
      {error && <p className="portal-error">{error}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const user   = usePortalAuthStore(s => s.user)
  const logout = usePortalAuthStore(s => s.logout)

  const {
    register: rp, handleSubmit: hp, formState: { errors: ep },
  } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { fullName: user?.name ?? '', email: user?.email ?? '' },
  })

  const {
    register: rs, handleSubmit: hs, formState: { errors: es }, reset,
  } = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
  })

  const profileMut  = useMutation({
    mutationFn: (d: ProfileForm) => portalClient.patch('/portal/profile', d),
  })
  const passwordMut = useMutation({
    mutationFn: (d: PasswordForm) => portalClient.post('/portal/change-password', d),
    onSuccess: () => reset(),
  })

  return (
    <PageLayout title="My Profile">
      <div className="max-w-lg mx-auto space-y-5">
        {/* Avatar + quick info */}
        <div className="portal-card p-5 flex items-center gap-4 shadow-card">
          <div className="w-12 h-12 rounded-pill bg-actionLight flex items-center justify-center text-action font-semibold text-base flex-shrink-0">
            {(user?.name ?? 'U').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink truncate">{user?.name ?? 'Customer'}</p>
            <p className="text-xs text-sub truncate">{user?.email ?? ''}</p>
            <p className="text-[11px] text-muted mt-0.5 font-mono truncate">ID: {user?.id ?? '—'}</p>
          </div>
        </div>

        {/* Personal details */}
        <div className="portal-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
            <User size={14} className="text-sub" />
            Personal details
          </h3>
          <form onSubmit={hp(d => profileMut.mutate(d))} className="space-y-4">
            <Field label="Full name" icon={User} error={ep.fullName?.message}>
              <input {...rp('fullName')} className="portal-input" />
            </Field>
            <Field label="Email" icon={Mail} error={ep.email?.message}>
              <input {...rp('email')} type="email" className="portal-input" />
            </Field>
            <Field label="Phone" icon={Phone} error={ep.phone?.message}>
              <input {...rp('phone')} className="portal-input" />
            </Field>
            <Field label="Address" icon={MapPin} error={ep.address?.message}>
              <textarea {...rp('address')} rows={2} className="portal-textarea" />
            </Field>
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={profileMut.isPending} className="btn-primary">
                {profileMut.isPending ? 'Saving…' : 'Save changes'}
              </button>
              {profileMut.isSuccess && (
                <span className="text-xs text-ok">Profile updated</span>
              )}
            </div>
          </form>
        </div>

        {/* Password change */}
        <div className="portal-card p-6 shadow-card">
          <h3 className="text-sm font-semibold text-ink mb-5 flex items-center gap-2">
            <Shield size={14} className="text-sub" />
            Change password
          </h3>
          <form onSubmit={hs(d => passwordMut.mutate(d))} className="space-y-4">
            {[
              { name: 'currentPassword' as const, label: 'Current password'     },
              { name: 'newPassword'     as const, label: 'New password'         },
              { name: 'confirmPassword' as const, label: 'Confirm new password' },
            ].map(f => (
              <Field key={f.name} label={f.label} error={es[f.name]?.message}>
                <input {...rs(f.name)} type="password" className="portal-input" />
              </Field>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={passwordMut.isPending} className="btn-primary">
                {passwordMut.isPending ? 'Updating…' : 'Update password'}
              </button>
              {passwordMut.isError && (
                <span className="text-xs text-risk">Check your current password</span>
              )}
              {passwordMut.isSuccess && (
                <span className="text-xs text-ok">Password updated</span>
              )}
            </div>
          </form>
        </div>

        {/* Sign out */}
        <div className="portal-card p-5 shadow-card">
          <button
            onClick={logout}
            className="text-sm font-medium text-risk hover:brightness-110 transition-all"
          >
            Sign out of all devices
          </button>
        </div>
      </div>
    </PageLayout>
  )
}
