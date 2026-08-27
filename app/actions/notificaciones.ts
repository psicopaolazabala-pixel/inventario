'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Marcar una notificación individual como leída
export async function marcarNotificacionLeida(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true })
    .eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/notificaciones')
  return { success: true }
}

// Marcar todas las notificaciones del usuario como leídas
export async function marcarTodasLeidas() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Usuario no autenticado' }

  const { error } = await supabase
    .from('notificaciones')
    .update({ leido: true })
    .eq('usuario_id', user.id)
    .eq('leido', false)

  if (error) return { success: false, message: error.message }

  revalidatePath('/notificaciones')
  return { success: true }
}