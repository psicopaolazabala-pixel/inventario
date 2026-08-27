'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notificarEntregaAlmacen, notificarDevolucionAlmacen } from '@/lib/email'

// 1. Cambiar estado por Grupo o por ID individual
export async function cambiarEstadoSolicitud(
  identificador: string,
  nuevoEstado: 'aprobado' | 'rechazado'
) {
  const supabase = await createClient()

  const { data: prestamosPorGrupo } = await supabase
    .from('prestamos')
    .select('id')
    .eq('grupo_id', identificador)

  let error

  if (prestamosPorGrupo && prestamosPorGrupo.length > 0) {
    const res = await supabase
      .from('prestamos')
      .update({ estado: nuevoEstado })
      .eq('grupo_id', identificador)
    error = res.error
  } else {
    const res = await supabase
      .from('prestamos')
      .update({ estado: nuevoEstado })
      .eq('id', identificador)
    error = res.error
  }

  if (error) {
    return { success: false, message: error.message }
  }

  revalidatePath('/solicitudes')
  revalidatePath('/aprobar-solicitudes')
  revalidatePath('/mis-prestamos')

  return { success: true, message: `Solicitud(es) marcada(s) como ${nuevoEstado}.` }
}

// 2. Procesar Escaneo QR
export async function procesarEscaneoQR(codigoQR: string) {
  const supabase = await createClient()

  // A. Buscar por grupo_id (sin solicitar columnas inexistentes en perfiles)
  let { data: prestamosGrupo } = await supabase
    .from('prestamos')
    .select(`
      *,
      elementos(id, nombre, placa_sena),
      perfiles:usuario_id(id, nombre_completo, documento_identidad, ficha_caracterizacion)
    `)
    .eq('grupo_id', codigoQR)

  // B. Si no es grupo, buscar por ID individual
  if (!prestamosGrupo || prestamosGrupo.length === 0) {
    const { data: prestamoInd } = await supabase
      .from('prestamos')
      .select(`
        *,
        elementos(id, nombre, placa_sena),
        perfiles:usuario_id(id, nombre_completo, documento_identidad, ficha_caracterizacion)
      `)
      .eq('id', codigoQR)
      .single()

    if (prestamoInd) prestamosGrupo = [prestamoInd]
  }

  // C. Si no, buscar por Placa SENA
  if (!prestamosGrupo || prestamosGrupo.length === 0) {
    const { data: elemento } = await supabase
      .from('elementos')
      .select('id')
      .eq('placa_sena', codigoQR)
      .single()

    if (elemento) {
      const { data: prestamosElemento } = await supabase
        .from('prestamos')
        .select(`
          *,
          elementos(id, nombre, placa_sena),
          perfiles:usuario_id(id, nombre_completo, documento_identidad, ficha_caracterizacion)
        `)
        .eq('elemento_id', elemento.id)
        .or('estado.eq.aprobado,estado.eq.entregado')
        .order('created_at', { ascending: false })
        .limit(1)

      if (prestamosElemento && prestamosElemento.length > 0) {
        prestamosGrupo = prestamosElemento
      }
    }
  }

  if (!prestamosGrupo || prestamosGrupo.length === 0) {
    return {
      success: false,
      message: `No se encontró ningún préstamo activo para el código: ${codigoQR}`,
    }
  }

  const primerPrestamo = prestamosGrupo[0]
  const estadoActual = primerPrestamo.estado.toLowerCase()
  const totalItems = prestamosGrupo.length
  const nombresItems = prestamosGrupo.map((p: any) => p.elementos?.nombre).filter(Boolean).join(', ')
  const idsParaActualizar = prestamosGrupo.map((p: any) => p.id)

  const infoUsuario = {
    nombreAprendiz: primerPrestamo.perfiles?.nombre_completo || 'Aprendiz SENA',
    documento: primerPrestamo.perfiles?.ficha_caracterizacion
      ? `Ficha: ${primerPrestamo.perfiles.ficha_caracterizacion}`
      : primerPrestamo.perfiles?.documento_identidad || 'Sin documento',
    elementos: prestamosGrupo.map((p: any) => ({
      nombre: p.elementos?.nombre || 'Elemento',
      placa_sena: p.elementos?.placa_sena || 'S/N',
    })),
    fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
  }

  if (estadoActual === 'pendiente') {
    return {
      success: false,
      message: `La solicitud de (${totalItems}) elemento(s) está 'pendiente'. Debe ser aprobada primero en el panel.`,
    }
  }

  // 1. PRIMER ESCANEO: Si está APROBADO -> ENTREGAR
  if (estadoActual === 'aprobado') {
    const ahora = new Date().toISOString()
    const { error: updateError } = await supabase
      .from('prestamos')
      .update({
        estado: 'entregado',
        fecha_entrega_real: ahora,
      })
      .in('id', idsParaActualizar)

    if (updateError) {
      return { success: false, message: `Error al entregar: ${updateError.message}` }
    }

    // Enviar correo a los administradores autorizados en segundo plano
    notificarEntregaAlmacen(infoUsuario).catch((err) =>
      console.error('Error al enviar correo de entrega:', err)
    )

    revalidatePath('/escaner')
    revalidatePath('/mis-prestamos')
    revalidatePath('/solicitudes')

    return {
      success: true,
      message: `🟢 ¡ENTREGA REGISTRADA! Se entregaron ${totalItems} elemento(s): ${nombresItems}.`,
    }
  }

  // 2. SEGUNDO ESCANEO: Si está ENTREGADO -> DEVOLVER (con blindaje de 30s)
  if (estadoActual === 'entregado') {
    if (primerPrestamo.fecha_entrega_real) {
      const segundosDesdeEntrega =
        (new Date().getTime() - new Date(primerPrestamo.fecha_entrega_real).getTime()) / 1000

      if (segundosDesdeEntrega < 30) {
        return {
          success: false,
          message: `⚠️ ¡ENTREGA YA REALIZADA! Retira el celular de la cámara. La devolución no se puede hacer antes de 30 segundos.`,
        }
      }
    }

    const { error: updateError } = await supabase
      .from('prestamos')
      .update({
        estado: 'devuelto',
        fecha_devolucion_real: new Date().toISOString(),
      })
      .in('id', idsParaActualizar)

    if (updateError) {
      return { success: false, message: `Error al devolver: ${updateError.message}` }
    }

    // Enviar correo a los administradores autorizados en segundo plano
    notificarDevolucionAlmacen(infoUsuario).catch((err) =>
      console.error('Error al enviar correo de devolución:', err)
    )

    revalidatePath('/escaner')
    revalidatePath('/mis-prestamos')
    revalidatePath('/solicitudes')

    return {
      success: true,
      message: `🔵 ¡DEVOLUCIÓN REGISTRADA! Se reingresaron ${totalItems} elemento(s) al almacén: ${nombresItems}.`,
    }
  }

  return {
    success: false,
    message: `La solicitud ya se encuentra en estado ${estadoActual.toUpperCase()}.`,
  }
}