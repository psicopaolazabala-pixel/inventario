'use client'

import { useState } from 'react'
import { Elemento } from '@/types'
import { crearSolicitudPrestamo } from '@/app/actions/prestamos'
import { X, Calendar, Clock, FileText, AlertCircle, Loader2, CheckCircle2, Hash } from 'lucide-react'

interface RequestModalProps {
  elemento: Elemento | null
  isOpen: boolean
  onClose: () => void
}

export function RequestModal({ elemento, isOpen, onClose }: RequestModalProps) {
  const [cantidad, setCantidad] = useState(1)
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [motivo, setMotivo] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen || !elemento) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    const response = await crearSolicitudPrestamo({
      elementoId: elemento.id,
      cantidad,
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
        onClose()
      }, 2000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-3xl bg-slate-900 p-5 sm:p-6 shadow-2xl border border-slate-800 text-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 pr-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            Solicitud de Préstamo
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-white truncate">
            {elemento.nombre}
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Placa SENA: {elemento.placa_sena}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300">
              <Hash className="h-3.5 w-3.5 text-emerald-400" />
              Cantidad Requerida
            </label>
            <input
              type="number"
              min={1}
              required
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300">
                <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                Fecha/Hora Salida
              </label>
              <input
                type="datetime-local"
                required
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300">
                <Clock className="h-3.5 w-3.5 text-emerald-400" />
                Fecha/Hora Devolución
              </label>
              <input
                type="datetime-local"
                required
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 font-semibold text-slate-300">
              <FileText className="h-3.5 w-3.5 text-emerald-400" />
              Motivo o Destino del Préstamo
            </label>
            <textarea
              rows={3}
              required
              placeholder="Ej: Formación en Ambiente 204..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="mt-5 flex flex-col-reverse sm:flex-row items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 rounded-xl border border-slate-800 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-1/2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}