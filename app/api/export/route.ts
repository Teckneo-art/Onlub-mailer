import { NextResponse } from 'next/server'
import { store } from '@/lib/store'
import * as XLSX from 'xlsx'

export async function GET() {
  const contacts = store.getContacts()
  const recalls = contacts.filter(c => c.status === 'recall')

  const rows = recalls.map(c => ({
    'Nom Concession': c.nom,
    'Groupe': c.groupe,
    'Responsable': c.responsable || 'N/A',
    'Téléphone': c.telephone,
    'Email': c.email,
    'Ville': c.ville,
    'Code Postal': c.cp,
    'Marque': c.marque,
    'Autres Marques': c.autresMarques,
    'Mail envoyé le': c.sentAt ? new Date(c.sentAt).toLocaleDateString('fr-FR') : '',
    'Expéditeur': c.sender === 'A' ? process.env.SENDER_A_EMAIL : process.env.SENDER_B_EMAIL,
    'Mail ouvert': c.openedAt ? 'Oui' : 'Non',
    'Rappel prévu le': c.recallAt ? new Date(c.recallAt).toLocaleDateString('fr-FR') : '',
    'Appel effectué': c.recallDone ? 'Oui' : 'Non',
    'Note appel': c.callNote || '',
    'Priorité': c.openedAt ? '🔥 A ouvrit le mail' : 'Standard',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Largeurs colonnes
  ws['!cols'] = [
    { wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 16 },
    { wch: 28 }, { wch: 18 }, { wch: 8 }, { wch: 14 },
    { wch: 20 }, { wch: 16 }, { wch: 28 }, { wch: 12 },
    { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 22 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Relances J+4')
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="relances_${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
