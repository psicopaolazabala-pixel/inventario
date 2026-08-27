'use client'

import { useState, useMemo } from 'react'
import { User, Calendar, Check, X, Loader2, Layers, Package } from 'lucide-react'
import { cambiarEstadoSolicitud } from '@/app/actions/almacen'

interface AdminSolicitudesListProps {
  solicitudes: any[]
}

interface SolicitudAgrupada {
  grupoId: string
  nombreSolicitante: string
  identificacion: string
  created_at: string
  motivo?: string
  estado: string
  elementos: {
    id: string
    nombre: string
    placa_sena: string
  }[]
}

export function AdminSolicitudesList({ solicitudes: solicitudesIniciales }: AdminSolicitudesListProps) {
  const [solicitudes, setSolicitudes] = useState<any[]>(solicitudesIniciales)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // Agrupar las solicitudes por grupo_id o id individual
  const solicitudesAgrupadas = useMemo(() => {
    const gruposMap = new Map<string, SolicitudAgrupada>()

    for (const item of solicitudes || []) {
      const gId = item.grupo_id || item.id

      if (!gruposMap.has(gId)) {
        const nombreSolicitante = item.perfiles?.nombre_completo || 'Usuario Desconocido'
        const identificacion = item.perfiles?.ficha_caracterizacion
          ? `Ficha: ${item.perfiles.ficha_caracterizacion}`
          : item.perfiles?.documento_identidad
          ? `Doc: ${item.perfiles.documento_identidad}`
          : 'Sin Registro'

        gruposMap.set(gId, {
          grupoId: gId,
          nombreSolicitante,
          identificacion,
          created_at: item.created_at,
          motivo: item.motivo,
          estado: item.estado,
          elementos: [],
        })
      }

      const grupoActual = gruposMap.get(gId)!
      grupoActual.elementos.push({
        id: item.id,
        nombre: item.elementos?.nombre || 'Elemento sin nombre',
        placa_sena: item.elementos?.placa_sena || 'S/N',
      })
    }

    return Array.from(gruposMap.values())
  }, [solicitudes])

  const handleEstadoChange = async (grupoId: string, nuevoEstado: 'aprobado' | 'rechazado') => {
    setLoadingId(grupoId)
    try {
      const res = await cambiarEstadoSolicitud(grupoId, nuevoEstado)
      if (res.success) {
        // Remover todos los elementos de este grupo de la vista
        setSolicitudes((prev) => prev.filter((item) => (item.grupo_id || item.id) !== grupoId))
      } else {
        alert(res.message || 'Error al actualizar la solicitud.')
      }
    } catch (error: any) {
      alert('Error al conectar con el servidor.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {solicitudesAgrupadas.length > 0 ? (
        solicitudesAgrupadas.map((grupo) => {
          const esMultiple = grupo.elementos.length > 1

          return (
            <div
              key={grupo.grupoId}
              className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:flex-row sm:items-center"
            >
              <div className="space-y-2.5">
                {/* Título principal del pedido */}
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-emerald-400">
                    {esMultiple ? <Layers className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {esMultiple
                      ? `Solicitud Múltiple (${grupo.elementos.length} elementos)`
                      : grupo.elementos[0]?.nombre}
                  </h3>
                </div>

                {/* Desglose de elementos con sus placas */}
                <div className="flex flex-wrap gap-2 pl-0 sm:pl-12">
                  {grupo.elementos.map((el, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1 text-xs text-slate-300"
                    >
                      <span className="font-semibold text-white">{el.nombre}</span>
                      <code className="font-mono text-[11px] text-emerald-400">({el.placa_sena})</code>
                    </span>
                  ))}
                </div>

                {/* Metadatos del solicitante y fecha */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pl-0 sm:pl-12">
                  <span className="flex items-center gap-1.5 font-medium text-slate-200">
                    <User className="h-3.5 w-3.5 text-emerald-500" />
                    {grupo.nombreSolicitante} ({grupo.identificacion})
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    {new Date(grupo.created_at).toLocaleString('es-CO', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                {grupo.motivo && (
                  <p className="text-xs italic text-slate-400 pl-0 sm:pl-12">
                    "{grupo.motivo}"
                  </p>
                )}
              </div>

              {/* Botones de acción agrupados */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleEstadoChange(grupo.grupoId, 'rechazado')}
                  disabled={loadingId === grupo.grupoId}
                  className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500 hover:text-white disabled:opacity-50 transition-all"
                >
                  <X className="h-4 w-4" /> Rechazar
                </button>

                <button
                  onClick={() => handleEstadoChange(grupo.grupoId, 'aprobado')}
                  disabled={loadingId === grupo.grupoId}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 transition-all"
                >
                  {loadingId === grupo.grupoId ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Aprobar Todo
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        })
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-sm text-slate-500">
          No hay solicitudes pendientes.
        </div>
      )}
    </div>
  )
}