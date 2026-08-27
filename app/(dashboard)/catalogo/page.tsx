import { createClient } from '@/lib/supabase/server'
import { ElementosGrid } from '@/components/catalogo/elementos-grid'
import { Search } from 'lucide-react'

export default async function CatalogoPage() {
  const supabase = await createClient()

  // 1. Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Verificar rol en la tabla perfiles
  let isAdmin = false
  if (user) {
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()
    
    isAdmin = perfil?.rol === 'ADMINISTRADOR'
  }

  // 3. Obtener elementos
  const { data: elementos, error } = await supabase
    .from('elementos')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <div className="p-8 text-center text-rose-500">
        Error al cargar los elementos del catálogo: {error.message}
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Catálogo de Equipos y Elementos
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecciona un elemento disponible para tramitar tu solicitud de préstamo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por placa o nombre..."
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      <ElementosGrid elementos={elementos || []} isAdmin={isAdmin} />
    </div>
  )
}