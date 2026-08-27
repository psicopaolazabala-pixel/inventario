'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ItemPreview } from '@/app/actions/carga-masiva'
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Image as ImageIcon,
  PackageCheck,
} from 'lucide-react'
import Link from 'next/link'

// Función auxiliar para comprimir la imagen en el cliente usando HTML5 Canvas
async function comprimirBase64ABlob(base64Data: string, extension: string = 'png'): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.src = `data:image/${extension};base64,${base64Data}`
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Redimensionar a un máximo razonable para catálogo web (600px de ancho)
      const MAX_WIDTH = 600
      const scaleSize = MAX_WIDTH / img.width
      
      if (scaleSize < 1) {
        canvas.width = MAX_WIDTH
        canvas.height = img.height * scaleSize
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }

      // Convertir a JPEG comprimido al 75% de calidad (Ocupa ~25KB)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            // Backup si falla el canvas
            const byteCharacters = atob(base64Data)
            const byteNumbers = new Array(byteCharacters.length)
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i)
            }
            resolve(new Blob([new Uint8Array(byteNumbers)], { type: `image/${extension}` }))
          }
        },
        'image/jpeg',
        0.75
      )
    }
  })
}

export default function CargaMasivaPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState({ actual: 0, total: 0 })
  const [previewItems, setPreviewItems] = useState<ItemPreview[]>([])
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setMessage(null)
    }
  }

  const handleAnalyzeExcel = async () => {
    if (!file) return
    setAnalyzing(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/carga-masiva', {
        method: 'POST',
        body: formData,
      })

      const res = await response.json()
      setAnalyzing(false)

      if (res.success && res.items) {
        setPreviewItems(res.items)
        setMessage({ type: 'success', text: res.message })
      } else {
        setMessage({ type: 'error', text: res.message || 'Error al analizar el archivo.' })
      }
    } catch {
      setAnalyzing(false)
      setMessage({ type: 'error', text: 'Error al conectar con el servidor.' })
    }
  }

  // --- SUBIDA DIRECTA COMPRIMIDA A SUPABASE ---
  const handleConfirmImport = async () => {
    if (previewItems.length === 0) return
    setUploading(true)
    setMessage(null)
    setProgress({ actual: 0, total: previewItems.length })

    const supabase = createClient()
    let insertados = 0

    for (let i = 0; i < previewItems.length; i++) {
      const item = previewItems[i]
      let imagenPublicUrl: string | null = null

      // 1. Comprimir e intentar subir imagen si existe
      if (item.tieneImagen && item.imageBufferBase64) {
        try {
          const imageBlob = await comprimirBase64ABlob(item.imageBufferBase64, item.extensionImagen)
          const fileName = `item-${Date.now()}-${item.consecutivo}.jpg`

          const { data: storageData } = await supabase.storage
            .from('elementos')
            .upload(fileName, imageBlob, {
              contentType: 'image/jpeg',
              upsert: true,
            })

          if (storageData) {
            const { data: publicUrlData } = supabase.storage
              .from('elementos')
              .getPublicUrl(storageData.path)
            imagenPublicUrl = publicUrlData.publicUrl
          }
        } catch (err) {
          console.error('Error procesando imagen comprimida:', err)
        }
      }

      // 2. Guardar registro en Supabase
      const placaSena = `SENA-BIENESTAR-${item.consecutivo}`

      const { error } = await supabase.from('elementos').insert({
        nombre: item.nombre,
        descripcion: `Stock inicial: ${item.cantidad} unidad(es). Estado físico: ${item.estadoFisico}`,
        categoria: item.categoria,
        placa_sena: placaSena,
        imagen_url: imagenPublicUrl,
        estado: 'disponible',
        ubication: 'Almacén Bienestar al Aprendiz',
      })

      if (!error) insertados++
      setProgress({ actual: i + 1, total: previewItems.length })
    }

    setUploading(false)
    setMessage({
      type: 'success',
      text: `¡Carga Masiva Exitosa! Se registraron ${insertados} elementos con sus imágenes comprimidas en Supabase.`,
    })

    setTimeout(() => {
      router.push('/catalogo')
    }, 2000)
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/catalogo"
        className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver al Catálogo
      </Link>

      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <FileSpreadsheet className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Carga Masiva de Activos
          </h1>
          <p className="text-sm text-slate-400">
            Sube un archivo de Excel (.xlsx) con el inventario e imágenes para registrar múltiples elementos automáticamente.
          </p>
        </div>
      </div>

      {/* Indicador de Progreso en Tiempo Real */}
      {uploading && (
        <div className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 text-center text-white backdrop-blur-md">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500 mb-2" />
          <h3 className="text-base font-bold">Subiendo e importando activos...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Procesando {progress.actual} de {progress.total} elementos (Imágenes optimizadas)
          </p>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${(progress.actual / progress.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {message && !uploading && (
        <div className={`mb-6 flex items-center gap-2 rounded-2xl p-4 text-sm ${
          message.type === 'success'
            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
            : 'border border-rose-500/30 bg-rose-500/10 text-rose-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertCircle className="h-5 w-5 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Selector de Archivo */}
      {previewItems.length === 0 && (
        <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/60 p-8 text-center backdrop-blur-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-emerald-500">
            <UploadCloud className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">Selecciona tu archivo de Inventario Excel</h3>
          <p className="mt-1 text-xs text-slate-400">
            Soporta archivos .xlsx con imágenes embebidas en las filas.
          </p>

          <input
            type="file"
            id="excel-input"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="mt-6 flex justify-center gap-3">
            <label
              htmlFor="excel-input"
              className="cursor-pointer rounded-xl border border-slate-800 bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
            >
              {file ? file.name : 'Buscar Archivo Excel'}
            </label>

            {file && (
              <button
                onClick={handleAnalyzeExcel}
                disabled={analyzing}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando Tablas e Imágenes...
                  </>
                ) : (
                  'Analizar Contenido'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Previsualización */}
      {previewItems.length > 0 && !uploading && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-3">
              <PackageCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-sm font-bold text-white">
                {previewItems.length} Elementos Listos para Importar
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPreviewItems([])}
                className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500"
              >
                Confirmar y Subir {previewItems.length} Elementos
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {previewItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-950 border border-slate-800">
                  {item.tieneImagen && item.imageBufferBase64 ? (
                    <img
                      src={`data:image/${item.extensionImagen || 'png'};base64,${item.imageBufferBase64}`}
                      alt={item.nombre}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-slate-600" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                    {item.categoria}
                  </span>
                  <h4 className="truncate text-xs font-bold text-white mt-1">
                    {item.nombre}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Cant: {item.cantidad} | {item.tieneImagen ? '📷 Imagen OK' : '⚠️ Sin foto'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}