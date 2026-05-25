import { useState } from 'react'
import SeanceTimeline from './SeanceTimeline'

const FLEUR_SUGGESTIONS = {
  'Anxiété / peurs': ['Mimulus', 'Aspen', 'Rock Rose'],
  'Pensées en boucle': ['White Chestnut', 'Agrimony'],
  'Fatigue profonde': ['Olive', 'Hornbeam', 'Oak'],
  'Manque de confiance': ['Larch', 'Cerato'],
  'Tristesse': ['Mustard', 'Sweet Chestnut', 'Willow'],
  'Colère / impatience': ['Holly', 'Impatiens', 'Beech'],
  'Difficulté à dire non': ['Centaury', 'Walnut'],
  'Découragement': ['Gentian', 'Gorse'],
  'Transition de vie': ['Walnut', 'Wild Oat'],
  'Perfectionnisme': ['Rock Water', 'Vervain'],
  'Isolement': ['Water Violet', 'Heather'],
  'Choc émotionnel récent': ['Star of Bethlehem'],
}

const TOUS_ELIXIRS = {
  'Pour les peurs': ['Aspen', 'Cherry Plum', 'Mimulus', 'Red Chestnut', 'Rock Rose'],
  "Pour l'incertitude": ['Cerato', 'Gentian', 'Gorse', 'Hornbeam', 'Scleranthus', 'Wild Oat'],
  "Manque d'intérêt au présent": ['Chestnut Bud', 'Clematis', 'Honeysuckle', 'Mustard', 'Olive', 'White Chestnut', 'Wild Rose'],
  'Solitude': ['Heather', 'Impatiens', 'Water Violet'],
  'Hypersensibilité': ['Agrimony', 'Centaury', 'Holly', 'Walnut'],
  'Découragement / désespoir': ['Crab Apple', 'Elm', 'Larch', 'Oak', 'Pine', 'Star of Bethlehem', 'Sweet Chestnut', 'Willow'],
  'Surpréoccupation pour autrui': ['Beech', 'Chicory', 'Rock Water', 'Vervain', 'Vine'],
}

const ETATS = Object.keys(FLEUR_SUGGESTIONS)

export default function FicheClientBach({ client }) {
  const [step, setStep] = useState(1)
  const TOTAL = 6

  // Étape 1
  const [nom, setNom] = useState(client?.nom || '')
  const [age, setAge] = useState(client?.age || '')
  const [motif, setMotif] = useState(client?.motif || '')
  const [typeSeance, setTypeSeance] = useState('1ère séance')

  // Étape 2
  const [etatsCoches, setEtatsCoches] = useState([])
  const [score, setScore] = useState(0)
  const [notes, setNotes] = useState('')

  // Étape 3
  const [fleursChoisies, setFleursChoisies] = useState([])

  const togEtat = (e) => setEtatsCoches(prev =>
    prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e]
  )

  const togFleur = (f) => {
    if (fleursChoisies.includes(f)) {
      setFleursChoisies(prev => prev.filter(x => x !== f))
    } else if (fleursChoisies.length < 7) {
      setFleursChoisies(prev => [...prev, f])
    }
  }

  const suggestions = [...new Set(
    etatsCoches.flatMap(e => FLEUR_SUGGESTIONS[e] || [])
  )].slice(0, 8)

  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const nextDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 21)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
  }

  const scoreLabels = ['', 'Très difficile', 'Difficile', 'Assez difficile', 'Plutôt difficile', 'Moyen', 'Correct', 'Assez bien', 'Bien', 'Très bien', 'Excellent']

  // Styles partagés
  const card = { background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 10 }
  const cardTeal = { background: '#E1F5EE', border: '0.5px solid #5DCAA5', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: 10 }
  const cardPurple = { background: '#EEEDFE', border: '0.5px solid #AFA9EC', borderRadius: 12, padding: '0.875rem 1.125rem', marginBottom: 10 }
  const label = { fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-text-tertiary)', marginBottom: 8, display: 'block' }
  const tag = (on) => ({
    display: 'inline-block', fontSize: 12, padding: '3px 10px', borderRadius: 12,
    margin: 2, cursor: 'pointer', border: '0.5px solid',
    background: on ? '#E1F5EE' : 'var(--color-background-secondary)',
    color: on ? '#085041' : 'var(--color-text-secondary)',
    borderColor: on ? '#5DCAA5' : 'var(--color-border-tertiary)',
  })
  const fleurTag = (on) => ({
    display: 'inline-block', fontSize: 12, padding: '3px 10px', borderRadius: 12,
    margin: 2, cursor: 'pointer', border: '0.5px solid',
    background: on ? '#EEEDFE' : 'var(--color-background-secondary)',
    color: on ? '#3C3489' : 'var(--color-text-secondary)',
    borderColor: on ? '#7F77DD' : 'var(--color-border-tertiary)',
  })
  const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--color-border-tertiary)', fontSize: 13 }
  const btnNav = { fontSize: 13, padding: '7px 18px', borderRadius: 8, border: '0.5px solid var(--color-border-secondary)', background: 'transparent', color: 'var(--color-text-primary)', cursor: 'pointer' }
  const btnPrimary = { ...btnNav, background: '#E1F5EE', color: '#085041', borderColor: '#5DCAA5' }

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Barre de progression */}
      <div style={{ height: 4, background: 'var(--color-border-tertiary)', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.round((step / TOTAL) * 100)}%`, background: '#1D9E75', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      {/* ── ÉTAPE 1 ── */}
      {step === 1 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Accueil &amp; identité du client</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue praticien · Création du dossier</div>
            </div>
          </div>
          <div style={card}>
            <span style={label}>Informations client</span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Prénom &amp; nom</div>
                <input value={nom} onChange={e => setNom(e.target.value)} placeholder="ex. Sophie Legrand" style={{ width: '100%' }} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Âge</div>
                <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="ex. 38" style={{ width: '100%' }} />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>Motif principal</div>
              <input value={motif} onChange={e => setMotif(e.target.value)} placeholder="ex. Stress chronique, manque de confiance..." style={{ width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>Type de séance</div>
              {['1ère séance', 'Suivi', 'Urgence / Rescue'].map(t => (
                <span key={t} style={tag(typeSeance === t)} onClick={() => setTypeSeance(t)}>{t}</span>
              ))}
            </div>
          </div>
          {/* Timeline séances existantes */}
          {client?.id && (
            <div style={card}>
              <span style={label}>Historique des séances</span>
              <SeanceTimeline clientId={client.id} />
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAPE 2 ── */}
      {step === 2 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Entretien émotionnel</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue client · Exploration des états</div>
            </div>
          </div>
          <div style={cardPurple}>
            <div style={{ fontSize: 13, color: '#3C3489', fontWeight: 500, marginBottom: 6 }}>Question d'ouverture</div>
            <div style={{ fontSize: 13, color: '#534AB7', fontStyle: 'italic' }}>"Comment vous sentez-vous en ce moment, dans votre quotidien ?"</div>
          </div>
          <div style={card}>
            <span style={label}>États émotionnels présents</span>
            <div style={{ marginBottom: 6 }}>
              {ETATS.map(e => (
                <span key={e} style={tag(etatsCoches.includes(e))} onClick={() => togEtat(e)}>{e}</span>
              ))}
            </div>
          </div>
          <div style={card}>
            <span style={label}>Score bien-être (client)</span>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Très mal</span>
              {[1,2,3,4,5,6,7,8,9,10].map(v => (
                <button key={v} onClick={() => setScore(v)} style={{
                  width: 36, height: 36, borderRadius: 8, border: '0.5px solid',
                  background: score === v ? '#E1F5EE' : 'transparent',
                  color: score === v ? '#085041' : 'var(--color-text-secondary)',
                  borderColor: score === v ? '#5DCAA5' : 'var(--color-border-secondary)',
                  cursor: 'pointer', fontSize: 14, fontWeight: 500
                }}>{v}</button>
              ))}
              <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Très bien</span>
            </div>
            {score > 0 && <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 8 }}>Score {score}/10 — {scoreLabels[score]}</div>}
          </div>
          <div style={card}>
            <span style={label}>Notes praticien</span>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Événements déclencheurs, contexte familial/professionnel..." style={{ width: '100%', height: 72, fontSize: 13, resize: 'vertical', border: '0.5px solid var(--color-border-secondary)', borderRadius: 8, padding: 8, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }} />
          </div>
        </div>
      )}

      {/* ── ÉTAPE 3 ── */}
      {step === 3 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Sélection des fleurs</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue praticien · Max 7 élixirs</div>
            </div>
          </div>
          {suggestions.length > 0 && (
            <div style={cardTeal}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#085041', marginBottom: 6 }}>✦ Suggestions basées sur l'entretien</div>
              {suggestions.map(f => (
                <span key={f} style={fleurTag(fleursChoisies.includes(f))} onClick={() => togFleur(f)}>+ {f}</span>
              ))}
            </div>
          )}
          <div style={card}>
            <span style={label}>Les 38 élixirs</span>
            <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              Sélectionnés : <strong style={{ color: 'var(--color-text-primary)' }}>{fleursChoisies.length}</strong> / 7
            </div>
            {Object.entries(TOUS_ELIXIRS).map(([cat, fleurs]) => (
              <div key={cat}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', margin: '8px 0 3px' }}>{cat}</div>
                {fleurs.map(f => (
                  <span key={f} style={fleurTag(fleursChoisies.includes(f))} onClick={() => togFleur(f)}>{f}</span>
                ))}
              </div>
            ))}
          </div>
          {fleursChoisies.length >= 7 && (
            <div style={{ ...card, borderColor: '#EF9F27' }}>
              <div style={{ fontSize: 13, color: '#633806' }}>⚠ Maximum 7 fleurs atteint. Désélectionnez-en une pour en choisir une autre.</div>
            </div>
          )}
        </div>
      )}

      {/* ── ÉTAPE 4 ── */}
      {step === 4 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Préparation du flacon</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue praticien · Protocole</div>
            </div>
          </div>
          <div style={cardTeal}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#085041', marginBottom: 10 }}>Flacon personnalisé</div>
            {[
              ['Contenant', 'Flacon 30 ml en verre ambré'],
              ['Base', 'Eau de source (28 ml)'],
              ['Conservateur', 'Brandy 1/4 ou vinaigre de cidre'],
              ['Élixirs retenus', fleursChoisies.length ? fleursChoisies.join(', ') : '—'],
              ['Doses par élixir', '2 gouttes chacun'],
              ['Conservation', '3 semaines · hors chaleur'],
            ].map(([k, v]) => (
              <div key={k} style={{ ...row, borderColor: '#9FE1CB' }}>
                <span style={{ color: '#0F6E56' }}>{k}</span>
                <span style={{ fontWeight: 500, color: '#085041', textAlign: 'right', maxWidth: '60%' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <span style={label}>Étiquette du flacon</span>
            <div style={{ border: '0.5px dashed var(--color-border-secondary)', borderRadius: 8, padding: 12, background: 'var(--color-background-secondary)' }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{nom || 'Client'}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Préparé le {today}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Mélange : <span style={{ color: 'var(--color-text-primary)' }}>{fleursChoisies.join(', ') || '—'}</span></div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>4 gouttes · 4× par jour · sous la langue</div>
            </div>
          </div>
        </div>
      )}

      {/* ── ÉTAPE 5 ── */}
      {step === 5 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>5</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Conseils remis au client</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue client · Mode d'emploi</div>
            </div>
          </div>
          <div style={cardPurple}>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#3C3489', marginBottom: 10 }}>Votre protocole personnalisé</div>
            {[
              ['Posologie', '4 gouttes · 4 fois par jour'],
              ['Moment idéal', 'Matin, midi, goûter, soir'],
              ['Comment', 'Sous la langue ou dans l\'eau'],
              ['À éviter', 'Café, menthe, tabac (30 min avant)'],
              ['Durée', 'Minimum 3 semaines'],
            ].map(([k, v]) => (
              <div key={k} style={{ ...row, borderColor: '#AFA9EC' }}>
                <span style={{ color: '#534AB7' }}>{k}</span>
                <span style={{ fontWeight: 500, color: '#3C3489' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ÉTAPE 6 ── */}
      {step === 6 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#E1F5EE', color: '#085041', fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>6</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Clôture &amp; récapitulatif</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Vue praticien · Bilan de séance</div>
            </div>
          </div>
          <div style={card}>
            <span style={label}>Bilan de la séance</span>
            {[
              ['Client', `${nom || '—'}, ${age || '—'} ans`],
              ['Motif', motif || '—'],
              ['Score bien-être initial', score ? `${score} / 10 — ${scoreLabels[score]}` : '—'],
              ['Mélange', fleursChoisies.length ? fleursChoisies.join(' · ') : '—'],
              ['Prochaine séance', `Vers le ${nextDate()} (J+21)`],
            ].map(([k, v]) => (
              <div key={k} style={{ ...row }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 500, maxWidth: '60%', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={card}>
            <span style={label}>Automatisations NapoCRM</span>
            {[
              { label: 'Email bienvenue + récap', tag: 'Brevo · J+0', color: 'var(--color-text-info)' },
              { label: 'Rappel observance flacon', tag: 'n8n · J+14', color: 'var(--color-text-warning)' },
              { label: 'Invitation bilan & renouvellement', tag: 'n8n · J+21', color: 'var(--color-text-success)' },
              { label: 'Enquête NPS satisfaction', tag: 'Brevo · J+30', color: 'var(--color-text-secondary)' },
            ].map(item => (
              <div key={item.label} style={{ ...row }}>
                <span style={{ fontSize: 13 }}>{item.label}</span>
                <span style={{ fontSize: 11, background: '#E1F5EE', color: '#085041', padding: '2px 8px', borderRadius: 10, fontWeight: 500 }}>{item.tag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 14, borderTop: '0.5px solid var(--color-border-tertiary)' }}>
        <button style={{ ...btnNav, visibility: step > 1 ? 'visible' : 'hidden' }} onClick={() => setStep(s => s - 1)}>← Précédent</button>
        <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>Étape {step} / {TOTAL}</span>
        <button style={btnPrimary} onClick={() => setStep(s => Math.min(TOTAL, s + 1))}>
          {step === TOTAL ? 'Terminer' : 'Suivant →'}
        </button>
      </div>
    </div>
  )
}
