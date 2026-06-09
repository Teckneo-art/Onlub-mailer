import { NextRequest, NextResponse } from 'next/server'
import { store, SendLog } from '@/lib/store'
import { sendMail, personalizeBody } from '@/lib/mailer'
import { randomUUID } from 'crypto'

let senderToggle: 'A' | 'B' = 'A'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const campaignId: string = body.campaignId

    const campaigns = store.getCampaigns()
    const campaign = campaigns.find(c => c.id === campaignId)
    if (!campaign) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })
    if (campaign.status !== 'active') return NextResponse.json({ error: 'Campagne non active' }, { status: 400 })

    const contacts = store.getContacts()
    const toSend = contacts
      .filter(c => c.campaignId === campaignId && c.status === 'pending' && c.email)
      .slice(0, campaign.dailyLimit)

    if (toSend.length === 0) {
      // Vérifier si campagne terminée
      const remaining = contacts.filter(c => c.campaignId === campaignId && c.status === 'pending')
      if (remaining.length === 0) {
        campaign.status = 'done'
        store.saveCampaigns(campaigns)
      }
      return NextResponse.json({ sent: 0, message: 'Aucun contact à envoyer' })
    }

    const logs = store.getLogs()
    let sentCount = 0
    const results: { email: string; status: string }[] = []

    for (const contact of toSend) {
      const sender: 'A' | 'B' = senderToggle
      senderToggle = senderToggle === 'A' ? 'B' : 'A'

      const html = personalizeBody(campaign.body, {
        nom: contact.nom,
        responsable: contact.responsable,
        ville: contact.ville,
        groupe: contact.groupe,
        marque: contact.marque,
      })

      const log: SendLog = {
        id: randomUUID(),
        campaignId,
        contactId: contact.id,
        email: contact.email,
        sender,
        status: 'sent',
        sentAt: new Date().toISOString(),
      }

      try {
        await sendMail({ to: contact.email, subject: campaign.subject, html, sender })
        contact.status = 'sent'
        contact.sender = sender
        contact.sentAt = new Date().toISOString()
        // Programmer le rappel J+4
        const recallDate = new Date()
        recallDate.setDate(recallDate.getDate() + 4)
        contact.recallAt = recallDate.toISOString()
        log.status = 'sent'
        sentCount++
        results.push({ email: contact.email, status: 'sent' })
      } catch (err) {
        contact.status = 'bounced'
        log.status = 'bounced'
        log.error = String(err)
        results.push({ email: contact.email, status: 'bounced' })
      }

      logs.push(log)
    }

    store.saveContacts(contacts)
    store.saveLogs(logs)

    // Màj compteurs campagne
    const updatedContacts = store.getContacts()
    campaign.sentCount = updatedContacts.filter(c => c.campaignId === campaignId && (c.status === 'sent' || c.status === 'opened' || c.status === 'recall')).length
    campaign.bouncedCount = updatedContacts.filter(c => c.campaignId === campaignId && c.status === 'bounced').length
    campaign.openedCount = updatedContacts.filter(c => c.campaignId === campaignId && c.status === 'opened').length
    campaign.recallCount = updatedContacts.filter(c => c.campaignId === campaignId && c.status === 'recall').length
    store.saveCampaigns(campaigns)

    return NextResponse.json({ sent: sentCount, results })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// Déclencher les rappels J+4
export async function GET() {
  const contacts = store.getContacts()
  const now = new Date()
  let updated = 0

  contacts.forEach(c => {
    if (c.status === 'sent' && c.recallAt) {
      const recallDate = new Date(c.recallAt)
      if (now >= recallDate) {
        c.status = 'recall'
        updated++
      }
    }
  })

  if (updated > 0) store.saveContacts(contacts)
  return NextResponse.json({ recallsTriggered: updated })
}
