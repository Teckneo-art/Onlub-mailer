import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { store, Contact } from '@/lib/store'
import { randomUUID } from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 })

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: '' })

    const existing = store.getContacts()
    const existingEmails = new Set(existing.map(c => c.email.toLowerCase()))

    const newContacts: Contact[] = []
    let skipped = 0

    for (const row of rows) {
      const email = (row['Email'] || row['email'] || '').trim()
      if (!email) { skipped++; continue }
      if (existingEmails.has(email.toLowerCase())) { skipped++; continue }

      newContacts.push({
        id: randomUUID(),
        marque: row['Marque'] || '',
        nom: row['Nom Concession'] || row['Nom'] || '',
        groupe: row['Groupe'] || '',
        adresse: row['Adresse'] || '',
        cp: row['CP'] || '',
        ville: row['Ville'] || '',
        telephone: row['Téléphone'] || row['Telephone'] || '',
        email,
        responsable: row['Responsable'] || '',
        autresMarques: row['Autres Marques VWG'] || '',
        status: 'pending',
        sender: null,
        sentAt: null,
        openedAt: null,
        recallAt: null,
        recallDone: false,
        callNote: '',
        campaignId: null,
      })
    }

    store.saveContacts([...existing, ...newContacts])
    return NextResponse.json({ imported: newContacts.length, skipped, total: existing.length + newContacts.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  const contacts = store.getContacts()
  return NextResponse.json(contacts)
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    const contacts = store.getContacts()
    const idx = contacts.findIndex(c => c.id === id)
    if (idx === -1) return NextResponse.json({ error: 'Contact introuvable' }, { status: 404 })
    contacts[idx] = { ...contacts[idx], ...updates }
    store.saveContacts(contacts)
    return NextResponse.json(contacts[idx])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json()
    const contacts = store.getContacts().filter(c => c.id !== id)
    store.saveContacts(contacts)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
