'use client'
import { useState, useEffect, useCallback } from 'react'

type Status = 'pending'|'sent'|'opened'|'bounced'|'replied'|'recall'
type CampaignStatus = 'draft'|'active'|'paused'|'done'

type Contact = {
  id: string; marque: string; nom: string; groupe: string; adresse: string
  cp: string; ville: string; telephone: string; email: string; responsable: string
  autresMarques: string; status: Status; sender: 'A'|'B'|null
  sentAt: string|null; openedAt: string|null; recallAt: string|null
  recallDone: boolean; callNote: string; campaignId: string|null
}
type Campaign = {
  id: string; name: string; subject: string; body: string
  status: CampaignStatus; dailyLimit: number; createdAt: string
  startedAt: string|null; totalContacts: number; sentCount: number
  openedCount: number; bouncedCount: number; recallCount: number
}

const AMBER = '#BA7517'

const icons = {
  mail: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>,
  chart: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1 19.79 19.79 0 0 1 1.61 4.5 2 2 0 0 1 3.6 2.32h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.07 6.07l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>,
  settings: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 0-14.14 0M4.93 19.07a10 10 0 0 0 14.14 0M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>,
  upload: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  send: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  download: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  search: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  play: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  pause: <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
  x: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  logout: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  spin: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>,
}

function statusBadge(s: Status) {
  const map: Record<Status, [string,string]> = {
    pending: ['badge badge-pending','En attente'],
    sent: ['badge badge-sent','Envoyé'],
    opened: ['badge badge-opened','Ouvert'],
    bounced: ['badge badge-bounced','Bounce'],
    replied: ['badge badge-replied','Répondu'],
    recall: ['badge badge-recall','À rappeler'],
  }
  const [cls, label] = map[s] || map.pending
  return <span className={cls}>{label}</span>
}

function campaignBadge(s: CampaignStatus) {
  const map: Record<CampaignStatus, [string,string]> = {
    draft: ['badge badge-draft','Brouillon'],
    active: ['badge badge-active','En cours'],
    paused: ['badge badge-paused','En pause'],
    done: ['badge badge-done','Terminée'],
  }
  const [cls, label] = map[s] || map.draft
  return <span className={cls}>{label}</span>
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  async function handle() {
    setLoading(true); setError('')
    const r = await fetch('/api/auth', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({password: pwd}) })
    if (r.ok) { const d = await r.json(); localStorage.setItem('onlub_token', d.token); onLogin() }
    else setError('Mot de passe incorrect')
    setLoading(false)
  }
  return (
    <div className="login-wrap">
      <div className="login-box">
        <div style={{textAlign:'center', marginBottom:32}}>
          <div style={{display:'inline-flex', alignItems:'center', gap:10, marginBottom:6}}>
            <div className="logo-icon">{icons.mail}</div>
            <span style={{fontSize:18, fontWeight:700, letterSpacing:'0.12em', color:'#fff'}}>ONLUB</span>
          </div>
          <div style={{fontSize:11, color:'#555', letterSpacing:'0.2em', textTransform:'uppercase'}}>Mailer</div>
        </div>
        <div className="login-card">
          <label className="form-label">Mot de passe</label>
          <input type="password" className="form-input" value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handle()} placeholder="••••••••" style={{marginBottom:error?8:16}} />
          {error && <div style={{color:'#f87171', fontSize:12, marginBottom:12}}>{error}</div>}
          <button onClick={handle} disabled={loading} className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'10px 16px'}}>
            {loading ? <>{icons.spin} Connexion...</> : 'Accéder'}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewCampaignModal({ onClose, onCreated }: { onClose: ()=>void; onCreated: (c: Campaign)=>void }) {
  const [form, setForm] = useState({ name:'', subject:'', body:'', dailyLimit:10 })
  const [loading, setLoading] = useState(false)
  async function handle() {
    if (!form.name || !form.subject || !form.body) return
    setLoading(true)
    const r = await fetch('/api/campaigns', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
    onCreated(await r.json()); setLoading(false)
  }
  const tags = ['{{responsable}}','{{nom}}','{{ville}}','{{groupe}}','{{marque}}']
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24}}>
          <span style={{fontSize:16, fontWeight:600, color:'#fff'}}>Nouvelle campagne</span>
          <button onClick={onClose} style={{background:'none', border:'none', color:'#555', cursor:'pointer'}}>{icons.x}</button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
          <div>
            <label className="form-label">Nom de la campagne</label>
            <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Garages VW – Juin 2025" />
          </div>
          <div>
            <label className="form-label">Mails / jour</label>
            <input type="number" className="form-input" min={1} max={50} value={form.dailyLimit} onChange={e=>setForm(f=>({...f,dailyLimit:parseInt(e.target.value)||10}))} />
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label className="form-label">Objet du mail</label>
          <input className="form-input" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} placeholder="ONLUB – Lubrifiants pour {{marque}}" />
        </div>
        <div style={{marginBottom:24}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
            <label className="form-label" style={{margin:0}}>Corps du mail (HTML)</label>
            <div style={{display:'flex', gap:4}}>
              {tags.map(t=><button key={t} onClick={()=>setForm(f=>({...f,body:f.body+t}))} style={{fontSize:10, padding:'2px 6px', background:'#1a1a1a', color:AMBER, border:'none', borderRadius:6, cursor:'pointer', fontFamily:'monospace'}}>{t}</button>)}
            </div>
          </div>
          <textarea className="form-textarea" rows={8} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} placeholder={'<p>Bonjour {{responsable}},</p>\n<p>Je me permets de vous contacter...'} />
        </div>
        <div style={{display:'flex', gap:12}}>
          <button onClick={onClose} className="btn" style={{flex:1, justifyContent:'center'}}>Annuler</button>
          <button onClick={handle} disabled={loading||!form.name||!form.subject||!form.body} className="btn btn-primary" style={{flex:1, justifyContent:'center'}}>
            {loading ? <>{icons.spin} Création...</> : 'Créer la campagne'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'dashboard'|'campaigns'|'contacts'|'recall'|'settings'>('dashboard')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [showNew, setShowNew] = useState(false)
  const [sending, setSending] = useState<string|null>(null)

  useEffect(() => { if (typeof window !== 'undefined' && localStorage.getItem('onlub_token')) setAuthed(true) }, [])

  const showToast = (msg: string, type: 'ok'|'err' = 'ok') => { setToast({msg,type}); setTimeout(()=>setToast(null),3500) }

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
    const r = await fetch('/api/contacts', { method:'POST', body:fd })
    const d = await r.json()
    r.ok ? showToast(`✓ ${d.imported} contacts importés (${d.skipped} ignorés)`) : showToast(d.error, 'err')
    loadData(); setLoading(false); e.target.value = ''
  }

  async function toggleCampaign(c: Campaign) {
    const ns = c.status === 'active' ? 'paused' : 'active'
    await fetch('/api/campaigns', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id:c.id, status:ns}) })
    loadData(); showToast(`Campagne ${ns==='active'?'activée':'mise en pause'}`)
  }

  async function sendBatch(campaignId: string) {
    setSending(campaignId)
    await fetch('/api/send')
    const r = await fetch('/api/send', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({campaignId}) })
    const d = await r.json()
    r.ok ? showToast(`${d.sent} mail(s) envoyé(s)`) : showToast(d.error||'Erreur', 'err')
    loadData(); setSending(null)
  }

  async function updateContact(id: string, updates: Partial<Contact>) {
    await fetch('/api/contacts', { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({id,...updates}) })
    loadData()
  }

  if (!authed) return <LoginScreen onLogin={()=>setAuthed(true)} />

  const totalContacts = contacts.length
  const sent = contacts.filter(c=>['sent','opened','recall','replied'].includes(c.status)).length
  const opened = contacts.filter(c=>c.status==='opened').length
  const recalls = contacts.filter(c=>c.status==='recall').length
  const bounced = contacts.filter(c=>c.status==='bounced').length
  const pending = contacts.filter(c=>c.status==='pending').length
  const activeCampaign = campaigns.find(c=>c.status==='active')
  const progress = activeCampaign ? Math.round((activeCampaign.sentCount/(activeCampaign.totalContacts||1))*100) : 0
  const filtered = contacts.filter(c => { const q=search.toLowerCase(); return !q||c.nom.toLowerCase().includes(q)||c.email.toLowerCase().includes(q)||c.ville.toLowerCase().includes(q)||c.groupe.toLowerCase().includes(q) })
  const recallList = contacts.filter(c=>c.status==='recall')

  const navItems = [
    {id:'dashboard',icon:icons.chart,label:'Dashboard'},
    {id:'campaigns',icon:icons.mail,label:'Campagnes'},
    {id:'contacts',icon:icons.users,label:'Contacts'},
    {id:'recall',icon:icons.phone,label:'Relances',badge:recalls},
    {id:'settings',icon:icons.settings,label:'Paramètres'},
  ] as const

  return (
    <div className="app">
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {toast && <div className={`toast ${toast.type==='ok'?'toast-ok':'toast-err'}`}>{toast.type==='ok'?icons.check:icons.alert} {toast.msg}</div>}
      {showNew && <NewCampaignModal onClose={()=>setShowNew(false)} onCreated={c=>{setCampaigns(p=>[...p,c]);setShowNew(false);showToast('Campagne créée');setTab('campaigns')}} />}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon" style={{color:'#fff'}}>{icons.mail}</div>
          <div><div className="logo-text">ONLUB</div><div className="logo-sub">Mailer</div></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)} className={`nav-item${tab===item.id?' active':''}`}>
              {item.icon} {item.label}
              {'badge' in item && (item.badge as number) > 0 && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sender-chip"><div className="sender-dot"/><span className="sender-email">mickael@onlub.com</span></div>
          <div className="sender-chip"><div className="sender-dot"/><span className="sender-email">bori@onlub.com</span></div>
          <button className="logout-btn" onClick={()=>{localStorage.removeItem('onlub_token');setAuthed(false)}}>{icons.logout} Déconnexion</button>
        </div>
      </aside>

      {/* Main */}
      <main className="main">

        {/* ── Dashboard ── */}
        {tab==='dashboard' && (
          <div style={{maxWidth:1000}}>
            <div className="page-header">
              <div><div className="page-title">Dashboard</div><div className="page-sub">Vue d'ensemble de vos campagnes</div></div>
              <div style={{display:'flex', gap:10}}>
                <label className="btn" style={{cursor:'pointer'}}>
                  {loading ? icons.spin : icons.upload} Importer Excel
                  <input type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={handleImport} disabled={loading} />
                </label>
                <button className="btn btn-primary" onClick={()=>setShowNew(true)}>{icons.plus} Nouvelle campagne</button>
              </div>
            </div>

            <div className="stats-grid">
              {[
                {label:'Total contacts', value:totalContacts, color:'#e8e8e8', sub:'dans la base'},
                {label:'Envoyés', value:sent, color:'#60a5fa', sub:`${totalContacts?Math.round(sent/totalContacts*100):0}% du total`},
                {label:'Ouverts', value:opened, color:'#4ade80', sub:`${sent?Math.round(opened/sent*100):0}% taux ouverture`},
                {label:'À rappeler', value:recalls, color:'#fbbf24', sub:'J+4 atteint'},
                {label:'Bounces', value:bounced, color:'#f87171', sub:'adresses invalides'},
              ].map(m=>(
                <div className="stat-card" key={m.label}>
                  <div className="stat-label">{m.label}</div>
                  <div className="stat-value" style={{color:m.color}}>{m.value}</div>
                  <div className="stat-sub">{m.sub}</div>
                </div>
              ))}
            </div>

            {activeCampaign ? (
              <div className="gauge-card" style={{marginBottom:16}}>
                <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16}}>
                  <div>
                    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
                      <span style={{fontWeight:600, color:'#fff'}}>{activeCampaign.name}</span>
                      {campaignBadge(activeCampaign.status)}
                    </div>
                    <div style={{fontSize:13, color:'#555'}}>Objet : {activeCampaign.subject}</div>
                  </div>
                  <button onClick={()=>sendBatch(activeCampaign.id)} disabled={!!sending} className="btn btn-primary">
                    {sending===activeCampaign.id ? <>{icons.spin} Envoi...</> : <>{icons.send} Envoyer ({activeCampaign.dailyLimit} max)</>}
                  </button>
                </div>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, color:'#555', marginBottom:6}}>
                  <span>{activeCampaign.sentCount} envoyés</span><span style={{color:AMBER, fontWeight:600}}>{progress}%</span><span>{activeCampaign.totalContacts} total</span>
                </div>
                <div className="progress-wrap" style={{marginBottom:12}}>
                  <div className="progress-fill" style={{width:`${progress}%`}} />
                </div>
                <div style={{display:'flex', gap:20, fontSize:12, color:'#555'}}>
                  <span><span style={{color:'#4ade80'}}>{activeCampaign.openedCount}</span> ouverts</span>
                  <span><span style={{color:'#f87171'}}>{activeCampaign.bouncedCount}</span> bounces</span>
                  <span><span style={{color:'#fbbf24'}}>{activeCampaign.recallCount}</span> rappels</span>
                  <span>Alternance auto A↔B</span>
                </div>
              </div>
            ) : (
              <div className="card" style={{padding:40, textAlign:'center', marginBottom:16}}>
                <div style={{color:'#333', marginBottom:8}}>{icons.mail}</div>
                <div style={{color:'#555', fontSize:13}}>Aucune campagne active</div>
                <button onClick={()=>setShowNew(true)} style={{marginTop:8, background:'none', border:'none', color:AMBER, fontSize:12, cursor:'pointer', textDecoration:'underline'}}>Créer une campagne</button>
              </div>
            )}

            {recalls > 0 && (
              <div className="alert-amber">
                <div style={{display:'flex', alignItems:'center', gap:12}}>
                  <span style={{color:'#fbbf24'}}>{icons.phone}</span>
                  <div>
                    <div style={{color:'#fbbf24', fontWeight:500, fontSize:13}}>{recalls} contact{recalls>1?'s':''} à rappeler</div>
                    <div style={{color:'#78350f', fontSize:12}}>J+4 atteint — prêt pour les appels</div>
                  </div>
                </div>
                <div style={{display:'flex', gap:8}}>
                  <button onClick={()=>setTab('recall')} className="btn btn-amber">Voir la liste</button>
                  <a href="/api/export" className="btn btn-primary" style={{textDecoration:'none'}}>{icons.download} Exporter</a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Campagnes ── */}
        {tab==='campaigns' && (
          <div style={{maxWidth:800}}>
            <div className="page-header">
              <div className="page-title">Campagnes</div>
              <button className="btn btn-primary" onClick={()=>setShowNew(true)}>{icons.plus} Nouvelle campagne</button>
            </div>
            {campaigns.length===0 ? (
              <div className="empty"><div className="empty-icon">{icons.mail}</div>Aucune campagne. Créez-en une pour commencer.</div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {campaigns.map(c=>{
                  const prog = c.totalContacts ? Math.round(c.sentCount/c.totalContacts*100) : 0
                  return (
                    <div className="card" style={{padding:20}} key={c.id}>
                      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4}}>
                            <span style={{fontWeight:600, color:'#fff'}}>{c.name}</span>
                            {campaignBadge(c.status)}
                          </div>
                          <div style={{fontSize:13, color:'#555', marginBottom:8}}>Objet : {c.subject}</div>
                          <div style={{display:'flex', gap:16, fontSize:12, color:'#555'}}>
                            <span>{c.sentCount}/{c.totalContacts} envoyés</span>
                            <span style={{color:'#4ade80'}}>{c.openedCount} ouverts</span>
                            <span style={{color:'#f87171'}}>{c.bouncedCount} bounces</span>
                            <span style={{color:'#fbbf24'}}>{c.recallCount} rappels</span>
                          </div>
                        </div>
                        <div style={{display:'flex', gap:8, marginLeft:16, flexShrink:0}}>
                          {['draft','active','paused'].includes(c.status) && (
                            <button onClick={()=>toggleCampaign(c)} className={`btn ${c.status==='active'?'btn-amber':'btn-green'}`}>
                              {c.status==='active'?<>{icons.pause} Pause</>:<>{icons.play} {c.status==='draft'?'Démarrer':'Reprendre'}</>}
                            </button>
                          )}
                          {c.status==='active' && (
                            <button onClick={()=>sendBatch(c.id)} disabled={!!sending} className="btn btn-primary">
                              {sending===c.id?<>{icons.spin} Envoi...</>:<>{icons.send} Envoyer</>}
                            </button>
                          )}
                        </div>
                      </div>
                      {c.totalContacts>0 && <div className="progress-wrap" style={{marginTop:14}}><div className="progress-fill" style={{width:`${prog}%`}}/></div>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Contacts ── */}
        {tab==='contacts' && (
          <div>
            <div className="page-header">
              <div><div className="page-title">Contacts</div><div className="page-sub">{totalContacts} contacts — {pending} en attente</div></div>
              <div style={{display:'flex', gap:10}}>
                <div className="search-wrap"><span className="search-icon">{icons.search}</span><input className="search-input" placeholder="Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
                <label className="btn" style={{cursor:'pointer'}}>{icons.upload} Importer<input type="file" accept=".xlsx,.xls" style={{display:'none'}} onChange={handleImport} /></label>
              </div>
            </div>
            <div className="card" style={{overflow:'hidden'}}>
              <div className="table-header" style={{gridTemplateColumns:'1.2fr 1fr 1.4fr 80px 110px 50px'}}>
                <span>Nom concession</span><span>Groupe</span><span>Email</span><span>Ville</span><span>Statut</span><span>J+4</span>
              </div>
              <div className="table-scroll">
                {filtered.length===0 ? (
                  <div className="empty">{contacts.length===0?'Importez un fichier Excel pour commencer':'Aucun résultat'}</div>
                ) : filtered.map(c=>(
                  <div className="table-row" style={{gridTemplateColumns:'1.2fr 1fr 1.4fr 80px 110px 50px'}} key={c.id}>
                    <div>
                      <div style={{fontWeight:500, color:'#e8e8e8', fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.nom}</div>
                      <div style={{fontSize:11, color:'#555'}}>{c.marque}</div>
                    </div>
                    <div style={{fontSize:13, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.groupe||'—'}</div>
                    <div style={{fontSize:12, color:'#888', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{c.email||<span style={{color:'#f87171', fontStyle:'italic', fontSize:11}}>manquant</span>}</div>
                    <div style={{fontSize:12, color:'#555'}}>{c.ville}</div>
                    <div>{statusBadge(c.status)}</div>
                    <div style={{textAlign:'center'}}><div style={{width:7, height:7, borderRadius:'50%', background:c.recallAt?AMBER:'#222', margin:'0 auto'}}/></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Relances ── */}
        {tab==='recall' && (
          <div style={{maxWidth:800}}>
            <div className="page-header">
              <div><div className="page-title">Relances J+4</div><div className="page-sub">{recalls} contact{recalls!==1?'s':''} à appeler</div></div>
              <a href="/api/export" className="btn btn-primary" style={{textDecoration:'none'}}>{icons.download} Exporter Excel</a>
            </div>
            {recallList.length===0 ? (
              <div className="empty"><div className="empty-icon">{icons.phone}</div><div style={{marginBottom:4}}>Aucun contact à rappeler pour le moment</div><div style={{fontSize:12}}>Les contacts apparaissent ici 4 jours après l'envoi</div></div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:10}}>
                {recallList.map(c=>(
                  <div className={`recall-card${c.recallDone?' done':''}`} key={c.id}>
                    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between'}}>
                      <div style={{flex:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                          <span style={{fontWeight:600, color:'#fff'}}>{c.nom}</span>
                          {c.openedAt && <span style={{fontSize:10, padding:'2px 8px', borderRadius:20, background:'#0a1f12', color:'#4ade80'}}>A ouvert le mail</span>}
                          {c.recallDone && <span style={{fontSize:10, padding:'2px 8px', borderRadius:20, background:'#1a1a1a', color:'#555'}}>Appelé</span>}
                        </div>
                        <div style={{display:'flex', gap:16, fontSize:13, color:'#888', marginBottom:4}}>
                          {c.responsable && <span style={{color:'#aaa'}}>{c.responsable}</span>}
                          <span>{c.telephone}</span>
                          <span>{c.ville} ({c.cp})</span>
                        </div>
                        <div style={{fontSize:12, color:'#555', marginBottom:10}}>
                          Mail envoyé le {c.sentAt?new Date(c.sentAt).toLocaleDateString('fr-FR'):'—'} via {c.sender==='A'?'mickael@onlub.com':'bori@onlub.com'}
                        </div>
                        <textarea className="form-textarea" rows={2} placeholder="Note post-appel..." value={c.callNote} onChange={e=>updateContact(c.id,{callNote:e.target.value})} style={{fontSize:12}} />
                      </div>
                      <div style={{marginLeft:16, display:'flex', flexDirection:'column', gap:8, flexShrink:0}}>
                        <a href={`tel:${c.telephone}`} className="btn btn-amber" style={{textDecoration:'none'}}>{icons.phone} Appeler</a>
                        <button onClick={()=>updateContact(c.id,{recallDone:!c.recallDone})} className={`btn ${c.recallDone?'':'btn-green'}`}>
                          {icons.check} {c.recallDone?'Annuler':'Marquer appelé'}
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
        {tab==='settings' && (
          <div style={{maxWidth:520}}>
            <div className="page-header"><div className="page-title">Paramètres</div></div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card" style={{padding:20}}>
                <div style={{fontWeight:600, color:'#fff', marginBottom:16, fontSize:14}}>Configuration SMTP</div>
                {[['Serveur','ssl0.ovh.net:465'],['Chiffrement','SSL/TLS'],['Sender A','mickael@onlub.com'],['Sender B','bori@onlub.com']].map(([k,v])=>(
                  <div className="settings-row" key={k}><span className="settings-key">{k}</span><span className="settings-val">{v}</span></div>
                ))}
                <div style={{marginTop:12, padding:12, background:'#1a1000', border:'1px solid #78350f', borderRadius:10, fontSize:12, color:'#78350f'}}>
                  Pour modifier les credentials, éditez les variables d'environnement sur Vercel.
                </div>
              </div>
              <div className="card" style={{padding:20}}>
                <div style={{fontWeight:600, color:'#fff', marginBottom:14, fontSize:14}}>Variables de personnalisation</div>
                {[['{{responsable}}','Nom du contact'],['{{nom}}','Nom de la concession'],['{{ville}}','Ville'],['{{groupe}}','Groupe automobile'],['{{marque}}','Marque (VW, Audi…)']].map(([tag,desc])=>(
                  <div className="settings-row" key={tag}><span className="code-tag">{tag}</span><span className="settings-key">{desc}</span></div>
                ))}
              </div>
              <div className="card" style={{padding:20}}>
                <div style={{fontWeight:600, color:'#fff', marginBottom:14, fontSize:14}}>Données</div>
                {[['Contacts',totalContacts],['Campagnes',campaigns.length],['Stockage','Supabase PostgreSQL']].map(([k,v])=>(
                  <div className="settings-row" key={String(k)}><span className="settings-key">{k}</span><span className="settings-val">{v}</span></div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
