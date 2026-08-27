import { createClient } from '@/lib/supabase/server'
import { AdminSolicitudesList } from '@/components/almacen/admin-solicitudes-list'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic' // Evitar caché estática

export default async function SolicitudesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Consultar ÚNICAMENTE los registros en estado 'pendiente'
  const { data: solicitudes, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      elementos (
        id,
        nombre,
        placa_sena
      ),
      perfiles:usuario_id (
        nombre_completo,
        ficha_caracterizacion,
        documento_identidad
      )
    `)
    .eq('estado', 'pendiente') // <-- Este filtro evita que reaparezcan los aprobados
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500">
        Error al cargar solicitudes: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Gestión de Solicitudes - Almacén
        </h1>
        <p className="text-xs text-slate-400">
          Aprueba o rechaza solicitudes pendientes de equipos.
        </p>
      </div>

      <AdminSolicitudesList solicitudes={solicitudes || []} />
    </div>
  )
}