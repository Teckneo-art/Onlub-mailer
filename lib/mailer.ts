import nodemailer from 'nodemailer'

function getTransport(sender: 'A' | 'B') {
  const email = sender === 'A' ? process.env.SENDER_A_EMAIL : process.env.SENDER_B_EMAIL
  const pass = sender === 'A' ? process.env.SENDER_A_PASSWORD : process.env.SENDER_B_PASSWORD
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'ssl0.ovh.net',
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: true,
    auth: { user: email, pass },
  })
}

function getSenderInfo(sender: 'A' | 'B') {
  return {
    email: sender === 'A' ? process.env.SENDER_A_EMAIL! : process.env.SENDER_B_EMAIL!,
    name: sender === 'A' ? process.env.SENDER_A_NAME! : process.env.SENDER_B_NAME!,
  }
}

export interface SendMailOptions {
  to: string
  subject: string
  html: string
  sender: 'A' | 'B'
}

export async function sendMail(opts: SendMailOptions) {
  const transport = getTransport(opts.sender)
  const { email, name } = getSenderInfo(opts.sender)
  await transport.sendMail({
    from: `"${name}" <${email}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  })
}

export function personalizeBody(body: string, contact: Record<string, string>) {
  return body
    .replace(/\{\{nom\}\}/gi, contact.nom || '')
    .replace(/\{\{responsable\}\}/gi, contact.responsable || contact.nom || '')
    .replace(/\{\{ville\}\}/gi, contact.ville || '')
    .replace(/\{\{groupe\}\}/gi, contact.groupe || '')
    .replace(/\{\{marque\}\}/gi, contact.marque || '')
}
