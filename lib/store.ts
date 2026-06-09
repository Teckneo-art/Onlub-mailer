import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null
function getSupabase() {
  if (!_supabase) _supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost', process.env.SUPABASE_SERVICE_KEY || 'dummy')
  return _supabase
}

export interface Contact {
  id: string
  marque: string; nom: string; groupe: string; adresse: string
  cp: string; ville: string; telephone: string; email: string
  responsable: string; autresMarques: string
  status: 'pending'|'sent'|'opened'|'bounced'|'replied'|'recall'
  sender: 'A'|'B'|null; sentAt: string|null; openedAt: string|null
  recallAt: string|null; recallDone: boolean; callNote: string; campaignId: string|null
}

export interface Campaign {
  id: string; name: string; subject: string; body: string
  status: 'draft'|'active'|'paused'|'done'; dailyLimit: number
  createdAt: string; startedAt: string|null; totalContacts: number
  sentCount: number; openedCount: number; bouncedCount: number; recallCount: number
}

export interface SendLog {
  id: string; campaignId: string; contactId: string
  email: string; sender: 'A'|'B'; status: 'sent'|'bounced'
  sentAt: string; error?: string
}

function toContact(r: Record<string, unknown>): Contact {
  return {
    id: r.id as string, marque: r.marque as string, nom: r.nom as string,
    groupe: r.groupe as string, adresse: r.adresse as string, cp: r.cp as string,
    ville: r.ville as string, telephone: r.telephone as string, email: r.email as string,
    responsable: r.responsable as string, autresMarques: r.autres_marques as string,
    status: r.status as Contact['status'], sender: r.sender as 'A'|'B'|null,
    sentAt: r.sent_at as string|null, openedAt: r.opened_at as string|null,
    recallAt: r.recall_at as string|null, recallDone: r.recall_done as boolean,
    callNote: r.call_note as string, campaignId: r.campaign_id as string|null,
  }
}

function toCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string, name: r.name as string, subject: r.subject as string,
    body: r.body as string, status: r.status as Campaign['status'],
    dailyLimit: r.daily_limit as number, createdAt: r.created_at as string,
    startedAt: r.started_at as string|null, totalContacts: r.total_contacts as number,
    sentCount: r.sent_count as number, openedCount: r.opened_count as number,
    bouncedCount: r.bounced_count as number, recallCount: r.recall_count as number,
  }
}

export const store = {
  async getContacts(): Promise<Contact[]> {
    const { data } = await getSupabase().from('contacts').select('*').order('nom')
    return (data || []).map(toContact)
  },
  async saveContact(c: Partial<Contact> & { id?: string }): Promise<void> {
    const row = {
      marque: c.marque, nom: c.nom, groupe: c.groupe, adresse: c.adresse,
      cp: c.cp, ville: c.ville, telephone: c.telephone, email: c.email,
      responsable: c.responsable, autres_marques: c.autresMarques,
      status: c.status, sender: c.sender, sent_at: c.sentAt,
      opened_at: c.openedAt, recall_at: c.recallAt, recall_done: c.recallDone,
      call_note: c.callNote, campaign_id: c.campaignId,
    }
    if (c.id) {
      await getSupabase().from('contacts').update(row).eq('id', c.id)
    } else {
      await getSupabase().from('contacts').insert({ id: c.id, ...row })
    }
  },
  async upsertContacts(contacts: Contact[]): Promise<void> {
    const rows = contacts.map(c => ({
      id: c.id, marque: c.marque, nom: c.nom, groupe: c.groupe,
      adresse: c.adresse, cp: c.cp, ville: c.ville, telephone: c.telephone,
      email: c.email, responsable: c.responsable, autres_marques: c.autresMarques,
      status: c.status, sender: c.sender, sent_at: c.sentAt,
      opened_at: c.openedAt, recall_at: c.recallAt, recall_done: c.recallDone,
      call_note: c.callNote, campaign_id: c.campaignId,
    }))
    await getSupabase().from('contacts').upsert(rows)
  },
  async updateContact(id: string, updates: Partial<Contact>): Promise<void> {
    const row: Record<string, unknown> = {}
    if (updates.status !== undefined) row.status = updates.status
    if (updates.sender !== undefined) row.sender = updates.sender
    if (updates.sentAt !== undefined) row.sent_at = updates.sentAt
    if (updates.openedAt !== undefined) row.opened_at = updates.openedAt
    if (updates.recallAt !== undefined) row.recall_at = updates.recallAt
    if (updates.recallDone !== undefined) row.recall_done = updates.recallDone
    if (updates.callNote !== undefined) row.call_note = updates.callNote
    if (updates.campaignId !== undefined) row.campaign_id = updates.campaignId
    await getSupabase().from('contacts').update(row).eq('id', id)
  },
  async deleteContact(id: string): Promise<void> {
    await getSupabase().from('contacts').delete().eq('id', id)
  },
  async getCampaigns(): Promise<Campaign[]> {
    const { data } = await getSupabase().from('campaigns').select('*').order('created_at', { ascending: false })
    return (data || []).map(toCampaign)
  },
  async createCampaign(c: Omit<Campaign, 'id'>): Promise<Campaign> {
    const { data } = await getSupabase().from('campaigns').insert({
      name: c.name, subject: c.subject, body: c.body, status: c.status,
      daily_limit: c.dailyLimit, total_contacts: c.totalContacts,
      sent_count: c.sentCount, opened_count: c.openedCount,
      bounced_count: c.bouncedCount, recall_count: c.recallCount,
    }).select().single()
    return toCampaign(data)
  },
  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const row: Record<string, unknown> = {}
    if (updates.status !== undefined) row.status = updates.status
    if (updates.startedAt !== undefined) row.started_at = updates.startedAt
    if (updates.totalContacts !== undefined) row.total_contacts = updates.totalContacts
    if (updates.sentCount !== undefined) row.sent_count = updates.sentCount
    if (updates.openedCount !== undefined) row.opened_count = updates.openedCount
    if (updates.bouncedCount !== undefined) row.bounced_count = updates.bouncedCount
    if (updates.recallCount !== undefined) row.recall_count = updates.recallCount
    const { data } = await getSupabase().from('campaigns').update(row).eq('id', id).select().single()
    return toCampaign(data)
  },
  async addLog(log: Omit<SendLog, 'id'>): Promise<void> {
    await getSupabase().from('send_logs').insert({
      campaign_id: log.campaignId, contact_id: log.contactId,
      email: log.email, sender: log.sender, status: log.status,
      sent_at: log.sentAt, error: log.error,
    })
  },
}
