'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface CrearElementoParams {
  nombre: string
  descripcion: string
  categoria: string
  placaSena: string
  ubicacion: string
  imagenUrl?: string
}

export interface ActualizarElementoParams extends CrearElementoParams {
  id: string
  estado?: string
}

export async function crearElemento(data: CrearElementoParams) {
  const supabase = await createClient()

  // 1. Validar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No estás autenticado.' }
  }

  // 2. Verificar que no exista otra placa/serie igual
  const { data: existente } = await supabase
    .from('elementos')
    .select('id')
    .eq('placa_sena', data.placaSena)
    .single()

  if (existente) {
    return { success: false, message: 'Ya existe un elemento registrado con esta Placa SENA / Serial.' }
  }

  // 3. Insertar el nuevo activo en la base de datos
  const { error } = await supabase.from('elementos').insert({
    nombre: data.nombre,
    descripcion: data.descripcion,
    categoria: data.categoria,
    placa_sena: data.placaSena,
    ubication: data.ubicacion,
    imagen_url: data.imagenUrl || null,
    estado: 'disponible',
  })

  if (error) {
    return { success: false, message: `Error al guardar el activo: ${error.message}` }
  }

  revalidatePath('/catalogo')
  revalidatePath('/inventario')
  
  return { success: true, message: 'Elemento registrado correctamente en el inventario.' }
}

export async function actualizarElemento(data: ActualizarElementoParams) {
  const supabase = await createClient()

  // 1. Validar autenticación
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, message: 'No estás autenticado.' }
  }

  // 2. Actualizar el registro en Supabase
  const { error } = await supabase
    .from('elementos')
    .update({
      nombre: data.nombre,
      descripcion: data.descripcion,
      categoria: data.categoria,
      placa_sena: data.placaSena,
      ubication: data.ubicacion,
      imagen_url: data.imagenUrl || null,
      estado: data.estado || 'disponible',
    })
    .eq('id', data.id)

  if (error) {
    return { success: false, message: `Error al actualizar: ${error.message}` }
  }

  revalidatePath('/catalogo')
  revalidatePath('/inventario')

  return { success: true, message: 'Elemento actualizado correctamente.' }
}