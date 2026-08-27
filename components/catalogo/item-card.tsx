'use client'

import Link from 'next/link'
import { Elemento } from '@/types'
import { Laptop, Package, AlertCircle, Wrench, CheckCircle2, Pencil, Check } from 'lucide-react'

interface ItemCardProps {
  elemento: Elemento
  onSelect: (elemento: Elemento) => void
  isSelected?: boolean
  onToggleSelect?: (elemento: Elemento) => void
  isAdmin?: boolean
}

const statusConfig = {
  disponible: { label: 'Disponible', color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', icon: CheckCircle2 },
  prestado: { label: 'En Préstamo', color: 'bg-amber-500/10 text-amber-600 border-amber-200', icon: AlertCircle },
  mantenimiento: { label: 'Mantenimiento', color: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: Wrench },
  baja: { label: 'Fuera de Servicio', color: 'bg-rose-500/10 text-rose-600 border-rose-200', icon: AlertCircle },
}

export function ItemCard({
  elemento,
  onSelect,
  isSelected = false,
  onToggleSelect,
  isAdmin = false,
}: ItemCardProps) {
  const status = statusConfig[elemento.estado] || statusConfig.disponible
  const StatusIcon = status.icon

  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
      isSelected ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-800'
    }`}>
      {/* Imagen del Activo */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {elemento.imagen_url ? (
          <img
            src={elemento.imagen_url}
            alt={elemento.nombre}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            <Laptop className="h-12 w-12 stroke-1" />
          </div>
        )}

        {/* Checkbox de Selección Múltiple */}
        {elemento.estado === 'disponible' && onToggleSelect && (
          <button
            type="button"
            onClick={() => onToggleSelect(elemento)}
            className={`absolute top-3 right-3 z-10 flex h-7 w-7 items-center justify-center rounded-xl border transition-all ${
              isSelected
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900/60 border-slate-700 text-transparent hover:text-slate-400 backdrop-blur-md'
            }`}
            title={isSelected ? 'Deseleccionar' : 'Seleccionar para préstamo múltiple'}
          >
            <Check className="h-4 w-4 stroke-[3]" />
          </button>
        )}

        {/* Botón flotante para Editar */}
        {isAdmin && (
          <Link
            href={`/inventario/editar/${elemento.id}`}
            className="absolute top-3 left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900/80 text-slate-200 backdrop-blur-md transition-colors hover:bg-emerald-600 hover:text-white"
            title="Editar este activo"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        )}
      </div>

      {/* Detalles del Activo */}
      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-emerald-600 uppercase">
            <Package className="h-3.5 w-3.5" />
            {elemento.categoria}
          </div>
          <h3 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {elemento.nombre}
          </h3>
          <p className="mt-1 text-xs font-mono text-slate-500">
            Placa SENA: <span className="font-semibold text-slate-700 dark:text-slate-300">{elemento.placa_sena}</span>
          </p>

          {/* Muestra la descripción completa (Stock inicial y Estado físico) */}
          {elemento.descripcion && (
            <p className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              {elemento.descripcion}
            </p>
          )}
        </div>

        {/* Botón de Acción */}
        <button
          disabled={elemento.estado !== 'disponible'}
          onClick={() => onSelect(elemento)}
          className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {elemento.estado === 'disponible' ? 'Solicitar Individual' : 'No Disponible'}
        </button>
      </div>
    </div>
  )
}