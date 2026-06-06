import { Resend } from 'resend'

// Cliente Resend (null si no hay API key configurada: el envío se omite sin romper).
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Remitente de las notificaciones. En pruebas, el dominio de Resend; en
// producción, un remitente de un dominio verificado (vía LEAD_FROM_EMAIL).
const FROM = process.env.LEAD_FROM_EMAIL ?? 'Hogar <onboarding@resend.dev>'

type LeadNotification = {
  to: string
  propertyTitle: string
  propertyCode: string
  name: string
  email: string
  phone: string | null
  message: string
}

// Envía al email de contacto del owner una notificación con los datos de la
// consulta. El `replyTo` apunta al interesado para responder directo.
export async function sendLeadNotification(lead: LeadNotification): Promise<void> {
  if (!resend) {
    console.warn('RESEND_API_KEY no configurada; se omite el email de la consulta.')
    return
  }

  const lines = [
    `Nueva consulta por: ${lead.propertyTitle} (${lead.propertyCode})`,
    '',
    `Nombre: ${lead.name}`,
    `Email: ${lead.email}`,
    ...(lead.phone ? [`Teléfono: ${lead.phone}`] : []),
    '',
    'Mensaje:',
    lead.message,
  ]

  await resend.emails.send({
    from: FROM,
    to: lead.to,
    replyTo: lead.email,
    subject: `Nueva consulta por ${lead.propertyTitle} (${lead.propertyCode})`,
    text: lines.join('\n'),
  })
}
