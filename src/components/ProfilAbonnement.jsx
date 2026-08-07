import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { checkActivatedModules, activateCatalogueModule, deactivateCatalogueModule } from '../lib/marketplaceAddons'

const C = {
  card: 'var(--color-background-secondary, #F5F6F7)',
  cardWhite: 'var(--color-background-primary, #FFFFFF)',
  border: 'var(--color-border-tertiary, #E3E5E7)',
  label: 'var(--color-text-secondary, #8A8F98)',
  text: 'var(--color-text-primary, #1A1C1E)',
  green: '#1FAA59',
  greenBg: '#E8F7EE',
  redBg: '#FDECEC',
  red: '#D63C3C',
  amberBg: '#FDF3E3',
  amber: '#B8860B',
  purpleBg: '#EFECFB',
  purple: '#6C4FD1',
  disabled: '#B8BCC2',
}

const Section = ({ icon, title, badge, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div className="flex items-center justify-between" style={{ marginBottom: 8, display: 'flex' }}>
      <div className="flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon}
        <span style={{ fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>
          {title}
        </span>
      </div>
      {badge}
    </div>
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px' }}>
      {children}
    </div>
  </div>
)

const Row = ({ label, value, muted }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
    <span style={{ fontSize: 13, color: C.label }}>{label}</span>
    <span style={{ fontSize: 13, color: muted ? C.disabled : C.text, fontWeight: 500, textAlign: 'right' }}>{value}</span>
  </div>
)

const ActionItem = ({ icon, iconBg, iconColor, label, danger, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 12, width: '100%',
      background: danger ? C.redBg : C.card,
      border: `1px solid ${danger ? '#F5C6C6' : C.border}`,
      borderRadius: 10, padding: '13px 16px', marginBottom: 8,
      cursor: 'pointer', textAlign: 'left',
    }}
  >
    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: iconBg, flexShrink: 0 }}>
      {icon}
    </span>
    <span style={{ fontSize: 13.5, fontWeight: 500, color: danger ? C.red : C.text }}>{label}</span>
  </button>
)

// Modules issus de marketplace_modules qui ne pointent pas vers un deck/thème
// Oracle catalogue n'ont pas d'état d'activation : ils sont soit accessibles
// librement (status "available"), soit "coming_soon".
function AddonRow({ mod, actif, onToggle, onOpen }) {
  const isCatalogue = !!(mod.catalogue_deck_id || mod.catalogue_theme_id)
  return (
    <div className="flex items-center justify-between" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <i className="ti ti-sparkles" style={{ fontSize: 14, color: actif ? C.green : C.label, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mod.title}</span>
      </div>
      {isCatalogue ? (
        <button
          onClick={() => onToggle(mod)}
          style={{
            fontSize: 12, fontWeight: 600, flexShrink: 0,
            color: actif ? C.label : C.green,
            background: actif ? 'transparent' : C.greenBg,
            border: `1px solid ${actif ? C.border : C.green}55`,
            borderRadius: 8, padding: '5px 12px', cursor: 'pointer',
          }}
        >
          {actif ? 'Désactiver' : 'Activer'}
        </button>
      ) : mod.status === 'available' ? (
        <button
          onClick={() => onOpen(mod)}
          style={{ fontSize: 12, fontWeight: 600, flexShrink: 0, color: '#fff', background: '#185FA5', border: 'none', borderRadius: 8, padding: '5px 12px', cursor: 'pointer' }}
        >
          Ouvrir
        </button>
      ) : (
        <span style={{ fontSize: 11, color: C.disabled, flexShrink: 0 }}>Bientôt</span>
      )}
    </div>
  )
}

export default function ProfilAbonnement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const [modules, setModules] = useState([])
  const [activated, setActivated] = useState({})
  const [seances, setSeances] = useState([])
  const [pwdMsg, setPwdMsg] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser()
      if (!u) { setLoading(false); return }
      setUser(u)

      const [{ data: p }, { data: mods }, { data: sea }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', u.id).single(),
        supabase.from('marketplace_modules').select('*').eq('visible', true).order('position'),
        supabase.from('seances').select('id, prenom, nom, type_seance, prix_euros, date_seance')
          .eq('user_id', u.id).not('prix_euros', 'is', null).order('date_seance', { ascending: false }),
      ])

      setProfil(p)
      setModules(mods || [])
      setSeances(sea || [])
      if (mods?.length) setActivated(await checkActivatedModules(u.id, mods))
      setLoading(false)
    }
    load()
  }, [])

  async function handleToggleAddon(mod) {
    if (!user) return
    if (activated[mod.id]) {
      await deactivateCatalogueModule(user.id, mod)
      setActivated(prev => ({ ...prev, [mod.id]: false }))
    } else {
      await activateCatalogueModule(user.id, mod)
      setActivated(prev => ({ ...prev, [mod.id]: true }))
    }
  }

  function handleOpenAddon(mod) {
    if (mod.path) window.location.hash = mod.path
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
  }

  async function handleResetPassword() {
    if (!user?.email) return
    setPwdMsg('Envoi…')
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: window.location.origin + '/reset-password' })
    setPwdMsg(error ? `✗ ${error.message}` : `✓ Email envoyé à ${user.email}`)
    setTimeout(() => setPwdMsg(''), 4000)
  }

  const modulesByCategory = modules.reduce((acc, m) => {
    (acc[m.category] = acc[m.category] || []).push(m)
    return acc
  }, {})

  const totalSeancesTarifees = seances.reduce((s, r) => s + Number(r.prix_euros || 0), 0)

  const membreDepuis = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    : '—'

  const planLabel = profil?.plan === 'trial'
    ? `Essai gratuit${profil?.trial_ends_at ? ` — jusqu'au ${new Date(profil.trial_ends_at).toLocaleDateString('fr-FR')}` : ''}`
    : (profil?.plan || 'trial')

  return (
    <div className="profil" style={{ maxWidth: 780, margin: '0 auto' }}>
      <button
        onClick={() => navigate(-1)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: C.label, fontSize: 13, fontWeight: 500, padding: 0, marginBottom: 18 }}
      >
        ← Retour au profil
      </button>

      {loading || !profil ? (
        <div style={{ padding: 40, textAlign: 'center', color: C.label, fontSize: 13 }}>Chargement…</div>
      ) : (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, borderRadius: '50%', background: '#1B2A4A', color: '#E8C468', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                {`${profil.prenom?.[0] || ''}${profil.nom?.[0] || ''}`.toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: C.text }}>{profil.prenom} {profil.nom}</span>
                  <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 999, background: C.amberBg, color: C.amber, fontWeight: 600 }}>{planLabel}</span>
                </div>
                <span style={{ fontSize: 13, color: C.label }}>{profil.ville || '—'}</span>
              </div>
            </div>

            <Section icon={<i className="ti ti-lock" style={{ fontSize: 14, color: C.label }} />} title="Compte et sécurité">
              <Row label="Email" value={user?.email || '—'} />
              <Row label="Téléphone" value={profil.tel || '—'} />
              <Row label="Tél. urgence" value={profil.tel_urgence ? `${profil.tel_urgence} (interne, jamais public)` : '—'} muted />
              <Row label="Membre depuis" value={membreDepuis} />
            </Section>

            <Section icon={<i className="ti ti-briefcase" style={{ fontSize: 14, color: C.label }} />} title="Identité professionnelle">
              <Row label="Métier" value={profil.metier || 'Non renseigné'} muted={!profil.metier} />
              <Row label="Activité" value={profil.activite || 'Non renseigné'} muted={!profil.activite} />
              <Row label="SIRET" value={profil.siret || 'Non renseigné'} muted={!profil.siret} />
              <Row label="Bio" value={profil.bio || 'Non renseigné'} muted={!profil.bio} />
            </Section>

            <Section
              icon={<i className="ti ti-map-pin" style={{ fontSize: 14, color: C.label }} />}
              title="Coordonnées de rendez-vous"
              badge={<span style={{ fontSize: 11, color: C.label }}>Visible des clients</span>}
            >
              <Row label="Adresse" value={profil.adresse_rdv ? `${profil.adresse_rdv}${profil.code_postal ? ', ' + profil.code_postal : ''}` : 'Non renseigné'} muted={!profil.adresse_rdv} />
              <Row label="Ville" value={profil.ville_rdv || 'Non renseigné'} muted={!profil.ville_rdv} />
              <Row
                label="Lien Maps"
                value={profil.maps_url
                  ? <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: C.greenBg, color: C.green }}>Renseigné</span>
                  : 'Non renseigné'}
                muted={!profil.maps_url}
              />
            </Section>

            <Section
              icon={<i className="ti ti-credit-card" style={{ fontSize: 14, color: C.label }} />}
              title="Abonnement Naposolo"
              badge={<span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Alpha gratuite</span>}
            >
              <Row label="Palier" value={planLabel} />
            </Section>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>Addons</span>
              <span style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>Gratuit pendant l'alpha</span>
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '4px 20px', marginBottom: 20, maxHeight: 260, overflowY: 'auto' }}>
              {Object.entries(modulesByCategory).map(([cat, items]) => (
                <div key={cat} style={{ padding: '10px 0' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: C.label, margin: '0 0 2px' }}>{cat}</p>
                  {items.map(m => (
                    <AddonRow key={m.id} mod={m} actif={!!activated[m.id]} onToggle={handleToggleAddon} onOpen={handleOpenAddon} />
                  ))}
                </div>
              ))}
              {modules.length === 0 && <p style={{ fontSize: 12, color: C.label, padding: '12px 0' }}>Aucun module disponible.</p>}
            </div>

            <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>
              Droit de rétractation
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '14px 20px', marginBottom: 20 }}>
              <i className="ti ti-scale" style={{ fontSize: 16, color: C.disabled, marginTop: 1, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.text, fontWeight: 500, marginBottom: 2 }}>
                  Non applicable — aucun contrat payant en cours
                </div>
                <div style={{ fontSize: 12, color: C.label, lineHeight: 1.5 }}>
                  Une fois les paiements ouverts, vous disposerez d'un délai légal de 14 jours pour vous
                  rétracter d'un abonnement payant (Code de la consommation, art. L221-18), avec
                  remboursement automatique. Fonctionnalité affichée mais inactive pendant la phase alpha
                  gratuite.
                </div>
              </div>
            </div>

            <Section
              icon={<i className="ti ti-wallet" style={{ fontSize: 14, color: C.label }} />}
              title="Séances tarifées"
              badge={<span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{totalSeancesTarifees}€</span>}
            >
              <div style={{ fontSize: 11, color: C.label, marginBottom: 6 }}>
                Montants renseignés sur vos séances — pas encore de suivi de paiement confirmé.
              </div>
              {seances.slice(0, 8).map(r => (
                <Row key={r.id} label={`${r.prenom || ''} ${r.nom || ''}`.trim() || 'Client'} value={`${r.type_seance || 'Séance'} — ${r.prix_euros}€`} />
              ))}
              {seances.length === 0 && <div style={{ fontSize: 12, color: C.label }}>Aucune séance tarifée pour l'instant.</div>}
            </Section>

            <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>
              Agenda public
            </div>
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Agenda public</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: profil.agenda_public ? C.green : C.label, marginTop: 2 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: profil.agenda_public ? C.green : C.disabled }} />
                    {profil.agenda_public ? 'Actif — vos clients peuvent réserver en ligne' : 'Désactivé'}
                  </div>
                </div>
              </div>
              {profil.slug && (
                <>
                  <div style={{ fontSize: 11, color: C.label, marginBottom: 6 }}>Votre lien public</div>
                  <div style={{ display: 'flex', alignItems: 'center', background: C.cardWhite, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: C.label }}>naposolo.com/rdv/</span>
                    <span style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>{profil.slug}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <a href={'/rdv/' + profil.slug} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.green, fontWeight: 600, textDecoration: 'none' }}>
                      <i className="ti ti-external-link" style={{ fontSize: 13 }} /> Voir ma page
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText('https://naposolo.com/rdv/' + profil.slug)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: C.label, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <i className="ti ti-copy" style={{ fontSize: 13 }} /> Copier le lien
                    </button>
                  </div>
                </>
              )}
            </div>

            {pwdMsg && (
              <div style={{ marginBottom: 10, padding: '7px 12px', borderRadius: 8, background: pwdMsg.startsWith('✓') ? C.greenBg : C.redBg, color: pwdMsg.startsWith('✓') ? C.green : C.red, fontSize: 12 }}>
                {pwdMsg}
              </div>
            )}

            <div style={{ marginBottom: 8, fontSize: 11, letterSpacing: 0.5, color: C.label, textTransform: 'uppercase', fontWeight: 600 }}>
              Actions
            </div>
            <ActionItem icon={<i className="ti ti-edit" style={{ fontSize: 14, color: C.amber }} />} iconBg={C.amberBg} iconColor={C.amber} label="Modifier le profil" onClick={() => navigate('/profil')} />
            <ActionItem icon={<i className="ti ti-key" style={{ fontSize: 14, color: C.purple }} />} iconBg={C.purpleBg} iconColor={C.purple} label="Changer le mot de passe" onClick={handleResetPassword} />
            <ActionItem icon={<i className="ti ti-power" style={{ fontSize: 14, color: C.red }} />} iconBg={C.redBg} iconColor={C.red} label="Se déconnecter" danger onClick={handleSignOut} />
        </>
      )}
    </div>
  )
}
