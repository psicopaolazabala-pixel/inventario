'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  revalidatePath('/catalogo')
  revalidatePath('/mis-prestamos')

  return {
    success: true,
    message: '¡Solicitud de préstamo registrada con éxito!',
  }
}

// 2. Solicitud Múltiple (Genera 1 solo grupo_id para todos los elementos seleccionados)
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

  revalidatePath('/catalogo')
  revalidatePath('/mis-prestamos')

  return {
    success: true,
    message: `¡Solicitud registrada con éxito para ${data.elementos.length} elemento(s)!`,
  }
}