'use client'

import { useState } from 'react'
import { marcarNotificacionLeida, marcarTodasLeidas } from '@/app/actions/notificaciones'
import { Bell, CheckCheck, Clock, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface Notificacion {
  id: string
  titulo: string
  mensaje: string
  leido: boolean
  created_at: string
}

export function NotificacionesList({ notificaciones }: { notificaciones: Notificacion[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingAll, setLoadingAll] = useState(false)

  const handleMarkOne = async (id: string) => {
    setLoadingId(id)
    await marcarNotificacionLeida(id)
    setLoadingId(null)
  }

  const handleMarkAll = async () => {
    setLoadingAll(true)
    await marcarTodasLeidas()
    setLoadingAll(false)
  }

  const unreadCount = notificaciones.filter((n) => !n.leido).length

  if (notificaciones.length === 0) {
    return (
      <div className="mt-8 rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800">
        <Bell className="mx-auto h-12 w-12 text-slate-400 stroke-1" />
        <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-white">Sin notificaciones</h3>
        <p className="mt-1 text-xs text-slate-500">No tienes alertas o avisos registrados en este momento.</p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      {/* Barra de Acciones */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Tienes <strong className="text-emerald-600 dark:text-emerald-400">{unreadCount}</strong> sin leer
          </span>
          <button
            onClick={handleMarkAll}
            disabled={loadingAll}
            className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700 disabled:opacity-50 dark:text-emerald-400"
          >
            <CheckCheck className="h-4 w-4" />
            Marcar todas como leídas
          </button>
        </div>
      )}

      {/* Lista de Alertas */}
      <div className="space-y-3">
        {notificaciones.map((item) => {
          const isWarning = item.titulo.includes('Vencido') || item.titulo.includes('⚠️')

          return (
            <div
              key={item.id}
              onClick={() => !item.leido && handleMarkOne(item.id)}
              className={`flex items-start justify-between gap-4 rounded-2xl border p-4 transition-all ${
                !item.leido
                  ? 'cursor-pointer border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                  : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  isWarning
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                }`}>
                  {isWarning ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {item.titulo}
                    </h3>
                    {!item.leido && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                    {item.mensaje}
                  </p>
                  <span className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" />
                    {new Date(item.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>

              {!item.leido && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleMarkOne(item.id)
                  }}
                  disabled={loadingId === item.id}
                  className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                  title="Marcar como leída"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}