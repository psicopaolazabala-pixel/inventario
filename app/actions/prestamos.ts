'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { notificarNuevaSolicitud } from '@/lib/email'

interface CrearSolicitudParams {
  elementoId: string
  cantidad: number
  fechaInicio: string
  fechaFin: string
  motivo: string
}

interface ElementoCantidad {
  id: string
  cantidad: number
}

interface CrearSolicitudMultipleParams {
  elementos: ElementoCantidad[]
  fechaInicio: string
  fechaFin: string
  motivo: string
}

// 1. Solicitud Individual
export async function crearSolicitudPrestamo(data: CrearSolicitudParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No estás autenticado.' }
  }

  const grupoId = crypto.randomUUID()

  const { error } = await supabase.from('prestamos').insert({
    grupo_id: grupoId,
    usuario_id: user.id,
    elemento_id: data.elementoId,
    fecha_inicio_programada: data.fechaInicio,
    fecha_fin_programada: data.fechaFin,
    motivo: `[Cantidad: ${data.cantidad}] - ${data.motivo}`,
    estado: 'pendiente',
  })

  if (error) {
    return { success: false, message: `Error al crear la solicitud: ${error.message}` }
  }

  // Obtener datos del solicitante y del elemento para el correo a los admins
  try {
    const { data: elementoInfo } = await supabase
      .from('elementos')
      .select('nombre, placa_sena')
      .eq('id', data.elementoId)
      .single()

    const { data: perfilInfo } = await supabase
      .from('perfiles')
      .select('nombre_completo, documento_identidad, ficha_caracterizacion')
      .eq('id', user.id)
      .single()

    await notificarNuevaSolicitud({
      nombreAprendiz: perfilInfo?.nombre_completo || 'Usuario SENA',
      documento: perfilInfo?.ficha_caracterizacion
        ? `Ficha: ${perfilInfo.ficha_caracterizacion}`
        : perfilInfo?.documento_identidad || 'Sin documento',
      elementos: [
        {
          nombre: elementoInfo?.nombre || 'Elemento',
          placa_sena: elementoInfo?.placa_sena || 'S/N',
          cantidad: data.cantidad,
        },
      ],
      fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      motivo: data.motivo,
      fechaInicio: new Date(data.fechaInicio).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      fechaFin: new Date(data.fechaFin).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
    })
  } catch (emailError) {
    console.error('Error enviando correo de nueva solicitud individual:', emailError)
  }

  revalidatePath('/catalogo')
  revalidatePath('/mis-prestamos')
  revalidatePath('/solicitudes')

  return {
    success: true,
    message: '¡Solicitud de préstamo registrada con éxito!',
  }
}

// 2. Solicitud Múltiple
export async function crearSolicitudPrestamoMultiple(data: CrearSolicitudMultipleParams) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No estás autenticado.' }
  }

  if (!data.elementos || data.elementos.length === 0) {
    return { success: false, message: 'Debes seleccionar al menos un elemento.' }
  }

  const grupoId = crypto.randomUUID()

  const solicitudes = data.elementos.map((item) => ({
    grupo_id: grupoId,
    usuario_id: user.id,
    elemento_id: item.id,
    fecha_inicio_programada: data.fechaInicio,
    fecha_fin_programada: data.fechaFin,
    motivo: `[Cantidad: ${item.cantidad}] - ${data.motivo}`,
    estado: 'pendiente',
  }))

  const { error } = await supabase.from('prestamos').insert(solicitudes)

  if (error) {
    return { success: false, message: `Error al crear las solicitudes: ${error.message}` }
  }

  // Obtener datos consolidados para enviar 1 solo correo con todos los elementos
  try {
    const idsElementos = data.elementos.map((e) => e.id)
    const { data: elementosInfo } = await supabase
      .from('elementos')
      .select('id, nombre, placa_sena')
      .in('id', idsElementos)

    const { data: perfilInfo } = await supabase
      .from('perfiles')
      .select('nombre_completo, documento_identidad, ficha_caracterizacion')
      .eq('id', user.id)
      .single()

    const listaElementosMapeados = (elementosInfo || []).map((el) => {
      const match = data.elementos.find((item) => item.id === el.id)
      return {
        nombre: el.nombre,
        placa_sena: el.placa_sena,
        cantidad: match?.cantidad || 1,
      }
    })

    await notificarNuevaSolicitud({
      nombreAprendiz: perfilInfo?.nombre_completo || 'Usuario SENA',
      documento: perfilInfo?.ficha_caracterizacion
        ? `Ficha: ${perfilInfo.ficha_caracterizacion}`
        : perfilInfo?.documento_identidad || 'Sin documento',
      elementos: listaElementosMapeados,
      fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      motivo: data.motivo,
      fechaInicio: new Date(data.fechaInicio).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      fechaFin: new Date(data.fechaFin).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
    })
  } catch (emailError) {
    console.error('Error enviando correo de nueva solicitud múltiple:', emailError)
  }

  revalidatePath('/catalogo')
  revalidatePath('/mis-prestamos')
  revalidatePath('/solicitudes')

  return {
    success: true,
    message: `¡Solicitud registrada con éxito para ${data.elementos.length} elemento(s)!`,
  }
}