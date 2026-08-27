import { NextResponse } from 'next/server'
import { notificarEntregaAlmacen, obtenerCorreosAdministradores } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const destinatarios = await obtenerCorreosAdministradores()

    const res = await notificarEntregaAlmacen({
      nombreAprendiz: 'Aprendiz de Control',
      documento: 'Ficha: 3411832',
      fecha: new Date().toLocaleString('es-CO', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }),
      elementos: [
        { nombre: 'Cámara Fotográfica Sony', placa_sena: 'SENA-COM-012' },
        { nombre: 'Trípode Profesional', placa_sena: 'SENA-COM-013' },
      ],
      aprendizEmail: 'aprendiz@sena.edu.co',
    })

    return NextResponse.json({
      success: true,
      mensaje: '¡Correo enviado a los administradores autorizados!',
      destinatarios,
      messageId: res?.messageId,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}