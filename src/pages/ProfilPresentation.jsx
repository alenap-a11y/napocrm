import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

const inputStyle = {
  width: '100%', padding: '8px 10px', borderRadius: 8,
  border: '0.5px solid var(--color-border-secondary)',
  background: 'var(--color-background-primary)',
  color: 'var(--color-text-primary)', fontSize: 13,
  boxSizing: 'border-box', fontFamily: 'inherit',
}

const sectionTitleStyle = {
  fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)',
  marginTop: 22, marginBottom: 10,
}

const cardStyle = {
  background: 'var(--color-background-secondary)', borderRadius: 12,
  padding: '16px 18px', border: '0.5px solid var(--color-border-tertiary)',
}

const OFFRE_TYPES = [
  { v: 'live', label: 'Live' },
  { v: 'formation', label: 'Formation' },
  { v: 'seminaire', label: 'Séminaire' },
  { v: 'meditation', label: 'Méditation' },
  { v: 'atelier', label: 'Atelier' },
]
const OFFRE_MODALITES = [
  { v: 'presentiel', label: 'Présentiel' },
  { v: 'live', label: 'Live' },
  { v: 'replay', label: 'Replay' },
]

function ListEditor({ label, placeholder, icon, items, onChange }) {
  const [value, setValue] = useState('')
  function add() {
    const v = value.trim()
    if (!v) return
    onChange([...items, v])
    setValue('')
  }
  return (
    <div className="pf-field">
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          style={inputStyle}
        />
        <button type="button" onClick={add} style={{ padding: '0 14px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          Ajouter
        </button>
      </div>
      {items.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {items.map((it, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, padding: '4px 10px', borderRadius: 999, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)' }}>
              {icon && <i className={`ti ${icon}`} style={{ fontSize: 12, color: 'var(--color-accent)' }} />}
              {it}
              <i className="ti ti-x" style={{ fontSize: 12, cursor: 'pointer', color: 'var(--color-text-secondary)' }} onClick={() => onChange(items.filter((_, j) => j !== i))} />
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProfilPresentation() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [charteAcceptee, setCharteAcceptee] = useState(false)
  const [charteCoche, setCharteCoche] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [draft, setDraft] = useState(null)
  const [offres, setOffres] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) return
      setUser(u)
      const [{ data: p }, { data: o }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', u.id).single(),
        supabase.from('offres_praticien').select('*').eq('user_id', u.id).order('ordre'),
      ])
      setCharteAcceptee(!!p?.charte_acceptee_le)
      setDraft({
        metier: p?.metier || '',
        avatar_url: p?.avatar_url || '',
        pays: p?.pays || '',
        langues: p?.langues || [],
        specialites: (p?.specialites || []).join(', '),
        anciennete_depuis: p?.anciennete_depuis || '',
        siret: p?.siret || '',
        aides_services: p?.aides_services || '',
        musiques: p?.musiques || [],
        livres: p?.livres || [],
        recettes: p?.recettes || [],
        parcours: p?.parcours || '',
        formations: p?.formations || [],
        tarif_indicatif: p?.tarif_indicatif || '',
        tel_pro: p?.tel_pro || '',
        email_pro: p?.email_pro || '',
        films_series: p?.films_series || [],
        passions: p?.passions || [],
        animal: p?.animal || '',
        petit_plaisir: p?.petit_plaisir || '',
        endroit_prefere: p?.endroit_prefere || '',
        cote_decale: p?.cote_decale || '',
        phrase_representative: p?.phrase_representative || '',
        choses_insolites: p?.choses_insolites || [],
        presentation_statut: p?.presentation_statut || 'brouillon',
      })
      setOffres(o || [])
      setLoading(false)
    }
    load()
  }, [])

  async function accepterCharte() {
    if (!charteCoche || !user) return
    const now = new Date().toISOString()
    await supabase.from('profiles').update({ charte_acceptee_le: now }).eq('id', user.id)
    setCharteAcceptee(true)
  }

  async function handleAvatarUpload(e) {
    const file = e.target.files[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
      const url = data.publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      setDraft(d => ({ ...d, avatar_url: url }))
    } catch (err) { console.error('Upload photo :', err.message) }
    setUploadingAvatar(false)
  }

  function buildPayload() {
    return {
      metier: draft.metier,
      pays: draft.pays,
      langues: draft.langues,
      specialites: draft.specialites.split(',').map(s => s.trim()).filter(Boolean),
      anciennete_depuis: draft.anciennete_depuis || null,
      siret: draft.siret,
      aides_services: draft.aides_services,
      musiques: draft.musiques,
      livres: draft.livres,
      recettes: draft.recettes,
      parcours: draft.parcours,
      formations: draft.formations || [],
      tarif_indicatif: draft.tarif_indicatif,
      tel_pro: draft.tel_pro,
      email_pro: draft.email_pro,
      films_series: draft.films_series || [],
      passions: draft.passions || [],
      animal: draft.animal,
      petit_plaisir: draft.petit_plaisir,
      endroit_prefere: draft.endroit_prefere,
      cote_decale: draft.cote_decale,
      phrase_representative: draft.phrase_representative,
      choses_insolites: draft.choses_insolites || [],
    }
  }

  async function saveDraft() {
    setSaving(true); setMsg('')
    try {
      const { error } = await supabase.from('profiles').update(buildPayload()).eq('id', user.id)
      if (error) throw error
      setMsg('✓ Brouillon enregistré')
    } catch (e) { setMsg(`✗ Erreur : ${e.message}`) }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function publier() {
    setSaving(true); setMsg('')
    try {
      const { error } = await supabase.from('profiles').update({ ...buildPayload(), presentation_statut: 'publie' }).eq('id', user.id)
      if (error) throw error
      setDraft(d => ({ ...d, presentation_statut: 'publie' }))
      setMsg('✓ Présentation publiée')
    } catch (e) { setMsg(`✗ Erreur : ${e.message}`) }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  async function ajouterOffre() {
    const { data, error } = await supabase.from('offres_praticien').insert({
      user_id: user.id, type: 'atelier', modalite: 'presentiel', ordre: offres.length,
    }).select().single()
    if (!error && data) setOffres(o => [...o, data])
  }
  async function majOffre(id, patch) {
    setOffres(o => o.map(x => x.id === id ? { ...x, ...patch } : x))
    await supabase.from('offres_praticien').update(patch).eq('id', id)
  }
  async function supprimerOffre(id) {
    setOffres(o => o.filter(x => x.id !== id))
    await supabase.from('offres_praticien').delete().eq('id', id)
  }

  if (loading || !draft) return (
    <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text-secondary)', fontSize: 13 }}>
      <i className="ti ti-loader-2" style={{ animation: 'spin 1s linear infinite' }} />Chargement…
    </div>
  )

  if (!charteAcceptee) {
    return (
      <div style={{ padding: '1.6rem 2rem', maxWidth: 640 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <i className="ti ti-user" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Présentation du praticien</div>
        </div>
        <div style={{ background: '#FBEAEA', border: '1px solid #E24B4A', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <i className="ti ti-alert-triangle" style={{ color: '#B23A3A', fontSize: 18 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#B23A3A' }}>À lire avant de continuer</div>
          </div>
          <p style={{ fontSize: 13, color: '#8A2E2E', marginBottom: 10 }}>
            Cette page est visible publiquement. Sont strictement interdits :
          </p>
          <ul style={{ fontSize: 13, color: '#8A2E2E', paddingLeft: 20, lineHeight: 1.7, marginBottom: 14 }}>
            <li>Toute allégation de guérison ou de résultat garanti</li>
            <li>Tout diagnostic ou traitement médical, ou incitation à arrêter un traitement en cours</li>
            <li>Toute qualification, titre ou certification non vérifiable</li>
            <li>Tout contenu à caractère sectaire ou incitant à la dépendance financière ou psychologique</li>
          </ul>
          <p style={{ fontSize: 12, color: '#8A2E2E', marginBottom: 14 }}>
            La publication est automatique dès validation — il n'y a pas de relecture avant mise en ligne. Un contrôle a posteriori peut entraîner la désactivation de la fiche en cas de non-respect.
          </p>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#8A2E2E', cursor: 'pointer', marginBottom: 14 }}>
            <input type="checkbox" checked={charteCoche} onChange={e => setCharteCoche(e.target.checked)} style={{ marginTop: 2 }} />
            J'ai lu et je m'engage à respecter ces règles.
          </label>
          <button
            onClick={accepterCharte}
            disabled={!charteCoche}
            style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: charteCoche ? '#B23A3A' : '#D9A9A9', color: '#fff', fontSize: 13, fontWeight: 600, cursor: charteCoche ? 'pointer' : 'not-allowed' }}
          >
            Valider et continuer
          </button>
        </div>
      </div>
    )
  }

  const d = k => e => setDraft(p => ({ ...p, [k]: e.target.value }))

  return (
    <div style={{ padding: '1.6rem 2rem', maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <i className="ti ti-user" style={{ fontSize: 24, color: 'var(--color-accent)' }} />
          <div>
            <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--color-text-primary)' }}>Présentation du praticien</div>
            <div style={{ fontSize: 12, color: draft.presentation_statut === 'publie' ? '#0F6E56' : 'var(--color-text-secondary)' }}>
              {draft.presentation_statut === 'publie' ? '🟢 Publiée — visible dans l’Annuaire' : '⚫ Brouillon — pas encore publiée'}
            </div>
          </div>
        </div>
      </div>

      {msg && (
        <div style={{ margin: '12px 0', padding: '8px 12px', borderRadius: 8, background: msg.startsWith('✓') ? '#EAF3DE' : '#FBEAF0', color: msg.startsWith('✓') ? '#3B6D11' : '#993556', fontSize: 12 }}>
          {msg}
        </div>
      )}

      <div style={sectionTitleStyle}>Photo et titre</div>
      <div style={{ ...cardStyle, display: 'flex', gap: 16, alignItems: 'center' }}>
        <div onClick={() => fileInputRef.current?.click()} title="Changer la photo"
          style={{ position: 'relative', width: 64, height: 64, borderRadius: '50%', border: '2px solid var(--color-accent)', cursor: 'pointer', flexShrink: 0, overflow: 'hidden', background: 'var(--color-background-primary)' }}>
          {draft.avatar_url ? (
            <img src={draft.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-camera" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }} />
            </div>
          )}
          {uploadingAvatar && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="ti ti-loader-2" style={{ color: '#fff', fontSize: 16, animation: 'spin 1s linear infinite' }} />
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleAvatarUpload} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Titre / métier</div>
          <input value={draft.metier} onChange={d('metier')} placeholder="Sophrologue, Naturopathe..." style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitleStyle}>Pays, langues et spécialités</div>
      <div style={cardStyle}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}><i className="ti ti-flag" style={{ fontSize: 12, marginRight: 4 }} />Pays</div>
            <input value={draft.pays} onChange={d('pays')} placeholder="France" style={inputStyle} />
          </div>
        </div>
        <ListEditor label="Langues parlées" placeholder="Français..." icon="ti-language" items={draft.langues} onChange={v => setDraft(p => ({ ...p, langues: v }))} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Spécialités / tags</div>
          <input value={draft.specialites} onChange={d('specialites')} placeholder="Sophrologie, Massage bien-être, Naturopathie..." style={inputStyle} />
          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginTop: 4 }}>Séparées par des virgules — reprises telles quelles dans l'Annuaire.</div>
        </div>
      </div>

      <div style={sectionTitleStyle}>Ancienneté</div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Je pratique depuis</div>
        <input type="date" value={draft.anciennete_depuis || ''} onChange={d('anciennete_depuis')} style={{ ...inputStyle, maxWidth: 220 }} />
      </div>

      <div style={sectionTitleStyle}>Parcours et formations</div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Parcours</div>
        <textarea value={draft.parcours || ''} onChange={d('parcours')} rows={4} placeholder="Votre parcours, en quelques lignes..." style={{ ...inputStyle, resize: 'vertical' }} />
        <div style={{ marginTop: 14 }}>
          <ListEditor label="Formations / certifications" placeholder="Un intitulé..." icon="ti-certificate" items={draft.formations || []} onChange={v => setDraft(p => ({ ...p, formations: v }))} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Tarif indicatif</div>
          <input value={draft.tarif_indicatif || ''} onChange={d('tarif_indicatif')} placeholder="À partir de 50€" style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitleStyle}>Contact</div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Téléphone professionnel</div>
        <input value={draft.tel_pro || ''} onChange={d('tel_pro')} placeholder="06 12 34 56 78" style={inputStyle} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Email professionnel</div>
          <input value={draft.email_pro || ''} onChange={d('email_pro')} placeholder="contact@..." style={inputStyle} />
        </div>
      </div>

      <div style={sectionTitleStyle}>Offres</div>
      <div style={cardStyle}>
        {offres.length === 0 && <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 10 }}>Aucune offre pour l'instant.</p>}
        {offres.map(o => (
          <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <select value={o.type} onChange={e => majOffre(o.id, { type: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              {OFFRE_TYPES.map(t => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <select value={o.modalite} onChange={e => majOffre(o.id, { modalite: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
              {OFFRE_MODALITES.map(m => <option key={m.v} value={m.v}>{m.label}</option>)}
            </select>
            <input type="date" value={o.date_prevue || ''} onChange={e => majOffre(o.id, { date_prevue: e.target.value || null })} style={{ ...inputStyle, flex: 1 }} />
            <i className="ti ti-trash" style={{ fontSize: 16, color: '#B23A3A', cursor: 'pointer', flexShrink: 0 }} onClick={() => supprimerOffre(o.id)} />
          </div>
        ))}
        <button type="button" onClick={ajouterOffre} style={{ marginTop: 4, padding: '7px 14px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
          + Ajouter une offre
        </button>
      </div>

      <div style={sectionTitleStyle}>Aides / services proposés</div>
      <div style={cardStyle}>
        <textarea value={draft.aides_services} onChange={d('aides_services')} rows={3} placeholder="Description libre..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div style={sectionTitleStyle}>Musiques, livres et recettes préférés</div>
      <div style={cardStyle}>
        <ListEditor label="Musiques" placeholder="Un titre, un artiste..." icon="ti-music" items={draft.musiques} onChange={v => setDraft(p => ({ ...p, musiques: v }))} />
        <div style={{ height: 14 }} />
        <ListEditor label="Livres" placeholder="Un titre..." icon="ti-book" items={draft.livres} onChange={v => setDraft(p => ({ ...p, livres: v }))} />
        <div style={{ height: 14 }} />
        <ListEditor label="Recettes" placeholder="Une recette..." icon="ti-tools-kitchen-2" items={draft.recettes} onChange={v => setDraft(p => ({ ...p, recettes: v }))} />
      </div>

      <div style={sectionTitleStyle}>Films, séries et passions</div>
      <div style={cardStyle}>
        <ListEditor label="Films / séries" placeholder="Un titre..." icon="ti-movie" items={draft.films_series || []} onChange={v => setDraft(p => ({ ...p, films_series: v }))} />
        <div style={{ height: 14 }} />
        <ListEditor label="Passions" placeholder="Une passion..." icon="ti-heart" items={draft.passions || []} onChange={v => setDraft(p => ({ ...p, passions: v }))} />
      </div>

      <div style={sectionTitleStyle}>Petits détails</div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Mon animal</div>
        <input value={draft.animal || ''} onChange={d('animal')} style={inputStyle} />
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Mon petit plaisir</div>
          <input value={draft.petit_plaisir || ''} onChange={d('petit_plaisir')} style={inputStyle} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Mon endroit préféré</div>
          <input value={draft.endroit_prefere || ''} onChange={d('endroit_prefere')} style={inputStyle} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Mon côté décalé</div>
          <input value={draft.cote_decale || ''} onChange={d('cote_decale')} style={inputStyle} />
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Une phrase qui me représente</div>
          <input value={draft.phrase_representative || ''} onChange={d('phrase_representative')} style={inputStyle} />
        </div>
        <div style={{ marginTop: 14 }}>
          <ListEditor label="3 choses que vous ne devineriez pas sur moi" placeholder="Une chose insolite..." icon="ti-sparkles" items={draft.choses_insolites || []} onChange={v => setDraft(p => ({ ...p, choses_insolites: v }))} />
        </div>
      </div>

      <div style={sectionTitleStyle}>Mentions légales</div>
      <div style={cardStyle}>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>SIRET (optionnel)</div>
        <input value={draft.siret} onChange={d('siret')} placeholder="123 456 789 00012" style={{ ...inputStyle, maxWidth: 280 }} />
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 24, marginBottom: 40 }}>
        <button onClick={saveDraft} disabled={saving} style={{ padding: '10px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          Enregistrer le brouillon
        </button>
        <button onClick={publier} disabled={saving} style={{ padding: '10px 18px', borderRadius: 8, border: 'none', background: 'var(--color-accent)', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1 }}>
          {draft.presentation_statut === 'publie' ? 'Publiée' : 'Publier'}
        </button>
      </div>
    </div>
  )
}
