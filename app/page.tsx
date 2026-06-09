'use client'
import { useState, useEffect, useCallback } from 'react'
import { Upload, Play, Pause, Download, Mail, Users, PhoneCall, BarChart3, Settings, LogOut, Plus, Search, Eye, RefreshCw, FileSpreadsheet, Send, AlertCircle, CheckCircle, XCircle, Clock, ChevronRight, X } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Contact = {
  id: string; marque: string; nom: string; groupe: string; adresse: string
  cp: string; ville: string; telephone: string; email: string; responsable: string
  autresMarques: string; status: 'pending'|'sent'|'opened'|'bounced'|'replied'|'recall'
  sender: 'A'|'B'|null; sentAt: string|null; openedAt: string|null
  recallAt: string|null; recallDone: boolean; callNote: string; campaignId: string|null
}
type Campaign = {
  id: string; name: string; subject: string; body: string
  status: 'draft'|'active'|'paused'|'done'; dailyLimit: number
  createdAt: string; startedAt: string|null; totalContacts: number
  sentCount: number; openedCount: number; bouncedCount: number; recallCount: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusBadge(status: Contact['status']) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-zinc-800 text-zinc-400' },
    sent:    { label: 'Envoyé',     color: 'bg-blue-900/40 text-blue-400' },
    opened:  { label: 'Ouvert',     color: 'bg-emerald-900/40 text-emerald-400' },
    bounced: { label: 'Bounce',     color: 'bg-red-900/40 text-red-400' },
    replied: { label: 'Répondu',    color: 'bg-purple-900/40 text-purple-400' },
    recall:  { label: 'À rappeler', color: 'bg-amber-900/40 text-amber-400' },
  }
  const s = map[status] || map.pending
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
}

function campaignStatusBadge(status: Campaign['status']) {
  const map: Record<string, { label: string; color: string }> = {
    draft:  { label: 'Brouillon', color: 'bg-zinc-800 text-zinc-400' },
    active: { label: 'En cours',  color: 'bg-emerald-900/40 text-emerald-400' },
    paused: { label: 'En pause',  color: 'bg-amber-900/40 text-amber-400' },
    done:   { label: 'Terminée',  color: 'bg-blue-900/40 text-blue-400' },
  }
  const s = map[status] || map.draft
  return <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.label}</span>
}

// ─── Login ────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setLoading(true); setError('')
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pwd }) })
    if (r.ok) {
      const d = await r.json()
      localStorage.setItem('onlub_token', d.token)
      onLogin()
    } else { setError('Mot de passe incorrect') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#BA7517' }}>
              <Mail size={16} className="text-white" />
            </div>
            <span className="text-xl font-semibold tracking-widest text-white">ONLUB</span>
          </div>
          <div className="text-zinc-500 text-sm tracking-[0.2em] uppercase">Mailer</div>
        </div>
        <div className="rounded-2xl border border-zinc-800 p-8" style={{ background: '#141414' }}>
          <label className="block text-xs text-zinc-500 mb-2 tracking-wider uppercase">Mot de passe</label>
          <input
            type="password"
            value={pwd}
            onChange={e => setPwd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-amber-600 transition-colors"
            placeholder="••••••••"
          />
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full mt-4 py-3 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
            style={{ background: '#BA7517' }}
          >
            {loading ? 'Connexion...' : 'Accéder'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal nouvelle campagne ──────────────────────────────────────────────────
function NewCampaignModal({ onClose, onCreated }: { onClose: () => void; onCreated: (c: Campaign) => void }) {
  const [form, setForm] = useState({ name: '', subject: '', body: '', dailyLimit: 10 })
  const [loading, setLoading] = useState(false)

  async function handleCreate() {
    if (!form.name || !form.subject || !form.body) return
    setLoading(true)
    const r = await fetch('/api/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const c = await r.json()
    onCreated(c)
    setLoading(false)
  }

  const tags = ['{{responsable}}', '{{nom}}', '{{ville}}', '{{groupe}}', '{{marque}}']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="w-full max-w-2xl mx-4 rounded-2xl border border-zinc-800 p-6" style={{ background: '#141414' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-semibold">Nouvelle campagne</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Nom de la campagne</label>
              <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Garages VW – Juin 2025" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Mails / jour</label>
              <input type="number" min={1} max={50} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600" value={form.dailyLimit} onChange={e => setForm(f => ({ ...f, dailyLimit: parseInt(e.target.value) || 10 }))} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1.5 uppercase tracking-wider">Objet du mail</label>
            <input className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="ONLUB – Lubrifiants professionnels pour {{marque}}" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs text-zinc-500 uppercase tracking-wider">Corps du mail (HTML)</label>
              <div className="flex gap-1">
                {tags.map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, body: f.body + t }))} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400 hover:bg-zinc-700 font-mono">{t}</button>
                ))}
              </div>
            </div>
            <textarea rows={8} className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-600 font-mono resize-none" value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder="<p>Bonjour {{responsable}},</p>&#10;<p>Je me permets de vous contacter au nom d'ONLUB...</p>" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-zinc-400 border border-zinc-700 hover:bg-zinc-800 transition-colors">Annuler</button>
          <button onClick={handleCreate} disabled={loading || !form.name || !form.subject || !form.body} className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-40" style={{ background: '#BA7517' }}>
            {loading ? 'Création...' : 'Créer la campagne'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'dashboard'|'campaigns'|'contacts'|'recall'|'settings'>('dashboard')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{msg: string; type: 'ok'|'err'}|null>(null)
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [sending, setSending] = useState<string|null>(null)

  useEffect(() => {
    if (localStorage.getItem('onlub_token')) setAuthed(true)
  }, [])

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const loadData = useCallback(async () => {
    const [cr, mr] = await Promise.all([fetch('/api/contacts'), fetch('/api/campaigns')])
    setContacts(await cr.json())
    setCampaigns(await mr.json())
  }, [])

  useEffect(() => { if (authed) loadData() }, [authed, loadData])

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return
    setLoading(true)
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch('/api/contacts', { method: 'POST', body: fd })
    const d = await r.json()
    if (r.ok) { showToast(`✓ ${d.imported} contacts importés (${d.skipped} ignorés)`); loadData() }
    else showToast(d.error, 'err')
    setLoading(false)
    e.target.value = ''
  }

  async function toggleCampaign(campaign: Campaign) {
    const newStatus = campaign.status === 'active' ? 'paused' : (campaign.status === 'paused' ? 'active' : 'active')
    const r = await fetch('/api/campaigns', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: campaign.id, status: newStatus }) })
    if (r.ok) { loadData(); showToast(`Campagne ${newStatus === 'active' ? 'activée' : 'mise en pause'}`) }
  }

  async function sendBatch(campaignId: string) {
    setSending(campaignId)
    // D'abord vérifier les rappels J+4
    await fetch('/api/send')
    const r = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ campaignId }) })
    const d = await r.json()
    if (r.ok) showToast(`${d.sent} mail(s) envoyé(s)`)
    else showToast(d.error || 'Erreur envoi', 'err')
    loadData()
    setSending(null)
  }

  async function updateContact(id: string, updates: Partial<Contact>) {
    await fetch('/api/contacts', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, ...updates }) })
    loadData()
  }

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />

  // Stats globales
  const totalContacts = contacts.length
  const sent = contacts.filter(c => ['sent','opened','recall','replied'].includes(c.status)).length
  const opened = contacts.filter(c => c.status === 'opened').length
  const recalls = contacts.filter(c => c.status === 'recall').length
  const bounced = contacts.filter(c => c.status === 'bounced').length
  const pending = contacts.filter(c => c.status === 'pending').length

  const activeCampaign = campaigns.find(c => c.status === 'active')
  const progress = activeCampaign ? Math.round((activeCampaign.sentCount / (activeCampaign.totalContacts || 1)) * 100) : 0

  const filteredContacts = contacts.filter(c => {
    const q = search.toLowerCase()
    return !q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q) || c.groupe.toLowerCase().includes(q)
  })

  const recallContacts = contacts.filter(c => c.status === 'recall')

  const navItems: { id: typeof tab; icon: React.ElementType; label: string; badge?: number }[] = [
    { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
    { id: 'campaigns', icon: Mail, label: 'Campagnes' },
    { id: 'contacts', icon: Users, label: 'Contacts' },
    { id: 'recall', icon: PhoneCall, label: 'Relances', badge: recalls },
    { id: 'settings', icon: Settings, label: 'Paramètres' },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 shadow-2xl transition-all ${toast.type === 'ok' ? 'bg-emerald-900/90 text-emerald-300 border border-emerald-700' : 'bg-red-900/90 text-red-300 border border-red-700'}`}>
          {toast.type === 'ok' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
          {toast.msg}
        </div>
      )}

      {showNewCampaign && (
        <NewCampaignModal onClose={() => setShowNewCampaign(false)} onCreated={(c) => { setCampaigns(prev => [...prev, c]); setShowNewCampaign(false); showToast('Campagne créée'); setTab('campaigns') }} />
      )}

      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col border-r border-zinc-800/80" style={{ background: '#111111' }}>
        <div className="p-5 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#BA7517' }}>
              <Mail size={13} className="text-white" />
            </div>
            <div>
              <div className="text-white text-sm font-semibold tracking-widest">ONLUB</div>
              <div className="text-zinc-600 text-[10px] tracking-[0.15em] uppercase">Mailer</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative ${tab === item.id ? 'text-white font-medium' : 'text-zinc-500 hover:text-zinc-300'}`} style={tab === item.id ? { background: '#1e1e1e' } : {}}>
              <item.icon size={16} className={tab === item.id ? '' : 'opacity-70'} />
              {item.label}
              {item.badge && item.badge > 0 && (
                <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#BA7517', color: 'white' }}>{item.badge}</span>
              )}
              {tab === item.id && <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: '#BA7517' }} />}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800/80 space-y-2">
          <div className="px-3 py-2 rounded-xl" style={{ background: '#1a1a1a' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-400 truncate">mickael@onlub.com</span>
            </div>
          </div>
          <div className="px-3 py-2 rounded-xl" style={{ background: '#1a1a1a' }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-zinc-400 truncate">bori@onlub.com</span>
            </div>
          </div>
          <button onClick={() => { localStorage.removeItem('onlub_token'); setAuthed(false) }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 hover:text-zinc-400 transition-colors">
            <LogOut size={13} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        {/* ── Dashboard ── */}
        {tab === 'dashboard' && (
          <div className="p-8 max-w-5xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-white text-xl font-semibold">Dashboard</h1>
                <p className="text-zinc-500 text-sm mt-0.5">Vue d'ensemble de vos campagnes</p>
              </div>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-300 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <Upload size={15} /> Importer Excel
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} disabled={loading} />
                </label>
                <button onClick={() => setShowNewCampaign(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all" style={{ background: '#BA7517' }}>
                  <Plus size={15} /> Nouvelle campagne
                </button>
              </div>
            </div>

            {/* Métriques */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Total contacts', value: totalContacts, color: 'text-white', sub: 'dans la base' },
                { label: 'Envoyés', value: sent, color: 'text-blue-400', sub: `${totalContacts ? Math.round(sent/totalContacts*100) : 0}% du total` },
                { label: 'Ouverts', value: opened, color: 'text-emerald-400', sub: `${sent ? Math.round(opened/sent*100) : 0}% taux ouverture` },
                { label: 'À rappeler', value: recalls, color: 'text-amber-400', sub: 'J+4 atteint' },
                { label: 'Bounces', value: bounced, color: 'text-red-400', sub: 'adresses invalides' },
              ].map(m => (
                <div key={m.label} className="rounded-2xl p-4 border border-zinc-800/80" style={{ background: '#141414' }}>
                  <div className="text-xs text-zinc-600 uppercase tracking-wider mb-2">{m.label}</div>
                  <div className={`text-2xl font-semibold font-mono ${m.color}`}>{m.value}</div>
                  <div className="text-xs text-zinc-600 mt-1">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Campagne active */}
            {activeCampaign ? (
              <div className="rounded-2xl border border-zinc-800/80 p-6 mb-6" style={{ background: '#141414' }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-white font-medium">{activeCampaign.name}</h3>
                      {campaignStatusBadge(activeCampaign.status)}
                    </div>
                    <p className="text-zinc-500 text-sm">Objet : {activeCampaign.subject}</p>
                  </div>
                  <button onClick={() => sendBatch(activeCampaign.id)} disabled={!!sending} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-all" style={{ background: '#BA7517' }}>
                    {sending === activeCampaign.id ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    {sending === activeCampaign.id ? 'Envoi...' : `Envoyer (max ${activeCampaign.dailyLimit})`}
                  </button>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
                    <span>{activeCampaign.sentCount} envoyés</span>
                    <span>{progress}%</span>
                    <span>{activeCampaign.totalContacts} total</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: '#BA7517' }} />
                  </div>
                </div>
                <div className="flex gap-6 text-xs text-zinc-500 mt-3">
                  <span><span className="text-emerald-400 font-mono">{activeCampaign.openedCount}</span> ouverts</span>
                  <span><span className="text-red-400 font-mono">{activeCampaign.bouncedCount}</span> bounces</span>
                  <span><span className="text-amber-400 font-mono">{activeCampaign.recallCount}</span> à rappeler</span>
                  <span><span className="text-zinc-400 font-mono">{activeCampaign.dailyLimit}</span> mails/jour</span>
                  <span>Alternance auto A↔B</span>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-zinc-800 p-8 text-center mb-6">
                <Mail size={24} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Aucune campagne active</p>
                <button onClick={() => setShowNewCampaign(true)} className="mt-3 text-xs underline" style={{ color: '#BA7517' }}>Créer une campagne</button>
              </div>
            )}

            {/* Actions rapides */}
            {recalls > 0 && (
              <div className="rounded-2xl border border-amber-900/40 p-4 flex items-center justify-between" style={{ background: '#1a1400' }}>
                <div className="flex items-center gap-3">
                  <PhoneCall size={18} className="text-amber-500" />
                  <div>
                    <div className="text-amber-300 text-sm font-medium">{recalls} contact{recalls > 1 ? 's' : ''} à rappeler</div>
                    <div className="text-amber-700 text-xs">J+4 atteint — prêt pour les appels</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setTab('recall')} className="px-3 py-1.5 rounded-lg text-xs text-amber-400 border border-amber-800 hover:bg-amber-900/30 transition-colors">Voir la liste</button>
                  <a href="/api/export" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white border border-amber-700 hover:opacity-90 transition-all" style={{ background: '#BA7517' }}>
                    <Download size={12} /> Exporter Excel
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Campagnes ── */}
        {tab === 'campaigns' && (
          <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-white text-xl font-semibold">Campagnes</h1>
              <button onClick={() => setShowNewCampaign(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: '#BA7517' }}>
                <Plus size={15} /> Nouvelle campagne
              </button>
            </div>
            {campaigns.length === 0 ? (
              <div className="text-center py-20 text-zinc-600">Aucune campagne. Créez-en une pour commencer.</div>
            ) : (
              <div className="space-y-3">
                {campaigns.map(c => {
                  const prog = c.totalContacts ? Math.round(c.sentCount / c.totalContacts * 100) : 0
                  return (
                    <div key={c.id} className="rounded-2xl border border-zinc-800/80 p-5" style={{ background: '#141414' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-white font-medium truncate">{c.name}</span>
                            {campaignStatusBadge(c.status)}
                          </div>
                          <p className="text-zinc-500 text-sm truncate">Objet : {c.subject}</p>
                          <div className="flex gap-5 text-xs text-zinc-600 mt-2">
                            <span>{c.sentCount}/{c.totalContacts} envoyés</span>
                            <span className="text-emerald-500">{c.openedCount} ouverts</span>
                            <span className="text-red-500">{c.bouncedCount} bounces</span>
                            <span className="text-amber-500">{c.recallCount} rappels</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4 flex-shrink-0">
                          {(c.status === 'active' || c.status === 'paused' || c.status === 'draft') && (
                            <button onClick={() => toggleCampaign(c)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${c.status === 'active' ? 'border-amber-800 text-amber-400 hover:bg-amber-900/20' : 'border-emerald-800 text-emerald-400 hover:bg-emerald-900/20'}`}>
                              {c.status === 'active' ? <><Pause size={12} /> Pause</> : <><Play size={12} /> {c.status === 'draft' ? 'Démarrer' : 'Reprendre'}</>}
                            </button>
                          )}
                          {c.status === 'active' && (
                            <button onClick={() => sendBatch(c.id)} disabled={!!sending} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50" style={{ background: '#BA7517' }}>
                              {sending === c.id ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                              Envoyer
                            </button>
                          )}
                        </div>
                      </div>
                      {c.totalContacts > 0 && (
                        <div className="mt-4">
                          <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1e1e1e' }}>
                            <div className="h-full rounded-full" style={{ width: `${prog}%`, background: '#BA7517' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Contacts ── */}
        {tab === 'contacts' && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-xl font-semibold">Contacts</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{totalContacts} contacts — {pending} en attente</p>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input className="pl-9 pr-4 py-2 rounded-xl text-sm bg-zinc-900 border border-zinc-800 text-white focus:outline-none focus:border-amber-600 w-56" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-zinc-700 text-sm text-zinc-300 cursor-pointer hover:bg-zinc-800 transition-colors">
                  <Upload size={15} /> Importer
                  <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-800/80 overflow-hidden" style={{ background: '#141414' }}>
              <div className="grid text-xs text-zinc-500 uppercase tracking-wider px-5 py-3 border-b border-zinc-800" style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 80px 100px 60px' }}>
                <span>Nom concession</span><span>Groupe</span><span>Email</span><span>Ville</span><span>Statut</span><span>J+4</span>
              </div>
              <div className="divide-y divide-zinc-800/60 max-h-[60vh] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600 text-sm">
                    {contacts.length === 0 ? 'Importez un fichier Excel pour commencer' : 'Aucun résultat'}
                  </div>
                ) : filteredContacts.map(c => (
                  <div key={c.id} className="grid items-center px-5 py-3 hover:bg-zinc-800/30 transition-colors" style={{ gridTemplateColumns: '1fr 1.2fr 1.2fr 80px 100px 60px' }}>
                    <div>
                      <div className="text-sm text-white font-medium truncate">{c.nom}</div>
                      <div className="text-xs text-zinc-600">{c.marque}</div>
                    </div>
                    <div className="text-sm text-zinc-400 truncate">{c.groupe || '—'}</div>
                    <div className="text-sm text-zinc-400 truncate">{c.email || <span className="text-red-500/60 text-xs italic">manquant</span>}</div>
                    <div className="text-xs text-zinc-500">{c.ville}</div>
                    <div>{statusBadge(c.status)}</div>
                    <div className="text-center">
                      <div className={`w-2 h-2 rounded-full mx-auto ${c.recallAt ? 'bg-amber-500' : 'bg-zinc-700'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Relances ── */}
        {tab === 'recall' && (
          <div className="p-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-white text-xl font-semibold">Relances J+4</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{recalls} contact{recalls !== 1 ? 's' : ''} à appeler</p>
              </div>
              <a href="/api/export" className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-90" style={{ background: '#BA7517' }}>
                <Download size={15} /> Exporter Excel
              </a>
            </div>
            {recallContacts.length === 0 ? (
              <div className="text-center py-20">
                <PhoneCall size={28} className="text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">Aucun contact à rappeler pour le moment</p>
                <p className="text-zinc-700 text-xs mt-1">Les contacts apparaissent ici 4 jours après l'envoi</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recallContacts.map(c => (
                  <div key={c.id} className={`rounded-2xl border p-5 transition-all ${c.recallDone ? 'border-zinc-800/40 opacity-60' : 'border-amber-900/30'}`} style={{ background: '#141414' }}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-white font-medium">{c.nom}</span>
                          {c.openedAt && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-900/40 text-emerald-400">A ouvert le mail</span>}
                          {c.recallDone && <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">Appelé</span>}
                        </div>
                        <div className="flex gap-4 text-sm text-zinc-500">
                          {c.responsable && <span className="text-zinc-400">{c.responsable}</span>}
                          <span>{c.telephone}</span>
                          <span>{c.ville} ({c.cp})</span>
                        </div>
                        <div className="text-xs text-zinc-600 mt-1">
                          Mail envoyé le {c.sentAt ? new Date(c.sentAt).toLocaleDateString('fr-FR') : '—'} via {c.sender === 'A' ? 'mickael@onlub.com' : 'bori@onlub.com'}
                        </div>
                        <textarea
                          className="mt-3 w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-600 resize-none"
                          rows={2}
                          placeholder="Note post-appel..."
                          value={c.callNote}
                          onChange={e => updateContact(c.id, { callNote: e.target.value })}
                        />
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <a href={`tel:${c.telephone}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-amber-800 text-amber-400 hover:bg-amber-900/20 transition-colors">
                          <PhoneCall size={12} /> Appeler
                        </a>
                        <button onClick={() => updateContact(c.id, { recallDone: !c.recallDone })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors ${c.recallDone ? 'border-zinc-700 text-zinc-500' : 'border-emerald-800 text-emerald-400 hover:bg-emerald-900/20'}`}>
                          <CheckCircle size={12} /> {c.recallDone ? 'Annuler' : 'Marquer appelé'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Paramètres ── */}
        {tab === 'settings' && (
          <div className="p-8 max-w-xl">
            <h1 className="text-white text-xl font-semibold mb-8">Paramètres</h1>
            <div className="space-y-4">
              <div className="rounded-2xl border border-zinc-800/80 p-5" style={{ background: '#141414' }}>
                <h3 className="text-white text-sm font-medium mb-4">Configuration SMTP</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-zinc-500">Serveur</span><span className="text-zinc-300 font-mono text-xs">ssl0.ovh.net:465</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Chiffrement</span><span className="text-zinc-300">SSL/TLS</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Sender A</span><span className="text-zinc-300 text-xs">mickael@onlub.com</span></div>
                  <div className="flex justify-between"><span className="text-zinc-500">Sender B</span><span className="text-zinc-300 text-xs">bori@onlub.com</span></div>
                </div>
                <div className="mt-4 p-3 rounded-xl text-xs text-amber-700/80 border border-amber-900/30" style={{ background: '#1a1400' }}>
                  Pour modifier les credentials, éditez le fichier <code className="text-amber-500">.env.local</code> sur le serveur.
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 p-5" style={{ background: '#141414' }}>
                <h3 className="text-white text-sm font-medium mb-3">Variables de personnalisation</h3>
                <div className="space-y-1">
                  {[['{{responsable}}', 'Nom du contact'], ['{{nom}}', 'Nom de la concession'], ['{{ville}}', 'Ville'], ['{{groupe}}', 'Groupe automobile'], ['{{marque}}', 'Marque (VW, Audi…)']].map(([tag, desc]) => (
                    <div key={tag} className="flex items-center gap-3 text-sm">
                      <code className="text-amber-400 font-mono text-xs bg-zinc-900 px-2 py-0.5 rounded">{tag}</code>
                      <span className="text-zinc-500">{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-zinc-800/80 p-5" style={{ background: '#141414' }}>
                <h3 className="text-white text-sm font-medium mb-3">Données</h3>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div className="flex justify-between"><span>Contacts</span><span className="font-mono text-zinc-400">{totalContacts}</span></div>
                  <div className="flex justify-between"><span>Campagnes</span><span className="font-mono text-zinc-400">{campaigns.length}</span></div>
                  <div className="flex justify-between"><span>Stockage</span><span className="font-mono text-zinc-400">JSON local (data/)</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
