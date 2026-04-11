import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface Props {
  children: React.ReactNode
  title: string
  module: string
  breadcrumb?: string[]
}

export function AppLayout({ children, title, module: mod, breadcrumb }: Props) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar title={title} module={mod} breadcrumb={breadcrumb} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
