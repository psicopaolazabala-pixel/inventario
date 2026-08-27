import Link from 'next/link'
import { Package, ArrowRight, ShieldCheck, QrCode, Clock } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-slate-950 text-white">
      {/* Header */}
      <header className="container mx-auto flex max-w-7xl items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-bold text-white shadow-lg shadow-emerald-600/30">
            <Package className="h-6 w-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Presta<span className="text-emerald-500">SENA</span>
          </span>
        </div>
        {/* Cambiado href a /login */}
        <Link
          href="/login"
          className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:bg-emerald-500 active:scale-95"
        >
          Iniciar Sesión
        </Link>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto max-w-5xl px-6 py-12 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Gestión y Control de Préstamos SENA
        </span>

        <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">
          Control eficiente de equipos <br />
          <span className="text-emerald-500">en tiempo real</span>
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-400 sm:text-base">
          Solicita portátiles, herramientas y materiales con entrega mediante código QR y seguimiento de tiempos de devolución.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          {/* Cambiado href a /login */}
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
          >
            Ingresar al Sistema
            <ArrowRight className="h-4 w-4" />
          </Link>
          {/* Cambiado href a /login */}
          <Link
            href="/login"
            className="rounded-2xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800"
          >
            Consultar Préstamos
          </Link>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 text-left">
            <Package className="h-8 w-8 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold">Catálogo Digital</h3>
            <p className="mt-1 text-xs text-slate-400">Visualiza disponibilidad, fotos y especificaciones de cada activo.</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 text-left">
            <QrCode className="h-8 w-8 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold">Tiquetes con QR</h3>
            <p className="mt-1 text-xs text-slate-400">Entrega y devolución ágil con escaneo en la portería o almacén.</p>
          </div>
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-6 text-left">
            <Clock className="h-8 w-8 text-emerald-500" />
            <h3 className="mt-3 text-base font-bold">Alertas Automáticas</h3>
            <p className="mt-1 text-xs text-slate-400">Notificaciones automáticas ante el vencimiento de tus préstamos.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 p-6 text-center text-xs text-slate-500">
        PrestaSENA &copy; {new Date().getFullYear()} — Servicio Nacional de Aprendizaje
      </footer>
    </div>
  )
}