'use client'

import { useState } from 'react'
import { Elemento } from '@/types'
import { crearSolicitudPrestamoMultiple } from '@/app/actions/prestamos'
import { X, Calendar, Clock, FileText, AlertCircle, Loader2, CheckCircle2, ShoppingBag, Trash2 } from 'lucide-react'

interface RequestModalMultipleProps {
  elementos: Elemento[]
  isOpen: boolean
  onClose: () => void
  onRemoveItem: (id: string) => void
  onSuccess: () => void
}

export function RequestModalMultiple({
  elementos,
  isOpen,
  onClose,
  onRemoveItem,
  onSuccess,
}: RequestModalMultipleProps) {
  const [cantidades, setCantidades] = useState<Record<string, number>>({})
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleCantidadChange = (id: string, val: number) => {
    setCantidades((prev) => ({ ...prev, [id]: Math.max(1, val) }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (elementos.length === 0) return

    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const payload = elementos.map((item) => ({
      id: item.id,
      cantidad: cantidades[item.id] || 1,
    }))

    const response = await crearSolicitudPrestamoMultiple({
      elementos: payload,
      fechaInicio,
      fechaFin,
      motivo,
    })

    setLoading(false)

    if (!response.success) {
      setErrorMessage(response.message)
    } else {
      setSuccessMessage(response.message)
      setTimeout(() => {
        setSuccessMessage(null)
        onSuccess()
        onClose()
      }, 1800)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600">
            <ShoppingBag className="h-4 w-4" />
            Préstamo Múltiple
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Tramitar {elementos.length} Elemento(s)
          </h2>
        </div>

        {/* Lista con selector de cantidad independiente por elemento */}
        <div className="mb-4 max-h-48 overflow-y-auto space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
          {elementos.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="truncate pr-2 flex-1">
                <span className="font-bold text-slate-900 dark:text-white block truncate">{item.nombre}</span>
                <span className="font-mono text-[10px] text-slate-400">({item.placa_sena})</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-slate-400">Cant:</span>
                  <input
                    type="number"
                    min={1}
                    value={cantidades[item.id] || 1}
                    onChange={(e) => handleCantidadChange(item.id, parseInt(e.target.value) || 1)}
                    className="w-14 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1 text-center font-bold text-white outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveItem(item.id)}
                  className="text-rose-500 hover:text-rose-600 p-1"
                  title="Quitar de la lista"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              Fecha y Hora de Salida Estimada
            </label>
            <input
              type="datetime-local"
              required
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Clock className="h-3.5 w-3.5 text-emerald-600" />
              Fecha y Hora de Devolución Estimada
            </label>
            <input
              type="datetime-local"
              required
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="h-3.5 w-3.5 text-emerald-600" />
              Motivo o Destino del Préstamo
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ej: Actividad deportiva / Formación..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="mt-6 flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || elementos.length === 0}
              className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Solicitar (${elementos.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}