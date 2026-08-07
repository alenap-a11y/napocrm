import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const C = {
  card: 'var(--color-background-secondary, #F5F6F7)',
  cardWhite: 'var(--color-background-primary, #FFFFFF)',
  border: 'var(--color-border-tertiary, #E3E5E7)',
  label: 'var(--color-text-secondary, #8A8F98)',
  text: 'var(--color-text-primary, #1A1C1E)',
  disabled: '#B8BCC2',
}

const TABS = [
  { id: 'seances', label: 'Séances', icon: 'ti-calendar' },
  { id: 'paiements', label: 'Paiements', icon: 'ti-wallet' },
  { id: 'achats', label: 'Achats', icon: 'ti-shopping-bag' },
]

// Séances : donnée réelle (seances.prix_euros). Paiements / Achats : aucune table
// backend correspondante n'existe aujourd'hui — état vide honnête, pas de placeholder.
export function HistoriqueAccordion() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('seances')
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [seances, setSeances] = useState([])

  useEffect(() => {
    if (!open || loaded) return
    async function load() {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('seances')
        .select('id, prenom, nom, type_seance, prix_euros, date_seance')
        .eq('user_id', user.id)
        .not('prix_euros', 'is', null)
        .neq('statut', 'annulé')
        .order('date_seance', { ascending: false })
        .limit(50)
      setSeances(data || [])
      setLoaded(true)
      setLoading(false)
    }
    load()
  }, [open, loaded])

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '13px 16px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: '#EFECFB', flexShrink: 0 }}>
            <i className="ti ti-calendar" style={{ fontSize: 14, color: '#6C4FD1' }} />
          </span>
          <span style={{ fontSize: 13.5, fontWeight: 500, color: C.text }}>Historique</span>
        </span>
        <i className="ti ti-chevron-down" style={{ fontSize: 16, color: C.label, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: `1px solid ${C.border}` }}>
            {TABS.map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 12.5, fontWeight: 500,
                    padding: '6px 10px',
                    color: active ? C.text : C.label,
                    background: 'transparent', border: 'none',
                    borderBottom: active ? '2px solid #6C4FD1' : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                >
                  <i className={`ti ${t.icon}`} style={{ fontSize: 13 }} /> {t.label}
                </button>
              )
            })}
          </div>

          {tab === 'seances' && (
            <div style={{ background: C.cardWhite, borderRadius: 8, border: `1px solid ${C.border}`, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
              {loading ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12.5, color: C.label }}>Chargement…</div>
              ) : seances.length === 0 ? (
                <div style={{ padding: '20px 14px', textAlign: 'center', fontSize: 12.5, color: C.label }}>Aucune séance tarifée pour l'instant.</div>
              ) : (
                seances.map((s, i) => (
                  <div
                    key={s.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: i < seances.length - 1 ? `1px solid ${C.border}` : 'none' }}
                  >
                    <div>
                      <span style={{ fontSize: 12.5, color: C.text, fontWeight: 500 }}>{`${s.prenom || ''} ${s.nom || ''}`.trim() || 'Client'}</span>
                      <span style={{ fontSize: 11.5, color: C.label, marginLeft: 8 }}>{s.type_seance || 'Séance'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 11, color: C.label }}>{s.date_seance ? new Date(s.date_seance).toLocaleDateString('fr-FR') : '—'}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: C.text }}>{s.prix_euros}€</span>
                    </div>
                  </div>
                ))
              )}
              <div style={{ padding: '8px 14px', fontSize: 10.5, color: C.label, background: C.card }}>
                Montants renseignés sur les séances — pas des paiements confirmés
              </div>
            </div>
          )}

          {tab === 'paiements' && (
            <div style={{ background: C.cardWhite, borderRadius: 8, border: `1px solid ${C.border}`, padding: '20px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: 12.5, color: C.label }}>Suivi des paiements non disponible</span>
              <div style={{ fontSize: 11, color: C.disabled, marginTop: 4 }}>
                Aucun système de paiement actif — sera disponible après ouverture des paiements
              </div>
            </div>
          )}

          {tab === 'achats' && (
            <div style={{ background: C.cardWhite, borderRadius: 8, border: `1px solid ${C.border}`, padding: '20px 14px', textAlign: 'center' }}>
              <span style={{ fontSize: 12.5, color: C.label }}>Aucun historique d'achat pour l'instant</span>
              <div style={{ fontSize: 11, color: C.disabled, marginTop: 4 }}>
                Les addons actifs sont visibles dans "Gérer l'abonnement"
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Section "Bientôt" — 5 idées nom-seul, visibles mais non cliquables, aucun arbitrage tranché
const IDEES_BIENTOT = [
  'Parrainage',
  'Abonnés à ma page Naposolo',
  'Affiliations',
  'Napo-Annuaire',
  'Napo-Événement',
]

export function SectionBientot() {
  return (
    <div style={{ marginTop: 20 }}>
      <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>
        Bientôt
      </div>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {IDEES_BIENTOT.map((idee, i) => (
          <div
            key={idee}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              borderBottom: i < IDEES_BIENTOT.length - 1 ? `1px solid ${C.border}` : 'none',
              opacity: 0.55,
            }}
          >
            <i className="ti ti-sparkles" style={{ fontSize: 14, color: C.disabled }} />
            <span style={{ fontSize: 13, color: C.disabled }}>{idee}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
