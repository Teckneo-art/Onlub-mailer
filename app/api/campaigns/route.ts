import { NextRequest, NextResponse } from 'next/server'
import { store, Campaign } from '@/lib/store'
import { randomUUID } from 'crypto'

export async function GET() {
  return NextResponse.json(store.getCampaigns())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const campaign: Campaign = {
      id: randomUUID(),
      name: body.name,
      subject: body.subject,
      body: body.body,
      status: 'draft',
      dailyLimit: body.dailyLimit || 10,
      createdAt: new Date().toISOString(),
      startedAt: null,
      totalContacts: 0,
      sentCount: 0,
      openedCount: 0,
      bouncedCount: 0,
      recallCount: 0,
    }
    const campaigns = store.getCampaigns()
    campaigns.push(campaign)
    store.saveCampaigns(campaigns)
    return NextResponse.json(campaign)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    const campaigns = store.getCampaigns()
    const idx = campaigns.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 })

    if (updates.status === 'active' && campaigns[idx].status === 'draft') {
      updates.startedAt = new Date().toISOString()
      // Assigner les contacts pending à cette campagne
      const contacts = store.getContacts()
      const pending = contacts.filter(c => c.status === 'pending' && !c.campaignId)
      pending.forEach(c => { c.campaignId = id })
      store.saveContacts(contacts)
      updates.totalContacts = pending.length
    }

    campaigns[idx] = { ...campaigns[idx], ...updates }
    store.saveCampaigns(campaigns)
    return NextResponse.json(campaigns[idx])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
