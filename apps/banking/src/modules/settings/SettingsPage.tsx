import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Shield, Bell, Building2, Key } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Panel } from '@/components/ui/Panel'
import { apiClient } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const ProfileSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
})
type ProfileForm = z.infer<typeof ProfileSchema>

const PasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8),
  confirmPassword: z.string().min(8),
}).refine(d => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })
type PasswordForm = z.infer<typeof PasswordSchema>

type Tab = 'profile' | 'security' | 'notifications' | 'tenant'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'profile',       label: 'Profile',        icon: User },
  { id: 'security',      label: 'Security',        icon: Shield },
  { id: 'notifications', label: 'Notifications',   icon: Bell },
  { id: 'tenant',        label: 'Organisation',    icon: Building2 },
]

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-slate-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-[11px] text-red-600 mt-1">{error}</p>}
    </div>
  )
}

function ProfileTab() {
  const user = useAuthStore(s => s.user)
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(ProfileSchema),
    defaultValues: { fullName: user?.name ?? '', email: user?.email ?? '' },
  })
  const mut = useMutation({ mutationFn: (d: ProfileForm) => apiClient.patch('/auth/profile', d) })

  return (
    <form onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4 max-w-md">
      <Field label="Full Name" error={errors.fullName?.message}>
        <input {...register('fullName')} className="input w-full" />
      </Field>
      <Field label="Email" error={errors.email?.message}>
        <input {...register('email')} type="email" className="input w-full" />
      </Field>
      <Field label="Phone (optional)" error={errors.phone?.message}>
        <input {...register('phone')} className="input w-full" />
      </Field>
      <div className="pt-2">
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? 'Saving…' : 'Save changes'}
        </button>
        {mut.isSuccess && <span className="ml-3 text-[12px] text-emerald-600">Saved successfully</span>}
      </div>
    </form>
  )
}

function SecurityTab() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PasswordForm>({
    resolver: zodResolver(PasswordSchema),
  })
  const mut = useMutation({
    mutationFn: (d: PasswordForm) => apiClient.post('/auth/change-password', d),
    onSuccess: () => reset(),
  })

  return (
    <div className="space-y-6 max-w-md">
      <form onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4">
        <h3 className="text-[13px] font-semibold text-slate-800 flex items-center gap-2">
          <Key size={13} /> Change password
        </h3>
        <Field label="Current password" error={errors.currentPassword?.message}>
          <input {...register('currentPassword')} type="password" className="input w-full" />
        </Field>
        <Field label="New password" error={errors.newPassword?.message}>
          <input {...register('newPassword')} type="password" className="input w-full" />
        </Field>
        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          <input {...register('confirmPassword')} type="password" className="input w-full" />
        </Field>
        <button type="submit" disabled={mut.isPending} className="btn-primary">
          {mut.isPending ? 'Updating…' : 'Update password'}
        </button>
        {mut.isError && <p className="text-[12px] text-red-600">Failed to update password. Check your current password.</p>}
        {mut.isSuccess && <p className="text-[12px] text-emerald-600">Password updated successfully.</p>}
      </form>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="text-[13px] font-semibold text-slate-800 mb-3">Active sessions</h3>
        <p className="text-[12px] text-slate-500">Session management is handled by your organisation's SSO policy.</p>
      </div>
    </div>
  )
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    ewsAlerts: true, amlAlerts: true, loanApproval: true, docExpiry: true, systemAlerts: false,
  })

  return (
    <div className="space-y-3 max-w-md">
      <p className="text-[12px] text-slate-500 mb-4">Choose which alerts you receive via in-app and email notifications.</p>
      {Object.entries(prefs).map(([key, val]) => {
        const labels: Record<string, string> = {
          ewsAlerts: 'EWS risk alerts',
          amlAlerts: 'AML flagged transactions',
          loanApproval: 'Loan approval decisions',
          docExpiry: 'Document expiry warnings',
          systemAlerts: 'System maintenance alerts',
        }
        return (
          <label key={key} className="flex items-center justify-between py-3 border-b border-gray-100 cursor-pointer">
            <span className="text-[13px] text-slate-700">{labels[key]}</span>
            <button
              type="button"
              onClick={() => setPrefs(p => ({ ...p, [key]: !p[key as keyof typeof p] }))}
              className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${val ? 'bg-blue-600' : 'bg-gray-200'}`}
            >
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${val ? 'translate-x-4' : ''}`} />
            </button>
          </label>
        )
      })}
      <div className="pt-3">
        <button className="btn-primary">Save preferences</button>
      </div>
    </div>
  )
}

const TenantSchema = z.object({
  name: z.string().min(2),
  region: z.string().optional(),
  dataResidency: z.string().optional(),
})
type TenantForm = z.infer<typeof TenantSchema>

function TenantTab() {
  const role = useAuthStore(s => s.user?.role)
  const canEdit = role === 'SUPER_ADMIN' || role === 'ADMIN'
  const [editing, setEditing] = useState(false)

  const { data } = useQuery({
    queryKey: ['tenant-info'],
    queryFn: () => apiClient.get('/auth/tenant').then((r: any) => r.body),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<TenantForm>({
    resolver: zodResolver(TenantSchema),
    values: {
      name: data?.name ?? '',
      region: data?.region ?? '',
      dataResidency: data?.dataResidency ?? 'India',
    },
  })

  const mut = useMutation({
    mutationFn: (d: TenantForm) => apiClient.patch('/auth/tenant', d),
    onSuccess: () => { setEditing(false); reset() },
  })

  if (editing && canEdit) {
    return (
      <form onSubmit={handleSubmit(d => mut.mutate(d))} className="space-y-4 max-w-md">
        <Field label="Organisation name" error={errors.name?.message}>
          <input {...register('name')} className="input w-full" />
        </Field>
        <Field label="Region" error={errors.region?.message}>
          <input {...register('region')} className="input w-full" placeholder="APAC / EMEA / US" />
        </Field>
        <Field label="Data residency" error={errors.dataResidency?.message}>
          <input {...register('dataResidency')} className="input w-full" />
        </Field>
        <div className="flex gap-2 pt-2">
          <button type="submit" disabled={mut.isPending} className="btn-primary">
            {mut.isPending ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="btn-secondary">
            Cancel
          </button>
        </div>
        {mut.isError && <p className="text-[12px] text-red-600">Failed to update organisation details.</p>}
      </form>
    )
  }

  return (
    <div className="space-y-4 max-w-md">
      <p className="text-[12px] text-slate-500">
        {canEdit
          ? 'You can edit organisation details as an administrator.'
          : 'Organisation details are managed by your SUPER_ADMIN. Contact your administrator to make changes.'}
      </p>
      <div className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
        {[
          ['Organisation name', data?.name ?? '—'],
          ['Tenant code', data?.code ?? '—'],
          ['Plan', data?.plan ?? 'Enterprise'],
          ['Region', data?.region ?? '—'],
          ['Data residency', data?.dataResidency ?? 'India'],
          ['Created', data?.createdAt ? new Date(data.createdAt).toLocaleDateString() : '—'],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-slate-500">{label}</span>
            <span className="text-[12px] font-medium text-slate-900">{value}</span>
          </div>
        ))}
      </div>
      {canEdit && (
        <button onClick={() => setEditing(true)} className="btn-primary">
          Edit organisation
        </button>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <AppLayout title="Settings" module="Account & System Settings">
      <div className="flex gap-6">
        <nav className="w-44 flex-shrink-0">
          <ul className="space-y-0.5">
            {TABS.map(t => (
              <li key={t.id}>
                <button
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13px] transition-colors ${
                    tab === t.id ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-gray-100'
                  }`}
                >
                  <t.icon size={13} />
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          <Panel title={TABS.find(t => t.id === tab)?.label ?? ''}>
            {tab === 'profile' && <ProfileTab />}
            {tab === 'security' && <SecurityTab />}
            {tab === 'notifications' && <NotificationsTab />}
            {tab === 'tenant' && <TenantTab />}
          </Panel>
        </div>
      </div>
    </AppLayout>
  )
}
