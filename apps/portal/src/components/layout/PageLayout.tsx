import type { ReactNode } from 'react'
import { Navbar } from './Navbar'

interface PageLayoutProps {
  children: ReactNode
  title?: string
  subtitle?: string
}

export function PageLayout({ children, title, subtitle }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main
        className="w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 pt-5 sm:pt-6 lg:pt-8 pb-[max(2rem,env(safe-area-inset-bottom))]"
      >
        {title && (
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-ink leading-tight">{title}</h1>
            {subtitle && <p className="text-sm text-sub mt-1">{subtitle}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export default PageLayout
