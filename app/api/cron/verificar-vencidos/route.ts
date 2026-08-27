import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { notificarRetrasoPrestamo } from '@/lib/email'

export const dynamic = 'force-dynamic'

interface PrestamoVencidoRow {
  id: string
  grupo_id?: string
  usuario_id: string
  fecha_fin_programada: string
  elementos: {
    nombre: string
    placa_sena: string
  }
  perfiles: {
    nombre_completo: string
    documento_identidad: string
    ficha_caracterizacion: string
  }
}

interface GrupoVencido {
  grupoId: string
  responsableNombre: string
  documento: string
  fechaLimite: string
  elementos: {
    nombre: string
    placa_sena: string
  }[]
}

export async function GET() {
  try {
    const supabase = await createClient()
    const ahora = new Date().toISOString()

    // 1. Consultar todos los préstamos vencidos que siguen en 'entregado'
    const { data: prestamosMora, error: errorPrestamos } = await supabase
      .from('prestamos')
      .select(`
        id,
        grupo_id,
        usuario_id,
        fecha_fin_programada,
        elementos (
          nombre,
          placa_sena
        ),
        perfiles:usuario_id (
          nombre_completo,
          documento_identidad,
          ficha_caracterizacion
        )
      `)
      .eq('estado', 'entregado')
      .lt('fecha_fin_programada', ahora)

    if (errorPrestamos) {
      return NextResponse.json(
        { success: false, error: errorPrestamos.message },
        { status: 500 }
      )
    }

    if (!prestamosMora || prestamosMora.length === 0) {
      return NextResponse.json({
        success: true,
        mensaje: 'No hay préstamos en mora en este momento.',
        totalGruposNotificados: 0,
      })
    }

    // 2. Agrupar los préstamos por su grupo_id (o por su ID individual)
    const mapaGrupos = new Map<string, GrupoVencido>()

    for (const item of prestamosMora as any[]) {
      const gId = item.grupo_id || item.id

      if (!mapaGrupos.has(gId)) {
        const perfil = item.perfiles
        const documento = perfil?.ficha_caracterizacion
          ? `Ficha: ${perfil.ficha_caracterizacion}`
          : perfil?.documento_identidad || 'Sin documento'

        mapaGrupos.set(gId, {
          grupoId: gId,
          responsableNombre: perfil?.nombre_completo || 'Usuario SENA',
          documento,
          fechaLimite: item.fecha_fin_programada,
          elementos: [],
        })
      }

      const grupo = mapaGrupos.get(gId)!
      if (item.elementos) {
        grupo.elementos.push({
          nombre: item.elementos.nombre || 'Elemento sin nombre',
          placa_sena: item.elementos.placa_sena || 'S/N',
        })
      }
    }

    const gruposConsolidados = Array.from(mapaGrupos.values())
    const notificacionesEnviadas = []

    // 3. Enviar un solo correo por cada grupo/solicitud
    for (const grupo of gruposConsolidados) {
      const envio = await notificarRetrasoPrestamo({
        nombreAprendiz: grupo.responsableNombre,
        documento: grupo.documento,
        fecha: new Date().toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
        elementos: grupo.elementos,
        fechaDevolucionLimite: new Date(grupo.fechaLimite).toLocaleString('es-CO', {
          dateStyle: 'short',
          timeStyle: 'short',
        }),
      })

      notificacionesEnviadas.push({
        grupoId: grupo.grupoId,
        responsable: grupo.responsableNombre,
        totalElementos: grupo.elementos.length,
        elementos: grupo.elementos.map((e) => `${e.nombre} (${e.placa_sena})`),
        fechaLimite: grupo.fechaLimite,
        messageId: envio?.messageId,
      })
    }

    return NextResponse.json({
      success: true,
      mensaje: `Se enviaron ${gruposConsolidados.length} correo(s) consolidado(s) para un total de ${prestamosMora.length} activo(s) en mora.`,
      gruposNotificados: notificacionesEnviadas,
    })
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    )
  }
}