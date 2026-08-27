import { createClient } from '@/lib/supabase/server'
import { PrestamosList } from '@/components/prestamos/prestamos-list'
import { redirect } from 'next/navigation'

export default async function MisPrestamosPage() {
  const supabase = await createClient()

  // 1. Obtener usuario autenticado
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 2. Consultar solicitudes y unir la información con la tabla elementos
  const { data: prestamos, error } = await supabase
    .from('prestamos')
    .select(`
      *,
      elementos (
        id,
        nombre,
        placa_sena,
        categoria,
        imagen_url
      )
    `)
    .eq('usuario_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500">
        Error al obtener tu historial de préstamos: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Mis Solicitudes y Préstamos
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Consulta el estado de tus solicitudes y genera tu tiquete QR para la entrega o recepción.
        </p>
      </div>

      {/* Lista interactiva */}
      <PrestamosList prestamos={prestamos || []} />
    </div>
  )
}