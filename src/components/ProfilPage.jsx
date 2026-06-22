import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const inpStyle = {
  width: '100%', padding: '5px 8px', borderRadius: 6,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontSize: 11,
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const EMPTY = { prenom: '', nom: '', telephone: '', ville: '', siret: '', activite: '', agenda_public: false, slug: '' }

export default function ProfilPage({ accent, onSignOut }) {
  const [user,    setUser]    = useState(null)
  const [profil,  setProfil]  = useState(EMPTY)
  const [stats,   setStats]   = useState({ nbClients: 0, nbSeances: 0, moisActif: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(EMPTY)
  const [saving,  setSaving]  = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const { data: { user: u } } = await supabase.auth.getUser()
        if (!u) return

        setUser(u)

        const [{ data: p }, { count: nbClients }, { count: nbSeances }] = await Promise.all([
          supabase.from('profils').select('*').eq('id', u.id).single(),
          supabase.from('clients').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
          supabase.from('seances').select('*', { count: 'exact', head: true }).eq('user_id', u.id),
        ])

        setProfil({
          prenom:    p?.prenom    || u.user_metadata?.prenom || '',
          nom:       p?.nom       || '',
          telephone: p?.telephone || '',
          ville:     p?.ville     || '',
          siret:     p?.siret     || '',
          activite:  p?.activite  || '',
          agenda_public: p?.agenda_public || false,
          slug: p?.slug || '',
        })

        const moisActif = Math.max(1, Math.floor(
          (new Date() - new Date(u.created_at)) / (1000 * 60 * 60 * 24 * 30)
        ))
        setStats({ nbClients: nbClients || 0, nbSeances: nbSeances || 0, moisActif })
      } catch (e) {
        console.error('Erreur chargement profil :', e.message)
      }
      setLoading(false)
    }
    load()
  }, [])

  const initials   = `${profil.prenom[0] || ''}${profil.nom[0] || ''}`.toUpperCase() || '?'
  const membreSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—'

  function startEdit() { setDraft({ ...profil }); setEditing(true); setSaveMsg('') }
  function cancel()    { setEditing(false); setSaveMsg('') }
  const d = k => e => setDraft(p => ({ ...p, [k]: e.target.value }))

  async function save() {
    setSaving(true); setSaveMsg('')
    try {
      const { error } = await supabase.from('profils').upsert({
        id:        user.id,
        prenom:    draft.prenom,
        nom:       draft.nom,
        telephone: draft.telephone,
        ville:     draft.ville,
        siret:     draft.siret,
        activite:  draft.activite,
        agenda_public: draft.agenda_public,
        slug: draft.slug,
      }, { onConflict: 'id' })
      if (error) throw error
      setProfil({ ...draft })
      setEditing(false)
      setSaveMsg('✓ Profil mis à jour')
    } catch (e) {
      setSaveMsg(`✗ Erreur : ${e.message}`)
    }
    setSaving(false)
    setTimeout(() => setSaveMsg(''), 3000)
  }

  if (loading) return (
    <div className="profil" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200, color: 'var(--color-text-secondary)', gap: 8, fontSize: 13 }}>
      <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />
      Chargement…
    </div>
  )

  return (
    <div className="profil">

      {/* ── En-tête ── */}
      <div className="pf-header">
        <div className="pf-av" style={{ color: accent, borderColor: accent }}>{initials}</div>
        <div style={{ flex: 1 }}>
          {editing ? (
            <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
              <input value={draft.prenom} onChange={d('prenom')} placeholder="Prénom" style={{ ...inpStyle, fontSize: 14, fontWeight: 500 }} />
              <input value={draft.nom}    onChange={d('nom')}    placeholder="Nom"    style={{ ...inpStyle, fontSize: 14, fontWeight: 500 }} />
            </div>
          ) : (
            <div className="pf-name">{profil.prenom} {profil.nom}</div>
          )}
          <div className="pf-role">
            {editing ? (
              <>
                <input value={draft.activite} onChange={d('activite')} placeholder="Activité" style={{ ...inpStyle, width: 110 }} />
                <span>·</span>
                <input value={draft.ville}    onChange={d('ville')}    placeholder="Ville"    style={{ ...inpStyle, width: 90 }} />
              </>
            ) : (
              <>{profil.activite}{profil.ville ? ` · ${profil.ville}` : ''}</>
            )}
            <span className="pf-plan">Plan Créateur</span>
          </div>
        </div>
      </div>

      {/* Message flash */}
      {saveMsg && (
        <div style={{ marginBottom: 10, padding: '7px 12px', borderRadius: 8, background: saveMsg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: saveMsg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 12 }}>
          {saveMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="pf-section-title">Statistiques</div>
      <div className="pf-stats">
        <div className="pf-stat"><div className="pf-stat-val">{stats.nbClients}</div><div className="pf-stat-lbl">Clients</div></div>
        <div className="pf-stat"><div className="pf-stat-val">{stats.nbSeances}</div><div className="pf-stat-lbl">Séances</div></div>
        <div className="pf-stat"><div className="pf-stat-val">{stats.moisActif}</div><div className="pf-stat-lbl">Mois actif</div></div>
      </div>

      {/* ── Informations ── */}
      <div className="pf-section-title">Informations</div>
      <div className="pf-grid">
        {editing ? (
          <>
            <div className="pf-field">
              <div className="pf-field-lbl">Email</div>
              <div className="pf-field-val" style={{ fontSize: 11, padding: '5px 0', color: 'var(--color-text-primary)' }}>{user?.email}</div>
              <div style={{ fontSize: 9, color: 'var(--color-text-secondary)', marginTop: 2 }}>Non modifiable ici — lié au compte</div>
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Téléphone</div>
              <input value={draft.telephone} onChange={d('telephone')} type="tel" style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Ville</div>
              <input value={draft.ville} onChange={d('ville')} style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Membre depuis</div>
              <div className="pf-field-val" style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>{membreSince}</div>
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">SIRET</div>
              <input value={draft.siret} onChange={d('siret')} style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Activité</div>
              <input value={draft.activite} onChange={d('activite')} style={inpStyle} />
            </div>
          </>
        ) : (
          [
            { lbl: 'Email',         val: user?.email                                    },
            { lbl: 'Téléphone',     val: profil.telephone || '—'                        },
            { lbl: 'Ville',         val: profil.ville ? `${profil.ville}, France` : '—' },
            { lbl: 'Membre depuis', val: membreSince                                    },
            { lbl: 'SIRET',         val: profil.siret    || '—'                         },
            { lbl: 'Activité',      val: profil.activite || '—'                         },
          ].map(f => (
            <div className="pf-field" key={f.lbl}>
              <div className="pf-field-lbl">{f.lbl}</div>
              <div className="pf-field-val">{f.val}</div>
            </div>
          ))
        )}
      </div>


      {/* ── Agenda Public ── */}
      <div className="pf-section-title">Agenda public</div>
      <div style={{ background: 'var(--color-background-secondary)', borderRadius: 10, padding: '16px', marginBottom: 16, border: '0.5px solid var(--color-border-tertiary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: profil.agenda_public ? 14 : 0 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Agenda public</div>
            <div style={{ fontSize: 11, color: profil.agenda_public ? '#0F6E56' : 'var(--color-text-secondary)', marginTop: 3 }}>
              {profil.agenda_public ? '🟢 Actif — vos clients peuvent réserver en ligne' : '⚫ Désactivé — invisible du public'}
            </div>
          </div>
          <button
            onClick={async () => {
              const newVal = !profil.agenda_public
              setProfil(p => ({ ...p, agenda_public: newVal }))
              await supabase.from('profils').update({ agenda_public: newVal }).eq('id', user.id)
            }}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, flexShrink: 0,
              background: profil.agenda_public ? '#E24B4A' : '#0F6E56',
              color: '#fff'
            }}>
            {profil.agenda_public ? 'Désactiver' : '✦ Activer mon agenda'}
          </button>
        </div>

        {profil.agenda_public && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Votre lien public</div>
            <div style={{ display: 'flex', gap: 0, marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', padding: '7px 10px', background: 'var(--color-background-primary)', borderRadius: '6px 0 0 6px', border: '0.5px solid var(--color-border-tertiary)', whiteSpace: 'nowrap' }}>
                naposolo.com/rdv/
              </div>
              <input
                value={profil.slug || ''}
                onChange={async e => {
                  const slug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                  setProfil(p => ({ ...p, slug }))
                  await supabase.from('profils').update({ slug }).eq('id', user.id)
                }}
                placeholder="prenom-nom"
                style={{ fontSize: 11, padding: '7px 10px', border: '0.5px solid var(--color-border-tertiary)', borderLeft: 'none', borderRadius: '0 6px 6px 0', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', flex: 1, outline: 'none' }}
              />
            </div>
            {profil.slug && (
              <div style={{ display: 'flex', gap: 12 }}>
                
                <a href={'/rdv/' + profil.slug}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: '#0F6E56', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                  <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Voir ma page
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText('https://naposolo.com/rdv/' + profil.slug)}
                  style={{ fontSize: 12, color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="ti ti-copy" style={{ fontSize: 13 }} /> Copier le lien
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Actions ── */}
      <div className="pf-section-title">Actions</div>
      <div className="pf-actions">
        {editing ? (
          <>
            <button className="pf-btn" onClick={save} disabled={saving} style={{ background: accent, border: 'none', opacity: saving ? .7 : 1 }}>
              <i className="ti ti-check" style={{ color: '#fff' }} aria-hidden="true" />
              <span style={{ color: '#fff', fontWeight: 600 }}>{saving ? 'Sauvegarde…' : 'Sauvegarder les modifications'}</span>
            </button>
            <button className="pf-btn" onClick={cancel} disabled={saving}>
              <i className="ti ti-x" style={{ color: 'var(--color-text-secondary)' }} aria-hidden="true" />
              <span>Annuler</span>
            </button>
          </>
        ) : (
          <>
            <button className="pf-btn" onClick={startEdit}>
              <i className="ti ti-edit" style={{ color: accent }} aria-hidden="true" />
              <span>Modifier le profil</span>
            </button>
            <button className="pf-btn">
              <i className="ti ti-lock" style={{ color: '#534AB7' }} aria-hidden="true" />
              <span>Changer le mot de passe</span>
            </button>
            <button className="pf-btn">
              <i className="ti ti-credit-card" style={{ color: '#0F6E56' }} aria-hidden="true" />
              <span>Gérer l'abonnement</span>
            </button>
            <button className="pf-btn pf-btn-danger" onClick={onSignOut}>
              <i className="ti ti-power" aria-hidden="true" />
              <span>Se déconnecter</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
