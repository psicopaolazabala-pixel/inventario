import nodemailer from 'nodemailer'
import { createClient } from '@/lib/supabase/server'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

interface InfoNotificacion {
  nombreAprendiz: string
  documento: string
  elementos: { nombre: string; placa_sena: string }[]
  fecha: string
  aprendizEmail?: string
  fechaDevolucionLimite?: string
}

// ID del administrador autorizado para pruebas
const ID_ADMIN_AUTORIZADO = 'b07dbc97-4a56-4615-97a6-f78a8183441b'

// Obtener correos de administradores (Filtro selectivo + .env.local)
export async function obtenerCorreosAdministradores(): Promise<string[]> {
  const listaDestinatarios: string[] = []

  // 1. Correos definidos en el archivo .env.local
  if (process.env.ADMIN_EMAILS) {
    const correosEnv = process.env.ADMIN_EMAILS.split(',').map((e) => e.trim())
    listaDestinatarios.push(...correosEnv)
  }

  // 2. Extraer el correo de la BD únicamente del ID especificado
  try {
    const supabase = await createClient()
    const { data: adminsBD, error } = await supabase.rpc('obtener_correos_por_rol', {
      rol_buscado: 'ADMINISTRADOR',
    })

    if (!error && adminsBD) {
      // Cruzamos con el ID específico
      const { data: perfilAutorizado } = await supabase
        .from('perfiles')
        .select('id')
        .eq('id', ID_ADMIN_AUTORIZADO)
        .single()

      if (perfilAutorizado) {
        // Obtenemos los correos devueltos por la RPC
        const correosBD = adminsBD.map((a: any) => a.email).filter(Boolean)
        // Tomamos el correo correspondiente (o el devuelto por la función)
        listaDestinatarios.push(...correosBD)
      }
    }
  } catch (err) {
    console.error('Error al consultar administrador autorizado:', err)
  }

  // Retornar lista única sin duplicados
  return Array.from(new Set(listaDestinatarios)).filter(Boolean)
}

// 1. Notificación de ENTREGA / SALIDA
export async function notificarEntregaAlmacen(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()
  if (adminEmails.length === 0) return

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>)</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #10b981; margin-bottom: 8px;">🟢 Registro de Salida / Entrega de Elementos</h2>
      <p style="color: #94a3b8; font-size: 14px;">Se ha registrado la entrega de activos en el almacén.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 14px;">Datos del Solicitante:</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${data.nombreAprendiz}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Identificación / Ficha:</strong> ${data.documento}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha y Hora:</strong> ${data.fecha}</p>
      </div>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #10b981; font-size: 14px;">Elementos Entregados (${data.elementos.length}):</h3>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
          ${listaHtml}
        </ul>
      </div>
      
      <p style="font-size: 11px; color: #64748b;">Notificación automática enviada por el Sistema PrestaSENA.</p>
    </div>
  `

  return transporter.sendMail({
    from: `"PrestaSENA Almacén" <${process.env.SMTP_USER}>`,
    to: adminEmails.join(','),
    subject: `🟢 [SALIDA] Entrega de ${data.elementos.length} activo(s) a ${data.nombreAprendiz}`,
    html,
  })
}

// 2. Notificación de DEVOLUCIÓN / REINGRESO
export async function notificarDevolucionAlmacen(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()
  if (adminEmails.length === 0) return

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>)</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #38bdf8; margin-bottom: 8px;">🔵 Registro de Reingreso / Devolución</h2>
      <p style="color: #94a3b8; font-size: 14px;">Los siguientes activos han reingresado satisfactoriamente al inventario.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 14px;">Entregado por:</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${data.nombreAprendiz}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Identificación:</strong> ${data.documento}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha de Retorno:</strong> ${data.fecha}</p>
      </div>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 14px;">Elementos Reingresados (${data.elementos.length}):</h3>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
          ${listaHtml}
        </ul>
      </div>
      
      <p style="font-size: 11px; color: #64748b;">Notificación automática enviada por el Sistema PrestaSENA.</p>
    </div>
  `

  return transporter.sendMail({
    from: `"PrestaSENA Almacén" <${process.env.SMTP_USER}>`,
    to: adminEmails.join(','),
    subject: `🔵 [DEVOLUCIÓN] Reingreso de ${data.elementos.length} activo(s) de ${data.nombreAprendiz}`,
    html,
  })
}

// 3. Notificación de RETRASO / MORA (Admins autorizados + Usuario responsable)
export async function notificarRetrasoPrestamo(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()

  const destinatariosSet = new Set(adminEmails)
  if (data.aprendizEmail) {
    destinatariosSet.add(data.aprendizEmail)
  }

  const destinatarios = Array.from(destinatariosSet).join(',')

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>)</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #f43f5e; margin-bottom: 8px;">⚠️ Alerta de Devolución Vencida / Retraso</h2>
      <p style="color: #94a3b8; font-size: 14px;">Se ha superado la fecha límite programada para la devolución de los siguientes elementos.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0; border-left: 4px solid #f43f5e;">
        <p style="margin: 4px 0; font-size: 13px;"><strong>Usuario Responsable:</strong> ${data.nombreAprendiz}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha Límite Programada:</strong> ${data.fechaDevolucionLimite}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Estado:</strong> <span style="color: #f43f5e; font-weight: bold;">EN MORA</span></p>
      </div>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #f43f5e; font-size: 14px;">Elementos Pendientes por Devolver:</h3>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
          ${listaHtml}
        </ul>
      </div>

      <p style="font-size: 13px; color: #cbd5e1;">Por favor, realiza la devolución inmediata en el almacén para evitar bloqueos en el sistema.</p>
      <p style="font-size: 11px; color: #64748b;">PrestaSENA - Gestión de Almacén</p>
    </div>
  `

  return transporter.sendMail({
    from: `"PrestaSENA Alertas" <${process.env.SMTP_USER}>`,
    to: destinatarios,
    subject: `⚠️ [RETRASO] Préstamo vencido pendiente de devolución - ${data.nombreAprendiz}`,
    html,
  })
}