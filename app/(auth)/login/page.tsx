'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    const supabase = createClient()

    // Autenticación con Supabase Auth
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos. Verifica tus datos.'
          : error.message
      )
      setLoading(false)
      return
    }

    // Redirección al catálogo tras autenticarse con éxito
    router.push('/catalogo')
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-md">
        
        {/* Branding & Encabezado */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-600/30">
            <Package className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">
            Presta<span className="text-emerald-500">SENA</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Ingresa con tu correo institucional para gestionar préstamos de equipos
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Mail className="h-3.5 w-3.5 text-emerald-500" />
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              placeholder="aprendiz@soy.sena.edu.co"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              Contraseña
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50 shadow-lg shadow-emerald-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Iniciando Sesión...
              </>
            ) : (
              <>
                Ingresar a la Plataforma
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500">
          Servicio Nacional de Aprendizaje SENA &copy; {new Date().getFullYear()}
        </div>
      </div>
    </div>
  )
}