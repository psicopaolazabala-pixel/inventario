'use client'

import { useEffect, useState, useRef } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { procesarEscaneoQR } from '@/app/actions/almacen'
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Camera,
  Keyboard,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'

export default function EscanerQRPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [statusState, setStatusState] = useState<'BUSCANDO' | 'EXITO' | 'ERROR'>('BUSCANDO')
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [codigoManual, setCodigoManual] = useState('')
  const [bloqueoEscaneo, setBloqueoEscaneo] = useState(false)

  const isProcessingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return

    const elementId = 'reader'
    const readerElement = document.getElementById(elementId)
    if (!readerElement) return

    // Limpieza inicial
    readerElement.innerHTML = ''

    const qrScanner = new Html5Qrcode(elementId, {
      formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
      verbose: false,
    })
    html5QrCodeRef.current = qrScanner

    // Configuración con cálculo dinámico del área de escaneo
    const config = {
      fps: 15,
      qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight)
        const qrboxSize = Math.floor(minEdge * 0.75)
        return {
          width: qrboxSize,
          height: qrboxSize,
        }
      },
      aspectRatio: 1.0,
      experimentalFeatures: {
        useBarCodeDetectorIfSupported: true, // Aceleración nativa de lectura
      },
    }

    const onScanSuccess = async (decodedText: string) => {
      if (isProcessingRef.current) return
      isProcessingRef.current = true

      setLoading(true)
      setBloqueoEscaneo(true)
      setStatusState('BUSCANDO')
      setFeedbackMessage('Procesando código QR...')

      try {
        const response = await procesarEscaneoQR(decodedText)

        if (response.success) {
          setStatusState('EXITO')
          setFeedbackMessage(response.message || '¡Lectura exitosa!')
          timerRef.current = setTimeout(() => {
            reactivarEscaneo()
          }, 5000)
        } else {
          setStatusState('ERROR')
          setFeedbackMessage(response.message || 'No se pudo procesar el código.')
          timerRef.current = setTimeout(() => {
            reactivarEscaneo()
          }, 3500)
        }
      } catch (err: any) {
        setStatusState('ERROR')
        setFeedbackMessage(err.message || 'Error al conectar con el servidor.')
        timerRef.current = setTimeout(() => {
          reactivarEscaneo()
        }, 3500)
      } finally {
        setLoading(false)
      }
    }

    // Iniciar con cámara trasera preferida o fallback a la disponible
    qrScanner
      .start(
        { facingMode: 'environment' },
        config,
        onScanSuccess,
        () => {} // Ignorar frames sin código
      )
      .catch(() => {
        Html5Qrcode.getCameras()
          .then((cameras) => {
            if (cameras && cameras.length) {
              qrScanner
                .start(cameras[0].id, config, onScanSuccess, () => {})
                .catch(console.error)
            }
          })
          .catch(console.error)
      })

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (qrScanner && qrScanner.isScanning) {
        qrScanner
          .stop()
          .then(() => qrScanner.clear())
          .catch((err) => console.error('Error al apagar cámara:', err))
      }
    }
  }, [isMounted])

  const reactivarEscaneo = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    isProcessingRef.current = false
    setBloqueoEscaneo(false)
    setStatusState('BUSCANDO')
    setFeedbackMessage(null)
  }

  const handleCodigoManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigoManual.trim() || loading || isProcessingRef.current) return

    isProcessingRef.current = true
    setLoading(true)
    setStatusState('BUSCANDO')
    setFeedbackMessage(`Validando código: ${codigoManual.trim()}...`)

    try {
      const response = await procesarEscaneoQR(codigoManual.trim())

      if (response.success) {
        setStatusState('EXITO')
        setFeedbackMessage(response.message || '¡Código manual procesado!')
        setCodigoManual('')
      } else {
        setStatusState('ERROR')
        setFeedbackMessage(response.message || 'El código ingresado no es válido.')
      }
    } catch (err: any) {
      setStatusState('ERROR')
      setFeedbackMessage(err.message || 'Error al procesar el código manual.')
    } finally {
      setLoading(false)
      setTimeout(() => {
        isProcessingRef.current = false
      }, 3000)
    }
  }

  if (!isMounted) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <span className="ml-2 text-sm">Inicializando módulo de cámara...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-xl px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
          <QrCode className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Escáner QR de Almacén</h1>
          <p className="text-xs text-slate-400">
            Escanea el código del carnet o activo para registrar entradas y salidas.
          </p>
        </div>
      </div>

      {/* Indicador de Estado del Escáner */}
      <div className="mb-4">
        {loading && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Validando código en la base de datos...</span>
          </div>
        )}

        {!loading && statusState === 'EXITO' && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-semibold text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-300 pl-7">
              👉 Por favor retira el celular frente a la cámara.
            </p>
          </div>
        )}

        {!loading && statusState === 'ERROR' && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs font-semibold text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
        )}

        {!loading && statusState === 'BUSCANDO' && !feedbackMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5 text-xs text-slate-400">
            <Camera className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Cámara activa: Apunte el código QR al centro</span>
          </div>
        )}
      </div>

      {/* Visor de la Cámara */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md">
        {bloqueoEscaneo && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 p-6 text-center backdrop-blur-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 mb-3">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h3 className="text-base font-bold text-white">¡Lectura Completada!</h3>
            <p className="mt-1 text-xs text-slate-300 max-w-xs">
              Retira el teléfono de la cámara para evitar lecturas duplicadas.
            </p>

            <button
              onClick={reactivarEscaneo}
              className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 active:scale-95 transition-all"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Escanear Siguiente Código
            </button>
          </div>
        )}

        <div
          id="reader"
          className="w-full overflow-hidden rounded-2xl border border-slate-800 [&_video]:w-full [&_video]:rounded-2xl [&_video]:object-cover"
        ></div>
      </div>

      {/* Opción Alternativa: Código Manual */}
<div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 sm:p-6 shadow-xl backdrop-blur-md">
  <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
    <Keyboard className="h-4 w-4 text-emerald-500" />
    ¿No lee el código QR o etiqueta dañada?
  </div>
  <p className="mb-4 text-xs text-slate-400">
    Puedes ingresar manualmente la Placa SENA o Código ID:
  </p>

  <form onSubmit={handleCodigoManualSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
    <input
      type="text"
      placeholder="Ej: SENA-BIENESTAR-154"
      value={codigoManual}
      onChange={(e) => setCodigoManual(e.target.value)}
      disabled={loading}
      className="w-full flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-mono text-white outline-none focus:border-emerald-500 disabled:opacity-50"
    />
    <button
      type="submit"
      disabled={loading || !codigoManual.trim()}
      className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50 shrink-0"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          Validar
          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </button>
  </form>
</div>
    </div>
  )
}