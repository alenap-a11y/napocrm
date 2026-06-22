import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TYPE_STYLE = {
  new:  { bg: '#E6F4EE', color: '#1A7A4A', label: 'Nouveau' },
  maj:  { bg: '#E6F1FB', color: '#185FA5', label: 'Amélioration' },
  fix:  { bg: '#FAEEDA', color: '#854F0B', label: 'Correction' },
}

export default function NewsNapo() {
  const [activeTab, setActiveTab] = useState('changelog')
  const [changelog, setChangelog] = useState([])
  const [roadmap, setRoadmap] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const [{ data: news }, { data: road }] = await Promise.all([
        supabase.from('news').select('*').eq('publie', true).order('created_at', { ascending: false }),
        supabase.from('roadmap').select('*').eq('publie', true).order('ordre'),
      ])
      // Grouper news par version
      const grouped = {}
      ;(news || []).forEach(item => {
        const key = item.version || 'Sans version'
        if (!grouped[key]) grouped[key] = { version: key, date: item.created_at, tag: item.tag, tagLabel: item.tag_label, tagBg: item.tag_bg, tagColor: item.tag_color, items: [] }
        grouped[key].items.push({ type: item.type_item || 'new', text: item.contenu })
      })
      setChangelog(Object.values(grouped))
      setRoadmap(road || [])
      setLoading(false)
    }
    fetchAll()
  }, [])

  const TABS = [
    { id: 'changelog', label: 'Historique versions', icon: 'ti-git-branch' },
    { id: 'roadmap',   label: 'Roadmap',             icon: 'ti-map-2' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-secondary)', fontSize: 13 }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1B2D4F 0%, #243B67 60%, #2E4D85 100%)', padding: '32px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-speakerphone" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              News <span style={{ color: '#7BA7E8' }}>Naposolo</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>Historique des versions · Roadmap · Évolutions à venir</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 28, marginTop: 22 }}>
          {[
            { icon: 'ti-git-commit',  label: changelog[0]?.version || 'Alpha', sub: 'Version actuelle' },
            { icon: 'ti-calendar',    label: 'Avril 2026', sub: 'Début du projet' },
            { icon: 'ti-rocket',      label: `${changelog.length} versions`, sub: 'Publiées' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className={`ti ${s.icon}`} style={{ fontSize: 14, color: '#7BA7E8' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{s.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 18px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#185FA5' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid #185FA5' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.12s',
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />{tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* CHANGELOG */}
        {activeTab === 'changelog' && (
          <div style={{ maxWidth: 720 }}>
            {changelog.length === 0 && <Empty text="Aucune version publiée." />}
            {changelog.map((release, ri) => (
              <div key={release.version} style={{ display: 'flex', gap: 20, marginBottom: 36 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: ri === 0 ? '#1A7A4A' : 'var(--color-border-secondary)', border: `2px solid ${ri === 0 ? '#1A7A4A' : 'var(--color-border-tertiary)'}`, marginTop: 4 }} />
                  {ri < changelog.length - 1 && <div style={{ width: 1, flex: 1, background: 'var(--color-border-tertiary)', marginTop: 6 }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)' }}>{release.version}</span>
                    {release.tag && (
                      <span style={{ fontSize: 10, fontWeight: 600, background: release.tagBg || '#E6F4EE', color: release.tagColor || '#1A7A4A', padding: '2px 8px', borderRadius: 20 }}>{release.tagLabel}</span>
                    )}
                    <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                      {release.date ? new Date(release.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {release.items.map((item, ii) => {
                      const st = TYPE_STYLE[item.type] || TYPE_STYLE.new
                      return (
                        <div key={ii} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, background: st.bg, color: st.color, padding: '2px 7px', borderRadius: 20, whiteSpace: 'nowrap', marginTop: 1 }}>{st.label}</span>
                          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.text}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ROADMAP */}
        {activeTab === 'roadmap' && (
          <div>
            <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24, lineHeight: 1.6, maxWidth: 600 }}>
              Les fonctionnalités ci-dessous sont en cours de développement ou planifiées. Les dates sont indicatives et peuvent évoluer.
            </div>
            {roadmap.length === 0 && <Empty text="Aucune fonctionnalité planifiée pour l'instant." />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {roadmap.map(item => (
                <div key={item.id} style={{ padding: '18px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: item.bg || '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ti ${item.icon || 'ti-rocket'}`} style={{ fontSize: 20, color: item.couleur || '#185FA5' }} />
                    </div>
                    {item.eta && (
                      <span style={{ fontSize: 11, fontWeight: 600, background: '#E6F1FB', color: '#185FA5', padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' }}>{item.eta}</span>
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 5 }}>{item.titre}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.description}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 28, padding: '18px 22px', borderRadius: 12, background: '#EEF3FB', border: '0.5px solid #7BA7E8', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0F1A2E', marginBottom: 3 }}>Une fonctionnalité manque ?</div>
                <div style={{ fontSize: 12, color: '#185FA5' }}>Proposez vos idées — nous construisons Naposolo avec les praticiens.</div>
              </div>
              <a href="mailto:idees@naposolo.com" style={{ flexShrink: 0, padding: '8px 18px', borderRadius: 8, border: 'none', background: '#185FA5', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Suggérer
              </a>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Empty({ text }) {
  return <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, padding: '2rem 0' }}>{text}</div>
}
