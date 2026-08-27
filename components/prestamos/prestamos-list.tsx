'use client'

import { useState, useMemo } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  QrCode,
  X,
  Calendar,
  Layers,
  AlertTriangle,
} from 'lucide-react'

interface Elemento {
  id: string
  nombre: string
  placa_sena: string
  categoria?: string
  imagen_url?: string
}

interface PrestamoRaw {
  id: string
  grupo_id?: string
  usuario_id: string
  elemento_id: string
  fecha_inicio_programada: string
  fecha_fin_programada: string
  estado: string
  motivo?: string
  created_at?: string
  elementos: Elemento
}

interface PrestamoAgrupado {
  grupoId: string
  estado: string
  fecha_inicio_programada: string
  fecha_fin_programada: string
  motivo?: string
  created_at?: string
  esMora: boolean
  elementos: {
    prestamoId: string
    nombre: string
    placa_sena: string
  }[]
}

export function PrestamosList({ prestamos }: { prestamos: PrestamoRaw[] }) {
  const [selectedGrupo, setSelectedGrupo] = useState<PrestamoAgrupado | null>(null)

  // Agrupar préstamos por grupo_id o por id individual y calcular mora en tiempo real
  const prestamosAgrupados = useMemo(() => {
    const gruposMap = new Map<string, PrestamoAgrupado>()
    const ahora = new Date()

    for (const item of prestamos || []) {
      const gId = item.grupo_id || item.id
      const fechaFin = item.fecha_fin_programada ? new Date(item.fecha_fin_programada) : null
      const estadoMin = item.estado?.toLowerCase()
      const estaEnMora = estadoMin === 'entregado' && Boolean(fechaFin && ahora > fechaFin)

      if (!gruposMap.has(gId)) {
        gruposMap.set(gId, {
          grupoId: gId,
          estado: item.estado,
          fecha_inicio_programada: item.fecha_inicio_programada,
          fecha_fin_programada: item.fecha_fin_programada,
          motivo: item.motivo,
          created_at: item.created_at,
          esMora: estaEnMora,
          elementos: [],
        })
      }

      const grupoActual = gruposMap.get(gId)!
      // Si alguno de los elementos del grupo está en mora, todo el lote se marca en mora
      if (estaEnMora) {
        grupoActual.esMora = true
      }

      grupoActual.elementos.push({
        prestamoId: item.id,
        nombre: item.elementos?.nombre || 'Elemento sin nombre',
        placa_sena: item.elementos?.placa_sena || 'S/N',
      })
    }

    return Array.from(gruposMap.values())
  }, [prestamos])

  const renderEstadoBadge = (estado: string, esMora: boolean = false) => {
    if (esMora) {
      return (
        <span className="flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-400 animate-pulse">
          <AlertTriangle className="h-3.5 w-3.5" /> En Mora / Vencido
        </span>
      )
    }

    switch (estado.toLowerCase()) {
      case 'pendiente':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <Clock className="h-3.5 w-3.5" /> Pendiente
          </span>
        )
      case 'aprobado':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> Aprobado
          </span>
        )
      case 'entregado':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-400">
            <CheckCircle2 className="h-3.5 w-3.5" /> En Préstamo
          </span>
        )
      case 'rechazado':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400">
            <XCircle className="h-3.5 w-3.5" /> Rechazado
          </span>
        )
      case 'devuelto':
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs font-semibold text-slate-300">
            <CheckCircle2 className="h-3.5 w-3.5" /> Devuelto
          </span>
        )
      default:
        return (
          <span className="flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            {estado}
          </span>
        )
    }
  }

  if (prestamosAgrupados.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-md">
        <Package className="mx-auto h-12 w-12 text-slate-600" />
        <h3 className="mt-4 text-base font-bold text-white">No tienes solicitudes registradas</h3>
        <p className="mt-1 text-xs text-slate-400">
          Explora el catálogo de Bienestar e ingresa tu primera solicitud.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3.5">
        {prestamosAgrupados.map((grupo) => {
          const estadoMin = grupo.estado.toLowerCase()
          const puedeVerQR = estadoMin === 'aprobado' || estadoMin === 'entregado'
          const esMultiple = grupo.elementos.length > 1

          return (
            <div
              key={grupo.grupoId}
              onClick={() => {
                if (puedeVerQR) setSelectedGrupo(grupo)
              }}
              className={`group relative flex flex-col justify-between rounded-2xl border p-5 transition-all sm:flex-row sm:items-center ${
                grupo.esMora
                  ? 'border-rose-500/50 bg-rose-950/20 shadow-lg shadow-rose-950/30'
                  : 'border-slate-800 bg-slate-900/60'
              } ${
                puedeVerQR ? 'cursor-pointer hover:border-emerald-500/40 hover:bg-slate-900' : 'cursor-default'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${
                    grupo.esMora
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800/80 text-emerald-400 group-hover:bg-emerald-500/10'
                  }`}
                >
                  {grupo.esMora ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : esMultiple ? (
                    <Layers className="h-6 w-6" />
                  ) : (
                    <Package className="h-6 w-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3
                    className={`font-bold transition-colors ${
                      grupo.esMora
                        ? 'text-rose-300'
                        : 'text-white group-hover:text-emerald-400'
                    }`}
                  >
                    {esMultiple
                      ? `Paquete de ${grupo.elementos.length} elementos`
                      : grupo.elementos[0]?.nombre}
                  </h3>

                  <div className="flex flex-wrap gap-1.5">
                    {grupo.elementos.map((el, i) => (
                      <span
                        key={i}
                        className="inline-block rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 font-mono text-[11px] text-slate-300"
                      >
                        {el.nombre} ({el.placa_sena})
                      </span>
                    ))}
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      Límite:{' '}
                      <strong className={grupo.esMora ? 'text-rose-400' : 'text-slate-300'}>
                        {new Date(grupo.fecha_fin_programada).toLocaleString('es-CO', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </strong>
                    </span>
                  </div>

                  {grupo.esMora && (
                    <p className="text-xs font-semibold text-rose-400 pt-1">
                      ⚠️ Tiempo de entrega vencido. Realiza la devolución inmediata en el almacén.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3 sm:mt-0 sm:justify-end">
                {renderEstadoBadge(grupo.estado, grupo.esMora)}

                {puedeVerQR && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedGrupo(grupo)
                    }}
                    className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold text-white shadow-md transition-all active:scale-95 ${
                      grupo.esMora
                        ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    }`}
                  >
                    <QrCode className="h-3.5 w-3.5" /> Ver Tiquete QR
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL DEL TIQUETE ÚNICO CON QR */}
      {selectedGrupo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setSelectedGrupo(null)}
              className="absolute right-4 top-4 rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center">
              <div
                className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-2xl ${
                  selectedGrupo.esMora ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}
              >
                <QrCode className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Tiquete Digital de Préstamo</h2>
              <p className="text-xs text-slate-400">
                Presenta este QR para registrar la entrega o devolución de todo el pedido.
              </p>

              <div className="my-5 flex justify-center rounded-2xl bg-white p-4 shadow-inner">
                <QRCodeSVG
                  value={selectedGrupo.grupoId}
                  size={180}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="max-h-44 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 p-3.5 text-left text-xs space-y-2">
                <p className="font-bold text-slate-300">Elementos Incluidos ({selectedGrupo.elementos.length}):</p>
                <div className="space-y-1.5">
                  {selectedGrupo.elementos.map((item, index) => (
                    <div key={index} className="flex justify-between border-b border-slate-900 pb-1">
                      <span className="text-white truncate max-w-[180px]">{item.nombre}</span>
                      <code className="text-emerald-400 font-mono">{item.placa_sena}</code>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-slate-400">Estado:</span>
                  {renderEstadoBadge(selectedGrupo.estado, selectedGrupo.esMora)}
                </div>
              </div>

              <button
                onClick={() => setSelectedGrupo(null)}
                className="mt-5 w-full rounded-2xl bg-slate-800 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-700"
              >
                Cerrar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}