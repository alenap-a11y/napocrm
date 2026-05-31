import { useState } from 'react'

const INIT = {
  prenom:   'Nathalie',
  nom:      'Alpha',
  activite: 'Sophrologue',
  ville:    'Nancy',
  email:    'nathalie@exemple.fr',
  tel:      '06 12 34 56 78',
  siret:    '123 456 789 00012',
}

const inpStyle = {
  width: '100%', padding: '5px 8px', borderRadius: 6,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontSize: 11,
  boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function ProfilPage({ accent, onSignOut }) {
  const [info,    setInfo]    = useState(INIT)
  const [draft,   setDraft]   = useState(INIT)
  const [editing, setEditing] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  const initials = `${draft.prenom[0] || ''}${draft.nom[0] || ''}`.toUpperCase() || 'NA'

  function startEdit() { setDraft({ ...info }); setEditing(true) }
  function cancel()    { setEditing(false) }
  function save()      {
    setInfo({ ...draft })
    setEditing(false)
    setSaveMsg('✓ Profil mis à jour')
    setTimeout(() => setSaveMsg(''), 2500)
  }
  const d = (k) => e => setDraft(p => ({ ...p, [k]: e.target.value }))

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
            <div className="pf-name">{info.prenom} {info.nom}</div>
          )}
          <div className="pf-role">
            {editing ? (
              <>
                <input value={draft.activite} onChange={d('activite')} placeholder="Activité" style={{ ...inpStyle, width: 110 }} />
                <span>·</span>
                <input value={draft.ville}    onChange={d('ville')}    placeholder="Ville"    style={{ ...inpStyle, width: 90 }} />
              </>
            ) : (
              <>{info.activite} · {info.ville}</>
            )}
            <span className="pf-plan">Plan Créateur</span>
          </div>
        </div>
      </div>

      {/* Message flash */}
      {saveMsg && (
        <div style={{ marginBottom: 10, padding: '7px 12px', borderRadius: 8, background: '#EAF3DE', color: '#3B6D11', fontSize: 12 }}>
          {saveMsg}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="pf-section-title">Statistiques</div>
      <div className="pf-stats">
        <div className="pf-stat"><div className="pf-stat-val">12</div><div className="pf-stat-lbl">Clients</div></div>
        <div className="pf-stat"><div className="pf-stat-val">47</div><div className="pf-stat-lbl">Séances</div></div>
        <div className="pf-stat"><div className="pf-stat-val">3</div><div className="pf-stat-lbl">Mois actif</div></div>
      </div>

      {/* ── Informations ── */}
      <div className="pf-section-title">Informations</div>
      <div className="pf-grid">
        {editing ? (
          <>
            <div className="pf-field">
              <div className="pf-field-lbl">Email</div>
              <input value={draft.email} onChange={d('email')} type="email" style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Téléphone</div>
              <input value={draft.tel} onChange={d('tel')} type="tel" style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Ville</div>
              <input value={draft.ville} onChange={d('ville')} style={inpStyle} />
            </div>
            <div className="pf-field">
              <div className="pf-field-lbl">Membre depuis</div>
              <div className="pf-field-val" style={{ color: 'var(--color-text-secondary)', fontSize: 11 }}>Mars 2026</div>
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
            { lbl: 'Email',          val: info.email    },
            { lbl: 'Téléphone',      val: info.tel      },
            { lbl: 'Ville',          val: `${info.ville}, France` },
            { lbl: 'Membre depuis',  val: 'Mars 2026'   },
            { lbl: 'SIRET',          val: info.siret    },
            { lbl: 'Activité',       val: info.activite },
          ].map(f => (
            <div className="pf-field" key={f.lbl}>
              <div className="pf-field-lbl">{f.lbl}</div>
              <div className="pf-field-val">{f.val}</div>
            </div>
          ))
        )}
      </div>

      {/* ── Actions ── */}
      <div className="pf-section-title">Actions</div>
      <div className="pf-actions">
        {editing ? (
          <>
            <button className="pf-btn" onClick={save} style={{ background: accent, border: 'none' }}>
              <i className="ti ti-check" style={{ color: '#fff' }} aria-hidden="true" />
              <span style={{ color: '#fff', fontWeight: 600 }}>Sauvegarder les modifications</span>
            </button>
            <button className="pf-btn" onClick={cancel}>
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
