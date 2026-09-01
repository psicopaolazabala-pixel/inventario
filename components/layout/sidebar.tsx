'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  QrCode,
  Package,
  Bell,
  PackagePlus,
  LogOut,
  FileSpreadsheet,
  Menu,
  X,
} from 'lucide-react'

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string>('APRENDIZ')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const fetchUserRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('rol')
          .eq('id', user.id)
          .single()

        if (perfil?.rol) {
          setUserRole(perfil.rol)
        }
      }
    }

    fetchUserRole()
  }, [])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isAdmin = userRole === 'ADMINISTRADOR'

  const navItems = [
    { label: 'Catálogo', href: '/catalogo', icon: Box, show: true },
    { label: 'Mis Préstamos', href: '/mis-prestamos', icon: ClipboardList, show: true },
    { label: 'Notificaciones', href: '/notificaciones', icon: Bell, show: true },
    { label: 'Aprobar Solicitudes', href: '/solicitudes', icon: LayoutDashboard, show: isAdmin },
    { label: 'Escáner QR', href: '/escaner', icon: QrCode, show: isAdmin },
    { label: 'Registrar Activo', href: '/inventario/nuevo', icon: PackagePlus, show: isAdmin },
    { label: 'Carga Masiva', href: '/inventario/carga-masiva', icon: FileSpreadsheet, show: isAdmin },
  ]

  return (
    <>
      {/* Botón flotante para abrir el menú en dispositivos móviles */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-lg md:hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop oscuro que cierra el menú al tocar fuera en pantallas pequeñas */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity md:hidden"
        />
      )}

      {/* Menú lateral responsivo */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex h-screen w-64 flex-col justify-between border-r border-slate-200 bg-white p-4 transition-transform duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 md:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <Package className="h-6 w-6" />
              </div>
              <div className="truncate">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Presta<span className="text-emerald-600">SENA</span>
                </h2>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {userRole}
                </p>
              </div>
            </div>

            {/* Botón para cerrar menú en móviles */}
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

          <nav className="space-y-1.5">
            {navItems
              .filter((item) => item.show)
              .map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                )
              })}
          </nav>
        </div>

        {/* Footer del Sidebar con el botón de Cerrar Sesión */}
        <div className="space-y-2">
          <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="truncate">{isLoggingOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}