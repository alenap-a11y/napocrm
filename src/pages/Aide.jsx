import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Aide() {
  const [activeTab, setActiveTab] = useState('demarrage')
  const [data, setData] = useState({ demarrage: [], ressources: [], support: [], raccourcis: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const { data: items } = await supabase
        .from('aide')
        .select('*')
        .eq('publie', true)
        .order('ordre')
      if (items) {
        setData({
          demarrage:  items.filter(i => i.categorie === 'demarrage'),
          ressources: items.filter(i => i.categorie === 'ressources'),
          support:    items.filter(i => i.categorie === 'support'),
          raccourcis: items.filter(i => i.categorie === 'raccourcis'),
        })
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const TABS = [
    { id: 'demarrage',  label: 'Démarrage',  icon: 'ti-rocket' },
    { id: 'ressources', label: 'Ressources', icon: 'ti-books' },
    { id: 'support',    label: 'Support',    icon: 'ti-lifebuoy' },
    { id: 'raccourcis', label: 'Raccourcis', icon: 'ti-keyboard' },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--color-text-secondary)', fontSize: 13 }}>
      Chargement...
    </div>
  )

  return (
    <div style={{ fontFamily: 'inherit', minHeight: '100vh' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #085041 0%, #0F6E56 60%, #1D9E75 100%)', padding: '32px 32px 36px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ti ti-lifebuoy" style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>Centre d'aide</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 }}>Guides, ressources et support — tout pour bien utiliser Naposolo</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ padding: '0 32px', borderBottom: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', display: 'flex', gap: 0 }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13,
            fontWeight: activeTab === tab.id ? 600 : 400,
            color: activeTab === tab.id ? '#0F6E56' : 'var(--color-text-secondary)',
            borderBottom: activeTab === tab.id ? '2px solid #0F6E56' : '2px solid transparent',
            marginBottom: -1, transition: 'color 0.12s', whiteSpace: 'nowrap',
          }}>
            <i className={`ti ${tab.icon}`} style={{ fontSize: 14 }} />
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* DÉMARRAGE */}
        {activeTab === 'demarrage' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Guide de démarrage rapide</div>
            {data.demarrage.length === 0 && <Empty />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.demarrage.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: '16px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg || '#E1F5EE', color: item.couleur || '#0F6E56', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {item.numero || String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>{item.titre}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.contenu}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RESSOURCES */}
        {activeTab === 'ressources' && (
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Ressources disponibles</div>
            {data.ressources.length === 0 && <Empty />}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {data.ressources.map(item => (
                <div key={item.id} style={{ padding: '20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: item.bg || '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`ti ${item.icon || 'ti-file'}`} style={{ fontSize: 20, color: item.couleur || '#0F6E56' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>{item.titre}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{item.contenu}</div>
                  </div>
                  {item.lien && (
                    <a href={item.lien} style={{ marginTop: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: item.couleur || '#0F6E56', textDecoration: 'none' }}>
                      {item.cta || 'Accéder'} <i className="ti ti-arrow-right" style={{ fontSize: 13 }} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUPPORT */}
        {activeTab === 'support' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Contacter le support</div>
            {data.support.length === 0 && <Empty />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.support.map(item => (
                <div key={item.id} style={{ display: 'flex', gap: 16, padding: '18px 20px', borderRadius: 12, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', alignItems: 'flex-start' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: item.bg || '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <i className={`ti ${item.icon || 'ti-mail'}`} style={{ fontSize: 20, color: item.couleur || '#0F6E56' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 2 }}>{item.titre}</div>
                    {item.sous_titre && <div style={{ fontSize: 13, fontWeight: 500, color: item.couleur || '#0F6E56', marginBottom: 4 }}>{item.sous_titre}</div>}
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{item.contenu}</div>
                  </div>
                  {item.lien && (
                    <a href={item.lien} style={{ flexShrink: 0, padding: '7px 14px', borderRadius: 8, border: `0.5px solid ${item.couleur || '#0F6E56'}44`, background: item.bg || '#E1F5EE', color: item.couleur || '#0F6E56', fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      {item.cta || 'Contacter'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RACCOURCIS */}
        {activeTab === 'raccourcis' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 20 }}>Raccourcis clavier</div>
            {data.raccourcis.length === 0 && <Empty />}
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 12, border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden' }}>
              {data.raccourcis.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: i < data.raccourcis.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none' }}>
                  <span style={{ fontSize: 13, color: 'var(--color-text-primary)' }}>{item.titre}</span>
                  <kbd style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                    {item.sous_titre || item.contenu}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Empty() {
  return (
    <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, padding: '2rem 0' }}>
      Aucun contenu publié pour le moment.
    </div>
  )
}
