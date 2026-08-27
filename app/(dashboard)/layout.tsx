import { Sidebar } from '@/components/layout/sidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <main className="pl-0 transition-all md:pl-64">
        <div className="min-h-screen p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}