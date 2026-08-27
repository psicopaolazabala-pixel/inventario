'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { actualizarElemento } from '@/app/actions/inventario'
import {
  Pencil,
  ArrowLeft,
  Tag,
  FileText,
  Layers,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Activity,
  Upload,
} from 'lucide-react'
import Link from 'next/link'

export default function EditarElementoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [fetching, setFetching] = useState(true)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Estado para el archivo seleccionado y la vista previa
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'Laptops',
    placaSena: '',
    ubicacion: 'Almacén Central',
    imagenUrl: '',
    estado: 'disponible',
  })

  useEffect(() => {
    const cargarElemento = async () => {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Validar rol del usuario
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single()

      if (perfil?.rol !== 'ADMINISTRADOR') {
        router.push('/catalogo')
        return
      }

      const { data: elemento, error } = await supabase
        .from('elementos')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !elemento) {
        setErrorMessage('No se encontró el elemento especificado.')
      } else {
        setFormData({
          nombre: elemento.nombre || '',
          descripcion: elemento.descripcion || '',
          categoria: elemento.categoria || 'General',
          placaSena: elemento.placa_sena || '',
          ubicacion: elemento.ubication || 'Almacén Central',
          imagenUrl: elemento.imagen_url || '',
          estado: elemento.estado || 'disponible',
        })
        if (elemento.imagen_url) {
          setImagePreview(elemento.imagen_url)
        }
      }
      setFetching(false)
    }
    

    cargarElemento()
  }, [id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Manejar el cambio del archivo de imagen
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    let finalImageUrl = formData.imagenUrl

    // Si el usuario seleccionó un nuevo archivo de imagen, subirlo a Supabase Storage
    if (imageFile) {
      try {
        const supabase = createClient()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `item-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        const { data: storageData, error: storageError } = await supabase.storage
          .from('elementos')
          .upload(fileName, imageFile, { upsert: true })

        if (storageError) {
          throw new Error(`Error al subir la imagen: ${storageError.message}`)
        }

        const { data: publicUrlData } = supabase.storage
          .from('elementos')
          .getPublicUrl(storageData.path)

        finalImageUrl = publicUrlData.publicUrl
      } catch (err: any) {
        setLoading(false)
        setErrorMessage(err.message || 'Error al procesar la imagen.')
        return
      }
    }

    const response = await actualizarElemento({
      id,
      ...formData,
      imagenUrl: finalImageUrl,
    })

    setLoading(false)

    if (!response.success) {
      setErrorMessage(response.message)
    } else {
      setSuccessMessage(response.message)
      setTimeout(() => {
        router.push('/catalogo')
      }, 1200)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm">Cargando información del activo...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Catálogo
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <Pencil className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Editar Activo
          </h1>
          <p className="text-sm text-slate-400">
            Modifica los detalles, ubicación, categoría o foto del equipo.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMessage} Redirigiendo...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl sm:p-8 backdrop-blur-md">
        <div className="space-y-5">
          
          {/* Campo de Subida de Imagen Directa con Vista Previa */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <ImageIcon className="h-3.5 w-3.5 text-emerald-500" />
              Imagen del Activo
            </label>
            <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                {imagePreview ? (
                  <img src={imagePreview} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  id="image-input"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="image-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-400" />
                  {imagePreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                </label>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Formatos permitidos: JPG, PNG, WEBP.
                </p>
              </div>
            </div>
          </div>

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
                value={formData.nombre}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
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
                value={formData.placaSena}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm font-mono text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Categoría y Estado */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
                Categoría
              </label>
              <input
                type="text"
                name="categoria"
                required
                value={formData.categoria}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Activity className="h-3.5 w-3.5 text-emerald-500" />
                Estado del Elemento
              </label>
              <select
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="disponible">Disponible</option>
                <option value="prestado">En Préstamo</option>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="baja">Fuera de Servicio / Baja</option>
              </select>
            </div>
          </div>

          {/* Ubicación */}
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-500" />
              Ubicación Actual
            </label>
            <input
              type="text"
              name="ubicacion"
              required
              value={formData.ubicacion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
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
              value={formData.descripcion}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-sm text-white outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <Link
            href="/catalogo"
            className="rounded-xl border border-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando Cambios...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}