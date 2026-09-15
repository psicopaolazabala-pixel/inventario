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
  elementos: { nombre: string; placa_sena: string; cantidad?: number }[]
  fecha: string
  motivo?: string
  fechaInicio?: string
  fechaFin?: string
  aprendizEmail?: string
  fechaDevolucionLimite?: string
}

// Obtener TODOS los correos de administradores (BD + .env.local)
export async function obtenerCorreosAdministradores(): Promise<string[]> {
  const listaDestinatarios: string[] = []

  // 1. Correos definidos en el archivo .env.local
  if (process.env.ADMIN_EMAILS) {
    const correosEnv = process.env.ADMIN_EMAILS.split(',').map((e) => e.trim())
    listaDestinatarios.push(...correosEnv)
  }

  // 2. Extraer los correos de TODOS los usuarios con rol ADMINISTRADOR en la BD
  try {
    const supabase = await createClient()
    const { data: adminsBD, error } = await supabase.rpc('obtener_correos_por_rol', {
      rol_buscado: 'ADMINISTRADOR',
    })

    if (!error && adminsBD && Array.isArray(adminsBD)) {
      const correosBD = adminsBD.map((a: any) => (typeof a === 'string' ? a : a.email)).filter(Boolean)
      listaDestinatarios.push(...correosBD)
    }
  } catch (err) {
    console.error('Error al consultar administradores en la BD:', err)
  }

  // Retornar lista sin duplicados
  return Array.from(new Set(listaDestinatarios)).filter(Boolean)
}

// 1. Notificación de NUEVA SOLICITUD (Cuando un aprendiz pide elementos)
export async function notificarNuevaSolicitud(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()
  if (adminEmails.length === 0) return

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>) ${el.cantidad ? `- Cant: ${el.cantidad}` : ''}</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #f59e0b; margin-bottom: 8px;">📋 Nueva Solicitud de Préstamo Pendiente</h2>
      <p style="color: #94a3b8; font-size: 14px;">Un aprendiz ha registrado un nuevo pedido que requiere revisión y aprobación.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #f59e0b; font-size: 14px;">Datos del Aprendiz:</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Nombre:</strong> ${data.nombreAprendiz}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Identificación / Ficha:</strong> ${data.documento}</p>
        ${data.motivo ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Motivo:</strong> ${data.motivo}</p>` : ''}
        ${data.fechaInicio && data.fechaFin ? `<p style="margin: 4px 0; font-size: 13px;"><strong>Horario Estimado:</strong> ${data.fechaInicio} — ${data.fechaFin}</p>` : ''}
      </div>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 14px;">Elementos Requeridos (${data.elementos.length}):</h3>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
          ${listaHtml}
        </ul>
      </div>
      
      <p style="font-size: 11px; color: #64748b;">Ingresa a la plataforma en "Aprobar Solicitudes" para aceptar o rechazar este pedido.</p>
    </div>
  `

  return transporter.sendMail({
    from: `"PrestaSENA Alertas" <${process.env.SMTP_USER}>`,
    to: adminEmails.join(','),
    subject: `📋 [NUEVA SOLICITUD] Pedido de ${data.elementos.length} activo(s) - ${data.nombreAprendiz}`,
    html,
  })
}

// 2. Notificación de ENTREGA / SALIDA
export async function notificarEntregaAlmacen(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()
  if (adminEmails.length === 0) return

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>)</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #10b981; margin-bottom: 8px;">🟢 Registro de Salida / Entrega de Elementos</h2>
      <p style="color: #94a3b8; font-size: 14px;">Se ha registrado la entrega física de activos en el almacén mediante código QR.</p>
      
      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #38bdf8; font-size: 14px;">Datos del Receptor:</h3>
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

// 3. Notificación de DEVOLUCIÓN / REINGRESO
export async function notificarDevolucionAlmacen(data: InfoNotificacion) {
  const adminEmails = await obtenerCorreosAdministradores()
  if (adminEmails.length === 0) return

  const listaHtml = data.elementos
    .map((el) => `<li><strong>${el.nombre}</strong> (Placa: <code>${el.placa_sena}</code>)</li>`)
    .join('')

  const html = `
    <div style="font-family: Arial, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px; border-radius: 16px;">
      <h2 style="color: #38bdf8; margin-bottom: 8px;">🔵 Registro de Reingreso / Devolución</h2>
      <p style="color: #94a3b8; font-size: 14px;">Los siguientes activos han sido devueltos satisfactoriamente al almacén.</p>
      
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

// 4. Notificación de RETRASO / MORA (Admins + Usuario responsable)
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
        <p style="margin: 4px 0; font-size: 13px;"><strong>Identificación:</strong> ${data.documento}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Fecha Límite Programada:</strong> ${data.fechaDevolucionLimite}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Estado:</strong> <span style="color: #f43f5e; font-weight: bold;">EN MORA</span></p>
      </div>

      <div style="background-color: #1e293b; padding: 16px; border-radius: 12px; margin: 16px 0;">
        <h3 style="margin-top: 0; color: #f43f5e; font-size: 14px;">Elementos Pendientes por Devolver (${data.elementos.length}):</h3>
        <ul style="padding-left: 20px; font-size: 13px; line-height: 1.6;">
          ${listaHtml}
        </ul>
      </div>

      <p style="font-size: 13px; color: #cbd5e1;">Por favor, realiza la devolución inmediata en el almacén para regularizar el estado del préstamo.</p>
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