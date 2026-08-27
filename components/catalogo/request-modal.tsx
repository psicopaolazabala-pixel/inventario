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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Solicitud de Préstamo
          </span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {elemento.nombre}
          </h2>
          <p className="text-xs font-mono text-slate-500">
            Placa SENA: {elemento.placa_sena}
          </p>
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
          {/* Selector de Cantidad */}
          <div>
            <label className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <Hash className="h-3.5 w-3.5 text-emerald-600" />
              Cantidad Requerida
            </label>
            <input
              type="number"
              min={1}
              required
              value={cantidad}
              onChange={(e) => setCantidad(parseInt(e.target.value) || 1)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

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
              placeholder="Ej: Formación en Ambiente 204..."
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
              disabled={loading}
              className="flex w-1/2 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}