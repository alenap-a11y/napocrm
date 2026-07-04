import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function AdminRgpd() {
  const [periode, setPeriode] = useState('semaine')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [delEmail, setDelEmail] = useState('')
  const [delConfirmText, setDelConfirmText] = useState('')
  const [delStep, setDelStep] = useState(1)
  const [delLoading, setDelLoading] = useState(false)
  const [delResult, setDelResult] = useState(null)
  const [delError, setDelError] = useState('')

  useEffect(() => {
    supabase.from('system_email_stats').select('event_type, created_at')
      .then(({ data }) => {
        setRows(data || [])
        setLoading(false)
      })
  }, [])

  const now = new Date()
  function isInPeriode(dateStr) {
    const diff = (now - new Date(dateStr)) / (1000 * 60 * 60 * 24)
    if (periode === 'jour') return diff < 1
    if (periode === 'semaine') return diff < 7
    if (periode === 'mois') return diff < 30
    return false
  }
  function countFor(type) {
    return rows.filter(r => r.event_type === type && isInPeriode(r.created_at)).length
  }

  const sections = [
    { type: 'signup', label: 'Inscription', color: '#534AB7' },
    { type: 'password_reset', label: 'Reinitialisation mot de passe', color: '#0F6E56' },
    { type: 'prospection', label: 'Prospection', color: '#993C1D' },
    { type: 'agenda_confirmation', label: 'Agenda en ligne', color: '#185FA5' },
    { type: 'deletion_request', label: 'Suppression de donnees', color: '#993556' },
  ]

  async function handleDelete() {
    if (delConfirmText !== 'SUPPRIMER') return
    setDelLoading(true); setDelError(''); setDelResult(null)
    try {
      const { data, error } = await supabase.functions.invoke('delete-user-account', {
        body: { email: delEmail.trim() }
      })
      if (error) throw error
      setDelResult(data)
    } catch (e) {
      setDelError('Erreur: ' + e.message)
    }
    setDelLoading(false)
  }

  function resetDelete() {
    setDelStep(1); setDelEmail(''); setDelConfirmText(''); setDelResult(null); setDelError('')
  }

  return (
    <div style={{padding:'1.5rem',maxWidth:'900px'}}>
      <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'1.25rem'}}>
        <i className="ti ti-shield-lock" style={{fontSize:'18px',color:'var(--color-text-secondary)'}} aria-hidden="true"/>
        <div style={{fontSize:'14px',fontWeight:500}}>RGPD - statistiques emails</div>
      </div>

      <div style={{display:'flex',gap:'6px',marginBottom:'1.25rem'}}>
        {['jour','semaine','mois'].map(p => (
          <button key={p} onClick={()=>setPeriode(p)} style={{
            padding:'5px 14px',borderRadius:'20px',fontSize:'12px',cursor:'pointer',fontWeight:500,
            background: periode===p ? '#534AB7' : 'var(--color-background-secondary)',
            color: periode===p ? '#fff' : 'var(--color-text-secondary)',
            border: periode===p ? 'none' : '0.5px solid var(--color-border-tertiary)'}}>
            {p.charAt(0).toUpperCase()+p.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{fontSize:'13px',color:'var(--color-text-secondary)'}}>Chargement...</div>
      ) : (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'10px',marginBottom:'2rem'}}>
          {sections.map(s => (
            <div key={s.type} style={{background:'var(--color-background-secondary)',borderRadius:'10px',padding:'14px 16px'}}>
              <div style={{fontSize:'10px',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'6px'}}>
                {s.label}
              </div>
              <div style={{fontSize:'26px',fontWeight:500,color:s.color}}>{countFor(s.type)}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{borderTop:'0.5px solid var(--color-border-tertiary)',paddingTop:'1.5rem'}}>
        <div style={{fontSize:'14px',fontWeight:500,marginBottom:'1rem',color:'#C0392B'}}>
          <i className="ti ti-alert-triangle" style={{fontSize:'14px',marginRight:'6px'}} aria-hidden="true"/>
          Suppression de compte (droit a l'effacement RGPD)
        </div>

        {delStep === 1 && (
          <div style={{maxWidth:400}}>
            <label style={{fontSize:'12px',fontWeight:600,color:'var(--color-text-secondary)',display:'block',marginBottom:'6px'}}>Email du compte a supprimer</label>
            <input type="email" value={delEmail} onChange={e=>setDelEmail(e.target.value)} placeholder="utilisateur@exemple.com"
              style={{width:'100%',padding:'8px 10px',borderRadius:'8px',border:'0.5px solid var(--color-border-tertiary)',fontSize:'13px',marginBottom:'10px'}} />
            <button onClick={()=>delEmail.trim() && setDelStep(2)} disabled={!delEmail.trim()}
              style={{padding:'8px 16px',borderRadius:'8px',border:'none',background: delEmail.trim() ? '#C0392B' : '#ddd',color:'#fff',fontSize:'13px',fontWeight:500,cursor: delEmail.trim() ? 'pointer' : 'not-allowed'}}>
              Continuer
            </button>
          </div>
        )}

        {delStep === 2 && (
          <div style={{maxWidth:440,background:'#FDECEA',borderRadius:'10px',padding:'1rem 1.25rem'}}>
            <div style={{fontSize:'13px',color:'#7A2020',lineHeight:1.6,marginBottom:'12px'}}>
              Suppression <strong>irreversible</strong> du compte <strong>{delEmail}</strong> et de toutes ses donnees (clients, seances, notes, rendez-vous, etc.). Tapez <strong>SUPPRIMER</strong> pour confirmer.
            </div>
            <input type="text" value={delConfirmText} onChange={e=>setDelConfirmText(e.target.value)} placeholder="SUPPRIMER"
              style={{width:'100%',padding:'8px 10px',borderRadius:'8px',border:'0.5px solid #C0392B',fontSize:'13px',marginBottom:'10px'}} />
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={resetDelete} style={{padding:'8px 16px',borderRadius:'8px',border:'0.5px solid var(--color-border-tertiary)',background:'transparent',fontSize:'13px',cursor:'pointer'}}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={delConfirmText!=='SUPPRIMER' || delLoading}
                style={{padding:'8px 16px',borderRadius:'8px',border:'none',background: delConfirmText==='SUPPRIMER' ? '#C0392B' : '#ddd',color:'#fff',fontSize:'13px',fontWeight:500,cursor: delConfirmText==='SUPPRIMER' ? 'pointer' : 'not-allowed'}}>
                {delLoading ? 'Suppression...' : 'Supprimer definitivement'}
              </button>
            </div>
          </div>
        )}

        {delError && (
          <div style={{marginTop:'12px',padding:'10px 12px',borderRadius:'8px',background:'#FDECEA',color:'#C0392B',fontSize:'13px'}}>{delError}</div>
        )}

        {delResult && (
          <div style={{marginTop:'12px',maxWidth:440}}>
            <div style={{fontSize:'13px',fontWeight:500,marginBottom:'8px',color: delResult.ok ? '#27500A' : '#C0392B'}}>
              {delResult.ok ? 'Compte supprime.' : 'Suppression du compte auth echouee - verifier le detail.'}
            </div>
            <div style={{fontSize:'12px',fontFamily:'monospace',background:'var(--color-background-secondary)',borderRadius:'8px',padding:'10px 12px'}}>
              {Object.entries(delResult.results || {}).map(([table, status]) => (
                <div key={table} style={{color: status==='ok' ? '#27500A' : '#C0392B',marginBottom:'2px'}}>
                  {table}: {status}
                </div>
              ))}
            </div>
            <button onClick={resetDelete} style={{marginTop:'10px',fontSize:'12px',color:'#534AB7',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>
              Nouvelle suppression
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
