import { createClient } from '@/lib/supabase/server'
import { NotificacionesList } from '@/components/notificaciones/notificaciones-list'
import { redirect } from 'next/navigation'

export default async function NotificacionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notificaciones, error } = await supabase
    .from('notificaciones')
    .select('*')
    .eq('usuario_id', user.id)
    .order('creado_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500">
        Error al cargar notificaciones: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Centro de Notificaciones
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Consulta alertas de estado, recordatorios de vencimiento y novedades de tus solicitudes.
        </p>
      </div>

      <NotificacionesList notificaciones={notificaciones || []} />
    </div>
  )
}