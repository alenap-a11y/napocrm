import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import napopetit from '../assets/napopetitv1.png'

export default function LoginPage({ deniedMessage, onDeniedShown }) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Message de refus de rôle remonté par App.jsx (connexion réussie mais
  // compte client, pas praticien) — arrive après le signOut.
  useEffect(() => {
    if (deniedMessage) {
      setError(deniedMessage)
      onDeniedShown?.()
    }
  }, [deniedMessage, onDeniedShown])
  const [resetOpen, setResetOpen] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  async function handleResetPassword() {
    if (!resetEmail.trim()) { setResetError('Entrez votre adresse email.'); return }
    setResetLoading(true); setResetError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo: window.location.origin + '/reset-password' })
      if (error) throw error
      supabase.from('system_email_stats').insert({ event_type: 'password_reset' }).then(({ error }) => { if (error) console.error('stats insert failed:', error) })
      setResetSent(true)
    } catch (e) { setResetError('Erreur: ' + e.message) }
    setResetLoading(false)
  }

  function closeReset() { setResetOpen(false); setResetEmail(''); setResetSent(false); setResetError('') }

  async function handleLogin(e) {
    e.preventDefault(); setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', color: '#111827', background: '#f0f9ff', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 420, border: '0.5px solid rgba(14,165,233,0.2)', boxShadow: '0 8px 40px rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <img src={napopetit} alt="Naposolo" style={{ height: 28 }} />
          <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>Naposolo</span>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Connexion</div>
          <div style={{ fontSize: 13, color: '#9ca3af' }}>Accédez à votre espace Naposolo</div>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13 }}><i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} />{error}</div>}
          <div>
            <label style={labelStyle}>Email</label>
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Mot de passe</label>
            <input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: '#6b7280' }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#0EA5E9', width: 14, height: 14, cursor: 'pointer' }} />
              Se souvenir de moi
            </label>
            <button type="button" onClick={() => { setResetOpen(true); setResetEmail(email) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#0EA5E9', fontWeight: 500 }}>Mot de passe oublié ?</button>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '11px', borderRadius: 9, border: 'none', minHeight: 44, background: loading ? '#7dd3fc' : '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            Pas encore de compte ?{' '}
            <button type="button" onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0EA5E9', fontWeight: 600 }}>Rejoindre l'alpha</button>
          </div>
        </form>
      </div>

      {resetOpen && (
        <div onClick={e => e.target === e.currentTarget && closeReset()} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 400, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Mot de passe oublié ?</div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Nous vous enverrons un lien de réinitialisation.</div>
              </div>
              <button onClick={closeReset} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9ca3af', lineHeight: 1, padding: 0 }}>×</button>
            </div>
            {resetSent ? (
              <div style={{ padding: '16px', borderRadius: 10, background: '#EAF3DE', color: '#3B6D11', fontSize: 14, lineHeight: 1.6, textAlign: 'center' }}>
                <i className="ti ti-mail-check" style={{ fontSize: 24, display: 'block', marginBottom: 8 }} />
                Email envoyé, vérifiez votre boîte mail.
                <button onClick={closeReset} style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#0F6E56', fontSize: 12, textDecoration: 'underline' }}>Fermer</button>
              </div>
            ) : (
              <>
                {resetError && <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 8, background: '#FCEBEB', color: '#A32D2D', fontSize: 13, marginBottom: 14 }}><i className="ti ti-alert-circle" style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }} />{resetError}</div>}
                <label style={labelStyle}>Email</label>
                <input type="email" autoFocus value={resetEmail} onChange={e => setResetEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleResetPassword()} placeholder="vous@exemple.com" style={{ ...inputStyle, marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={closeReset} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '0.5px solid #d1d5db', background: 'transparent', color: '#6b7280', fontSize: 14, cursor: 'pointer' }}>Annuler</button>
                  <button onClick={handleResetPassword} disabled={resetLoading} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: resetLoading ? '#7dd3fc' : '#0EA5E9', color: '#fff', fontSize: 14, fontWeight: 600, cursor: resetLoading ? 'not-allowed' : 'pointer', minHeight: 44 }}>
                    {resetLoading ? 'Envoi…' : 'Envoyer le lien'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }
const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: 8, minHeight: 44,
  border: '0.5px solid #d1d5db', background: '#f9fafb',
  color: '#111827', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color .15s',
}
