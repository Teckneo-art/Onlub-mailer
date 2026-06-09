import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
}

function readFile<T>(filename: string, defaultValue: T): T {
  ensureDir()
  const fp = path.join(DATA_DIR, filename)
  if (!fs.existsSync(fp)) return defaultValue
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { return defaultValue }
}

function writeFile(filename: string, data: unknown) {
  ensureDir()
  fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2))
}

export interface Contact {
  id: string
  marque: string
  nom: string
  groupe: string
  adresse: string
  cp: string
  ville: string
  telephone: string
  email: string
  responsable: string
  autresMarques: string
  status: 'pending' | 'sent' | 'opened' | 'bounced' | 'replied' | 'recall'
  sender: 'A' | 'B' | null
  sentAt: string | null
  openedAt: string | null
  recallAt: string | null
  recallDone: boolean
  callNote: string
  campaignId: string | null
}

export interface Campaign {
  id: string
  name: string
  subject: string
  body: string
  status: 'draft' | 'active' | 'paused' | 'done'
  dailyLimit: number
  createdAt: string
  startedAt: string | null
  totalContacts: number
  sentCount: number
  openedCount: number
  bouncedCount: number
  recallCount: number
}

export interface SendLog {
  id: string
  campaignId: string
  contactId: string
  email: string
  sender: 'A' | 'B'
  status: 'sent' | 'bounced'
  sentAt: string
  error?: string
}

export const store = {
  getContacts: () => readFile<Contact[]>('contacts.json', []),
  saveContacts: (c: Contact[]) => writeFile('contacts.json', c),
  getCampaigns: () => readFile<Campaign[]>('campaigns.json', []),
  saveCampaigns: (c: Campaign[]) => writeFile('campaigns.json', c),
  getLogs: () => readFile<SendLog[]>('logs.json', []),
  saveLogs: (l: SendLog[]) => writeFile('logs.json', l),
}
