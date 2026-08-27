'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { crearElemento } from '@/app/actions/inventario'
import {
  PackagePlus,
  ArrowLeft,
  Tag,
  FileText,
  Layers,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

export default function NuevoElementoPage() {
  const router = useRouter()
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Laptops',
    placaSena: '',
    ubicacion: 'Almacén Central',
    imagenUrl: '',
  })

  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (perfil?.rol !== 'ADMINISTRADOR') {
        router.push('/catalogo')
        return
      }

      setCheckingAuth(false)
    }

    checkRole()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const response = await crearElemento(formData)

    setLoading(false)

    if (!response.success) {
      setErrorMessage(response.message)
    } else {
      setSuccessMessage(response.message)
      setTimeout(() => {
        router.push('/catalogo')
      }, 1500)
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="ml-2 text-sm">Verificando permisos de acceso...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Botón Volver */}
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Catálogo
      </Link>

      {/* Encabezado */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <PackagePlus className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Registrar Nuevo Activo
          </h1>
          <p className="text-sm text-slate-400">
            Ingresa los detalles del equipo o elemento para ponerlo disponible en el catálogo.
          </p>
        </div>
      </div>

      {/* Mensaje de Error */}
      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Mensaje de Éxito */}
      {successMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage} Redirigiendo...</span>
        </div>
      )}

      {/* Formulario con estilos oscuros ajustados */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8 backdrop-blur-md">
        <div className="space-y-5">
          
          {/* Nombre y Placa */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Tag className="h-3.5 w-3.5 text-emerald-500" />
                Nombre del Elemento
              </label>
              <input
                type="text"
                name="nombre"
                required
                placeholder="Ej: Portátil Lenovo ThinkPad E14"
                value={formData.nombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Tag className="h-3.5 w-3.5 text-emerald-500" />
                Placa SENA / Serial
              </label>
              <input
                type="text"
                name="placaSena"
                required
                placeholder="Ej: SENA-982341"
                value={formData.placaSena}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Categoría y Ubicación */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                Categoría
              </label>
              <select
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="Laptops">Laptops / Cómputo</option>
                <option value="Proyectores">Proyectores / Video Beam</option>
                <option value="Herramientas">Herramientas</option>
                <option value="Accesorios">Accesorios y Cables</option>
                <option value="Equipos de Red">Equipos de Red</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                Ubicación Inicial
              </label>
              <input
                type="text"
                name="ubicacion"
                required
                placeholder="Ej: Almacén Central / Ambiente 201"
                value={formData.ubicacion}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Imagen */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              URL de la Imagen (Opcional)
            </label>
            <input
              type="url"
              name="imagenUrl"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={formData.imagenUrl}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <FileText className="h-3.5 w-3.5 text-emerald-500" />
              Descripción o Especificaciones
            </label>
            <textarea
              name="descripcion"
              rows={3}
              placeholder="Ej: Procesador Intel i5, 16GB RAM, incluye cargador original y estuche..."
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <Link
            href="/catalogo"
            className="rounded-xl border border-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar en Inventario'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}