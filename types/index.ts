export type EstadoElemento = 'disponible' | 'prestado' | 'mantenimiento' | 'baja'
export type EstadoPrestamo = 'pendiente' | 'aprobado' | 'rechazado' | 'entregado' | 'devuelto' | 'vencido'

export interface Elemento {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string
  placa_sena: string
  imagen_url: string | null
  estado: EstadoElemento
  ubication: string | null
  created_at: string
}

export interface Perfil {
  id: string
  nombre?: string
  correo?: string
  rol?: 'aprendiz' | 'instructor' | 'almacenista' | 'admin'
  ficha?: string
}

export interface Prestamo {
  id: string
  elemento_id: string
  usuario_id: string
  almacenista_id?: string | null
  fecha_solicitud: string
  fecha_inicio_programada: string
  fecha_fin_programada: string
  fecha_entrega_real?: string | null
  fecha_devolucion_real?: string | null
  estado: EstadoPrestamo
  motivo?: string | null
  observaciones_entrega?: string | null
  observaciones_devolucion?: string | null
  created_at: string
  elementos?: Elemento
  perfiles?: Perfil
}