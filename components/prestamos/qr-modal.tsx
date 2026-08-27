'use client'

import { QRCodeSVG } from 'qrcode.react'
import { X, Calendar, Clock, Layers, Package, ShieldCheck } from 'lucide-react'

interface ElementoItem {
  id?: string
  nombre?: string
  placa_sena?: string
}

interface PrestamoData {
  id: string
  grupo_id?: string
  fecha_inicio_programada?: string
  fecha_fin_programada?: string
  estado?: string
  elementos?: ElementoItem | ElementoItem[]
}

interface QRModalProps {
  prestamo: PrestamoData | null
  isOpen: boolean
  onClose: () => void
}

export function QRModal({ prestamo, isOpen, onClose }: QRModalProps) {
  if (!isOpen || !prestamo) return null

  // Identificador principal para el QR (grupo_id si existe paquete múltiple, o el ID individual)
  const qrCodeValue = prestamo.grupo_id || prestamo.id

  // Normalizar elementos para soportar tanto un único objeto como un array de elementos
  const listaElementos: ElementoItem[] = Array.isArray(prestamo.elementos)
    ? prestamo.elementos
    : prestamo.elementos
    ? [prestamo.elementos]
    : []

  const esPaqueteMultiple = listaElementos.length > 1

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl bg-slate-800 p-2 text-slate-400 hover:bg-slate-700 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Encabezado del Tiquete */}
        <div className="text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-3 text-lg font-bold text-white">
            Tiquete Digital de Préstamo
          </h2>
          <p className="text-xs text-slate-400">
            Presenta este código en el almacén para validar tu entrega o devolución.
          </p>
        </div>

        {/* Contenedor del QR */}
        <div className="my-5 flex flex-col items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 p-5">
          <div className="rounded-2xl bg-white p-3 shadow-inner">
            <QRCodeSVG 
              value={qrCodeValue} 
              size={180} 
              level="H" 
              includeMargin={true} 
            />
          </div>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">
            CÓDIGO: {qrCodeValue.substring(0, 8)}...
          </p>
        </div>

        {/* Detalles de los Activos Solicitados */}
        <div className="space-y-2 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="flex items-center gap-1.5 text-slate-400">
              {esPaqueteMultiple ? (
                <Layers className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Package className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {esPaqueteMultiple ? 'Paquete de Activos:' : 'Elemento:'}
            </span>
            <span className="font-semibold text-white">
              {esPaqueteMultiple ? `${listaElementos.length} items` : listaElementos[0]?.nombre || 'Activo SENA'}
            </span>
          </div>

          {/* Listado con scroll si son varios elementos */}
          <div className="max-h-24 overflow-y-auto space-y-1.5 py-1">
            {listaElementos.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-[11px]">
                <span className="truncate max-w-[170px] text-slate-300">
                  {item.nombre || 'Elemento'}
                </span>
                <code className="font-mono text-emerald-400">
                  {item.placa_sena || 'S/N'}
                </code>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-slate-400">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Fecha Inicio:
            </span>
            <span className="font-medium text-slate-200">
              {prestamo.fecha_inicio_programada 
                ? new Date(prestamo.fecha_inicio_programada).toLocaleDateString('es-CO')
                : 'Programada'}
            </span>
          </div>
        </div>

        {/* Botón Entendido */}
        <button
          onClick={onClose}
          className="mt-5 w-full rounded-2xl bg-slate-800 py-3 text-xs font-bold text-white transition-colors hover:bg-slate-700 active:scale-98"
        >
          Cerrar Tiquete
        </button>
      </div>
    </div>
  )
}